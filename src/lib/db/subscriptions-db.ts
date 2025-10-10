/**
 * Email Subscriptions Database
 *
 * Server-side storage for email subscriptions (using JSON file for simplicity)
 * In production, use a proper database like PostgreSQL, MongoDB, etc.
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { EmailSubscription, NotificationPreferences } from '@/lib/types/notifications';

// Store subscriptions in a JSON file (for development)
// In production, replace with a proper database
const DB_PATH = path.join(process.cwd(), 'data', 'subscriptions.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read subscriptions from file
async function readSubscriptions(): Promise<EmailSubscription[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist yet, return empty array
    return [];
  }
}

// Write subscriptions to file
async function writeSubscriptions(subscriptions: EmailSubscription[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DB_PATH, JSON.stringify(subscriptions, null, 2), 'utf-8');
}

// Generate unique ID
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Generate unsubscribe token
function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  email: string,
  coordinates: { lat: number; lon: number },
  preferences: NotificationPreferences,
  location?: string
): Promise<EmailSubscription> {
  const subscriptions = await readSubscriptions();

  // Check if email already exists
  const existing = subscriptions.find((sub) => sub.email === email);
  if (existing) {
    throw new Error('Email already subscribed');
  }

  const subscription: EmailSubscription = {
    id: generateId(),
    email,
    coordinates,
    location,
    preferences,
    isActive: false, // Requires verification
    createdAt: new Date().toISOString(),
    unsubscribeToken: generateUnsubscribeToken(),
  };

  subscriptions.push(subscription);
  await writeSubscriptions(subscriptions);

  console.log('[Subscriptions] Created:', subscription.id);
  return subscription;
}

/**
 * Verify a subscription
 */
export async function verifySubscription(id: string): Promise<EmailSubscription | null> {
  const subscriptions = await readSubscriptions();
  const subscription = subscriptions.find((sub) => sub.id === id);

  if (!subscription) {
    return null;
  }

  subscription.isActive = true;
  subscription.verifiedAt = new Date().toISOString();

  await writeSubscriptions(subscriptions);

  console.log('[Subscriptions] Verified:', subscription.id);
  return subscription;
}

/**
 * Get a subscription by ID
 */
export async function getSubscription(id: string): Promise<EmailSubscription | null> {
  const subscriptions = await readSubscriptions();
  return subscriptions.find((sub) => sub.id === id) || null;
}

/**
 * Get a subscription by email
 */
export async function getSubscriptionByEmail(email: string): Promise<EmailSubscription | null> {
  const subscriptions = await readSubscriptions();
  return subscriptions.find((sub) => sub.email === email) || null;
}

/**
 * Get all active subscriptions
 */
export async function getActiveSubscriptions(): Promise<EmailSubscription[]> {
  const subscriptions = await readSubscriptions();
  return subscriptions.filter((sub) => sub.isActive);
}

/**
 * Update subscription preferences
 */
export async function updateSubscriptionPreferences(
  id: string,
  preferences: Partial<NotificationPreferences>
): Promise<EmailSubscription | null> {
  const subscriptions = await readSubscriptions();
  const subscription = subscriptions.find((sub) => sub.id === id);

  if (!subscription) {
    return null;
  }

  subscription.preferences = {
    ...subscription.preferences,
    ...preferences,
  };

  await writeSubscriptions(subscriptions);

  console.log('[Subscriptions] Updated preferences:', subscription.id);
  return subscription;
}

/**
 * Update last notified timestamp
 */
export async function updateLastNotified(id: string): Promise<void> {
  const subscriptions = await readSubscriptions();
  const subscription = subscriptions.find((sub) => sub.id === id);

  if (subscription) {
    subscription.lastNotified = new Date().toISOString();
    await writeSubscriptions(subscriptions);
  }
}

/**
 * Unsubscribe by token
 */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const subscriptions = await readSubscriptions();
  const subscription = subscriptions.find((sub) => sub.unsubscribeToken === token);

  if (!subscription) {
    return false;
  }

  subscription.isActive = false;

  await writeSubscriptions(subscriptions);

  console.log('[Subscriptions] Unsubscribed:', subscription.id);
  return true;
}

/**
 * Delete a subscription
 */
export async function deleteSubscription(id: string): Promise<boolean> {
  const subscriptions = await readSubscriptions();
  const index = subscriptions.findIndex((sub) => sub.id === id);

  if (index === -1) {
    return false;
  }

  subscriptions.splice(index, 1);
  await writeSubscriptions(subscriptions);

  console.log('[Subscriptions] Deleted:', id);
  return true;
}

/**
 * Get subscriptions that need notifications
 * (based on frequency and last notified time)
 */
export async function getSubscriptionsNeedingNotifications(): Promise<EmailSubscription[]> {
  const subscriptions = await getActiveSubscriptions();
  const now = Date.now();

  return subscriptions.filter((sub) => {
    // Immediate notifications - always check
    if (sub.preferences.frequency === 'immediate') {
      return true;
    }

    // Daily notifications - check if 24 hours have passed
    if (sub.preferences.frequency === 'daily') {
      if (!sub.lastNotified) return true;
      const lastNotified = new Date(sub.lastNotified).getTime();
      return now - lastNotified >= 24 * 60 * 60 * 1000;
    }

    // Weekly notifications - check if 7 days have passed
    if (sub.preferences.frequency === 'weekly') {
      if (!sub.lastNotified) return true;
      const lastNotified = new Date(sub.lastNotified).getTime();
      return now - lastNotified >= 7 * 24 * 60 * 60 * 1000;
    }

    return false;
  });
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  byFrequency: Record<string, number>;
}> {
  const subscriptions = await readSubscriptions();

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((sub) => sub.isActive).length,
    inactive: subscriptions.filter((sub) => !sub.isActive).length,
    byFrequency: {
      immediate: 0,
      daily: 0,
      weekly: 0,
    } as Record<string, number>,
  };

  subscriptions.forEach((sub) => {
    if (sub.isActive) {
      stats.byFrequency[sub.preferences.frequency] = (stats.byFrequency[sub.preferences.frequency] || 0) + 1;
    }
  });

  return stats;
}
