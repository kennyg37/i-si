import type { EmailSubscription, NotificationPreferences } from '@/lib/types/notifications';

const SCRIPT_URL = process.env.GOOGLE_SHEETS_SCRIPT_URL;

if (!SCRIPT_URL) {
  console.warn('GOOGLE_SHEETS_SCRIPT_URL not configured');
}

async function callScript(action: string, method: 'GET' | 'POST' = 'GET', data?: any) {
  if (!SCRIPT_URL) {
    throw new Error('GOOGLE_SHEETS_SCRIPT_URL not configured');
  }

  let url = `${SCRIPT_URL}?action=${action}`;

  if (method === 'GET' && data) {
    Object.keys(data).forEach(key => {
      url += `&${key}=${encodeURIComponent(data[key])}`;
    });
  }

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (method === 'POST' && data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Google Sheets API error: ${response.statusText}`);
  }

  return response.json();
}

export async function createSubscription(
  email: string,
  coordinates: { lat: number; lon: number },
  preferences: NotificationPreferences,
  location?: string
): Promise<EmailSubscription> {
  return callScript('create', 'POST', {
    email,
    coordinates,
    preferences,
    location,
  });
}

export async function verifySubscription(id: string): Promise<EmailSubscription | null> {
  return callScript('verify', 'POST', { id });
}

export async function getSubscription(id: string): Promise<EmailSubscription | null> {
  return callScript('getById', 'GET', { id });
}

export async function getSubscriptionByEmail(email: string): Promise<EmailSubscription | null> {
  return callScript('getByEmail', 'GET', { email });
}

export async function getActiveSubscriptions(): Promise<EmailSubscription[]> {
  return callScript('getActive', 'GET');
}

export async function updateSubscriptionPreferences(
  id: string,
  preferences: Partial<NotificationPreferences>
): Promise<EmailSubscription | null> {
  return callScript('update', 'POST', { id, preferences });
}

export async function updateLastNotified(id: string): Promise<void> {
  await callScript('updateLastNotified', 'POST', { id });
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const result = await callScript('unsubscribe', 'POST', { token });
  return result.success;
}

export async function deleteSubscription(id: string): Promise<boolean> {
  const result = await callScript('delete', 'POST', { id });
  return result.success;
}

export async function getSubscriptionsNeedingNotifications(): Promise<EmailSubscription[]> {
  return callScript('getNeedingNotifications', 'GET');
}

export async function getSubscriptionStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  byFrequency: Record<string, number>;
}> {
  return callScript('getStats', 'GET');
}
