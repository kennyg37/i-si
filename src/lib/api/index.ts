// Centralized API exports
export { nasaPowerAPI, NASAPowerAPI } from './nasa-power';
export { sentinelHubAPI, SentinelHubAPI } from './sentinel-hub';
export { srtmAPI, SRTMAPI } from './srtm';

// Safe fetch utility for fallback data
export const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.warn(`Failed to fetch ${url}:`, error);
    return null;
  }
};

// API configuration
export const API_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000
};

// Common error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Rate limiting utility
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number = 100, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}
