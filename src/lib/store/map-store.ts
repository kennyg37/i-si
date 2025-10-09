import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  Coordinates,
  GeoLocation,
  MapViewport,
  MapMarker,
  LayerType,
  MapClickEvent
} from '@/types';

interface MapState {
  // Selected location state
  selectedLocation: GeoLocation | null;
  clickedCoordinates: Coordinates | null;

  // Viewport state
  viewport: MapViewport;

  // Markers and layers
  markers: MapMarker[];
  activeLayers: LayerType[];

  // Interaction state
  isMapLoaded: boolean;
  hoveredFeature: GeoJSON.Feature | null;

  // Actions
  setSelectedLocation: (location: GeoLocation | null) => void;
  setClickedCoordinates: (coordinates: Coordinates | null) => void;
  handleMapClick: (event: MapClickEvent) => void;
  setViewport: (viewport: Partial<MapViewport>) => void;
  addMarker: (marker: MapMarker) => void;
  removeMarker: (markerId: string) => void;
  clearMarkers: () => void;
  toggleLayer: (layer: LayerType) => void;
  setActiveLayers: (layers: LayerType[]) => void;
  setMapLoaded: (loaded: boolean) => void;
  setHoveredFeature: (feature: GeoJSON.Feature | null) => void;
  resetMapState: () => void;
}

// Rwanda default viewport
const RWANDA_DEFAULT_VIEWPORT: MapViewport = {
  latitude: -1.9403,
  longitude: 29.8739,
  zoom: 8.5,
  bearing: 0,
  pitch: 0,
};

export const useMapStore = create<MapState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedLocation: null,
        clickedCoordinates: null,
        viewport: RWANDA_DEFAULT_VIEWPORT,
        markers: [],
        activeLayers: [],
        isMapLoaded: false,
        hoveredFeature: null,

        // Set selected location with full details
        setSelectedLocation: (location) => {
          set({ selectedLocation: location }, false, 'setSelectedLocation');

          if (location) {
            // Update clicked coordinates when setting location
            set({
              clickedCoordinates: location.coordinates
            }, false, 'updateClickedCoordinates');

            // Add or update marker for this location
            const existingMarkerIndex = get().markers.findIndex(
              m => m.type === 'selected'
            );

            const newMarker: MapMarker = {
              id: `selected-${Date.now()}`,
              coordinates: location.coordinates,
              type: 'selected',
              label: location.name || `${location.coordinates.lat.toFixed(4)}, ${location.coordinates.lon.toFixed(4)}`,
            };

            if (existingMarkerIndex !== -1) {
              // Replace existing selected marker
              const markers = [...get().markers];
              markers[existingMarkerIndex] = newMarker;
              set({ markers }, false, 'replaceSelectedMarker');
            } else {
              // Add new marker
              get().addMarker(newMarker);
            }
          }
        },

        // Set clicked coordinates
        setClickedCoordinates: (coordinates) => {
          set({ clickedCoordinates: coordinates }, false, 'setClickedCoordinates');
        },

        // Handle map click event - centralized click handler
        handleMapClick: (event) => {
          const { coordinates, features } = event;

          // Update clicked coordinates
          set({ clickedCoordinates: coordinates }, false, 'handleMapClick');

          // Create or update selected location
          const location: GeoLocation = {
            coordinates,
            name: `Location ${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}`,
          };

          get().setSelectedLocation(location);

          // Log for debugging
          console.log('Map clicked:', {
            coordinates,
            lat: coordinates.lat,
            lon: coordinates.lon,
            timestamp: event.timestamp,
            features: features?.length || 0,
          });
        },

        // Set viewport
        setViewport: (partialViewport) => {
          set(
            (state) => ({
              viewport: { ...state.viewport, ...partialViewport },
            }),
            false,
            'setViewport'
          );
        },

        // Add marker
        addMarker: (marker) => {
          set(
            (state) => ({
              markers: [...state.markers, marker],
            }),
            false,
            'addMarker'
          );
        },

        // Remove marker by ID
        removeMarker: (markerId) => {
          set(
            (state) => ({
              markers: state.markers.filter((m) => m.id !== markerId),
            }),
            false,
            'removeMarker'
          );
        },

        // Clear all markers
        clearMarkers: () => {
          set({ markers: [] }, false, 'clearMarkers');
        },

        // Toggle layer visibility
        toggleLayer: (layer) => {
          set(
            (state) => {
              const isActive = state.activeLayers.includes(layer);
              const activeLayers = isActive
                ? state.activeLayers.filter((l) => l !== layer)
                : [...state.activeLayers, layer];

              return { activeLayers };
            },
            false,
            'toggleLayer'
          );
        },

        // Set active layers
        setActiveLayers: (layers) => {
          set({ activeLayers: layers }, false, 'setActiveLayers');
        },

        // Set map loaded state
        setMapLoaded: (loaded) => {
          set({ isMapLoaded: loaded }, false, 'setMapLoaded');
        },

        // Set hovered feature
        setHoveredFeature: (feature) => {
          set({ hoveredFeature: feature }, false, 'setHoveredFeature');
        },

        // Reset map state to defaults
        resetMapState: () => {
          set(
            {
              selectedLocation: null,
              clickedCoordinates: null,
              viewport: RWANDA_DEFAULT_VIEWPORT,
              markers: [],
              activeLayers: [],
              hoveredFeature: null,
            },
            false,
            'resetMapState'
          );
        },
      }),
      {
        name: 'map-storage',
        partialize: (state) => ({
          // Only persist certain fields
          viewport: state.viewport,
          activeLayers: state.activeLayers,
        }),
      }
    ),
    { name: 'MapStore' }
  )
);

// Selectors for optimized component access
export const useSelectedLocation = () => useMapStore((state) => state.selectedLocation);
export const useClickedCoordinates = () => useMapStore((state) => state.clickedCoordinates);
export const useViewport = () => useMapStore((state) => state.viewport);
export const useMarkers = () => useMapStore((state) => state.markers);
export const useActiveLayers = () => useMapStore((state) => state.activeLayers);
export const useIsMapLoaded = () => useMapStore((state) => state.isMapLoaded);
