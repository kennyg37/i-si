import { Coordinates } from "@/types"
import { useEffect, useState } from "react"
import axios from "axios"

export interface PreciseLocation {
    category?: string,
    type?: string,
    addressType?: string
    displayName?: string
}

export const useGetPreciseLocation = (coordinates: Coordinates | null) => {
    const [location, setLocation] = useState<string | null>(null)
    const [loading, setIsloading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    

    const fetchData = async(coordinates: Coordinates) => {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.lat}&lon=${coordinates.lon}&format=json`
        try {
            const response = await axios.get(url)
            return response.data.display_name
        } catch(err: any) {
            const errorMessage = err?.message || String(err)
            setError(errorMessage)
            console.error(err)
        }
    }

    useEffect(() => {
        if (!coordinates) {
            setLocation(null)
            setError(null)
            setIsloading(false)
            return
        }

        setIsloading(true)
        setError(null)
        fetchData(coordinates)
        .then(data => {
            setLocation(data)
            setIsloading(false)
        })
        .catch(err => {
            const errorMessage = err?.message || String(err)
            setError(errorMessage)
            setIsloading(false)
        })
    }, [coordinates])

    return {location, error, loading}
}