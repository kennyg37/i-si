import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { InsightsContext, InsightsSummary } from '@/types';

interface InsightsState extends InsightsContext {
  // Actions
  setTimeRange: (timeRange: number) => void;
  setActiveTab: (tab: string) => void;
  setViewMode: (mode: 'current' | 'historical') => void;
  setChartType: (type: 'line' | 'bar' | 'area') => void;
  setLocation: (location: InsightsContext['location']) => void;
  setSummary: (summary: InsightsSummary | null) => void;
  updateContext: (partial: Partial<InsightsContext>) => void;
  resetInsightsState: () => void;
}

const INITIAL_STATE: InsightsContext = {
  timeRange: 30,
  activeTab: 'overview',
  viewMode: 'current',
  chartType: 'line',
  location: null,
  summary: null,
  lastUpdated: new Date().toISOString(),
};

export const useInsightsStore = create<InsightsState>()(
  devtools(
    persist(
      (set) => ({
        ...INITIAL_STATE,

        setTimeRange: (timeRange) =>
          set({ timeRange, lastUpdated: new Date().toISOString() }, false, 'setTimeRange'),

        setActiveTab: (activeTab) =>
          set({ activeTab }, false, 'setActiveTab'),

        setViewMode: (viewMode) =>
          set({ viewMode }, false, 'setViewMode'),

        setChartType: (chartType) =>
          set({ chartType }, false, 'setChartType'),

        setLocation: (location) =>
          set({ location, lastUpdated: new Date().toISOString() }, false, 'setLocation'),

        setSummary: (summary) =>
          set({ summary, lastUpdated: new Date().toISOString() }, false, 'setSummary'),

        updateContext: (partial) =>
          set({ ...partial, lastUpdated: new Date().toISOString() }, false, 'updateContext'),

        resetInsightsState: () =>
          set(INITIAL_STATE, false, 'resetInsightsState'),
      }),
      {
        name: 'insights-storage',
        partialize: (state) => ({
          // Only persist user preferences, not data
          timeRange: state.timeRange,
          activeTab: state.activeTab,
          viewMode: state.viewMode,
          chartType: state.chartType,
          // Don't persist summary or location - they're session data
        }),
      }
    ),
    { name: 'InsightsStore' }
  )
);

// Selectors for optimized component access
export const useInsightsTimeRange = () => useInsightsStore((state) => state.timeRange);
export const useInsightsSummary = () => useInsightsStore((state) => state.summary);
export const useInsightsContext = () => useInsightsStore((state) => ({
  timeRange: state.timeRange,
  activeTab: state.activeTab,
  viewMode: state.viewMode,
  location: state.location,
  summary: state.summary,
}));

/**
 * Helper function to build InsightsSummary from stats data
 */
export function buildInsightsSummary(stats: any): InsightsSummary | null {
  if (!stats) return null;

  return {
    temperature: {
      average: stats.temperature?.average || 0,
      min: stats.temperature?.min || 0,
      max: stats.temperature?.max || 0,
      trend: stats.temperature?.trend || 'stable',
    },
    precipitation: {
      total: stats.precipitation?.total || 0,
      average: stats.precipitation?.average || 0,
      max: stats.precipitation?.max || 0,
      rainyDays: stats.precipitation?.rainyDays || 0,
    },
    humidity: stats.humidity ? {
      average: stats.humidity.average || 0,
      min: stats.humidity.min || 0,
      max: stats.humidity.max || 0,
    } : undefined,
    wind: stats.wind ? {
      average: stats.wind.average || 0,
      max: stats.wind.max || 0,
    } : undefined,
    solar: stats.solar ? {
      average: stats.solar.average || 0,
    } : undefined,
  };
}
