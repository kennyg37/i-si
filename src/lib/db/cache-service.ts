/**
 * IndexedDB Caching Service
 *
 * Provides offline-first data caching for climate data
 *
 * Benefits:
 * - Works offline after first load
 * - Reduces API calls (faster, respects rate limits)
 * - Instant data loading from cache
 * - Automatic cache invalidation
 *
 * Storage Strategy:
 * - Historical data: Cache for 30 days (rarely changes)
 * - Current weather: Cache for 30 minutes
 * - Forecasts: Cache for 6 hours
 * - User reports: Real-time (not cached)
 */

// IndexedDB database name and version
const DB_NAME = 'ClimateRiskCache';
const DB_VERSION = 1;

// Object store names
const STORES = {
  HISTORICAL_WEATHER: 'historical_weather',
  FORECASTS: 'forecasts',
  EXTREME_EVENTS: 'extreme_events',
  LANDSLIDES: 'landslides',
  FLOODS: 'floods',
  CLIMATE_INDICES: 'climate_indices',
} as const;

// Cache durations (in milliseconds)
const CACHE_DURATION = {
  HISTORICAL: 30 * 24 * 60 * 60 * 1000, // 30 days
  CURRENT: 30 * 60 * 1000, // 30 minutes
  FORECAST: 6 * 60 * 60 * 1000, // 6 hours
  EVENTS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Initialize IndexedDB
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available (server-side)'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      });
    };
  });
}

/**
 * Generic cache get function
 */
export async function getCachedData<T>(
  storeName: string,
  key: string
): Promise<T | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;

        if (!entry) {
          resolve(null);
          return;
        }

        // Check if cache has expired
        if (Date.now() > entry.expiresAt) {
          console.log(`[Cache] Expired: ${storeName}/${key}`);
          // Delete expired entry
          const deleteTransaction = db.transaction(storeName, 'readwrite');
          const deleteStore = deleteTransaction.objectStore(storeName);
          deleteStore.delete(key);
          resolve(null);
          return;
        }

        console.log(`[Cache] Hit: ${storeName}/${key}`);
        resolve(entry.data);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Cache] Error getting data:', error);
    return null;
  }
}

/**
 * Generic cache set function
 */
export async function setCachedData<T>(
  storeName: string,
  key: string,
  data: T,
  durationMs: number
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + durationMs,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(entry);

      request.onsuccess = () => {
        console.log(`[Cache] Stored: ${storeName}/${key}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Cache] Error setting data:', error);
  }
}

/**
 * Clear expired entries from a store
 */
export async function clearExpiredEntries(storeName: string): Promise<number> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const index = store.index('expiresAt');

    const now = Date.now();
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;

        if (cursor) {
          const entry = cursor.value as CacheEntry<any>;

          if (entry.expiresAt < now) {
            cursor.delete();
            deletedCount++;
          }

          cursor.continue();
        } else {
          console.log(`[Cache] Cleared ${deletedCount} expired entries from ${storeName}`);
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Cache] Error clearing expired entries:', error);
    return 0;
  }
}

/**
 * Clear all data from a store
 */
export async function clearStore(storeName: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`[Cache] Cleared all data from ${storeName}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Cache] Error clearing store:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  stores: Record<string, { count: number; oldestEntry: number; newestEntry: number }>;
}> {
  try {
    const db = await openDatabase();
    const stats: any = { stores: {} };

    for (const storeName of Object.values(STORES)) {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);

      const count = await new Promise<number>((resolve) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
      });

      const index = store.index('timestamp');

      const oldest = await new Promise<number>((resolve) => {
        const request = index.openCursor(null, 'next');
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          resolve(cursor ? cursor.value.timestamp : 0);
        };
      });

      const newest = await new Promise<number>((resolve) => {
        const request = index.openCursor(null, 'prev');
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          resolve(cursor ? cursor.value.timestamp : 0);
        };
      });

      stats.stores[storeName] = { count, oldestEntry: oldest, newestEntry: newest };
    }

    return stats;
  } catch (error) {
    console.error('[Cache] Error getting stats:', error);
    return { stores: {} };
  }
}

/**
 * Specialized cache functions for different data types
 */

// Historical weather cache
export const historicalWeatherCache = {
  get: (key: string) => getCachedData(STORES.HISTORICAL_WEATHER, key),
  set: (key: string, data: any) =>
    setCachedData(STORES.HISTORICAL_WEATHER, key, data, CACHE_DURATION.HISTORICAL),
};

// Forecast cache
export const forecastCache = {
  get: (key: string) => getCachedData(STORES.FORECASTS, key),
  set: (key: string, data: any) =>
    setCachedData(STORES.FORECASTS, key, data, CACHE_DURATION.FORECAST),
};

// Extreme events cache
export const extremeEventsCache = {
  get: (key: string) => getCachedData(STORES.EXTREME_EVENTS, key),
  set: (key: string, data: any) =>
    setCachedData(STORES.EXTREME_EVENTS, key, data, CACHE_DURATION.EVENTS),
};

// Landslides cache
export const landslidesCache = {
  get: (key: string) => getCachedData(STORES.LANDSLIDES, key),
  set: (key: string, data: any) =>
    setCachedData(STORES.LANDSLIDES, key, data, CACHE_DURATION.HISTORICAL),
};

// Floods cache
export const floodsCache = {
  get: (key: string) => getCachedData(STORES.FLOODS, key),
  set: (key: string, data: any) =>
    setCachedData(STORES.FLOODS, key, data, CACHE_DURATION.EVENTS),
};

// Climate indices cache
export const climateIndicesCache = {
  get: (key: string) => getCachedData(STORES.CLIMATE_INDICES, key),
  set: (key: string, data: any) =>
    setCachedData(STORES.CLIMATE_INDICES, key, data, CACHE_DURATION.HISTORICAL),
};

/**
 * Helper to generate cache keys
 */
export function generateCacheKey(
  type: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return `${type}:${sortedParams}`;
}

/**
 * Cleanup function - run periodically to remove expired entries
 */
export async function cleanupCache(): Promise<void> {
  console.log('[Cache] Running cleanup...');

  for (const storeName of Object.values(STORES)) {
    await clearExpiredEntries(storeName);
  }

  console.log('[Cache] Cleanup complete');
}

// Run cleanup on initialization (client-side only)
if (typeof window !== 'undefined') {
  // Clean up expired entries every hour
  setInterval(cleanupCache, 60 * 60 * 1000);

  // Initial cleanup
  cleanupCache().catch(console.error);
}
