"use client";

import { useGeolocation } from "@/hooks/use-geolocation";
import { Coordinates } from "@/types";
import { useEffect } from "react";
import { useMapStore } from "@/lib/store/map-store";
import { Button } from "@/components/ui/button";
import { useGetPreciseLocation } from "@/hooks/use-getPrecise-location.";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const LiveLocation = () => {
    const {
        selectedLocation,
        setSelectedLocation
    } = useMapStore()

    const {
        location: preciseLocation,
        error: preciseLocationError,
        loading: preciseLocationLoading
    } = useGetPreciseLocation(selectedLocation?.coordinates ?? null)

    const { coordinates: geoCoordinates, isLoading: isGeoLoading, getLocation, error: geoError } = useGeolocation()

    useEffect(() => {
        if (geoCoordinates && !geoError) {
            const newLocation: Coordinates = {
                lat: geoCoordinates.lat,
                lon: geoCoordinates.lon
            }
            setSelectedLocation({
                coordinates: newLocation,
            })
        }
    }, [geoCoordinates, geoError, setSelectedLocation]);

    return (
        <div className="flex items-center">
            {!geoCoordinates ? (
                <Button
                    onClick={getLocation}
                    disabled={isGeoLoading}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                >
                    {isGeoLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">Locating...</span>
                        </>
                    ) : (
                        <>
                            <MapPin className="h-4 w-4" />
                            <span className="hidden sm:inline">My Location</span>
                        </>
                    )}
                </Button>
            ) : (
                <div className={cn(
                    "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm",
                    "bg-background/50 border shadow-xs"
                )}>
                    {preciseLocationLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="hidden md:inline text-muted-foreground">Loading...</span>
                        </>
                    ) : preciseLocationError ? (
                        <>
                            <MapPin className="h-4 w-4 text-destructive" />
                            <span className="hidden md:inline text-destructive text-xs">Location error</span>
                        </>
                    ) : (
                        <>
                            <MapPin className="h-4 w-4 text-primary" />
                            <span
                                className="hidden md:inline text-foreground max-w-[200px] truncate cursor-default"
                                title={preciseLocation || 'Unknown'}
                            >
                                {preciseLocation || 'Unknown'}
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}