// Geocoding utility using OpenStreetMap Nominatim (free, no API key required)

export interface GeoLocation {
  lat: number
  lng: number
  display_name?: string
}

/**
 * Geocode an address string to coordinates using OpenStreetMap Nominatim
 * Biased towards Riyadh, Saudi Arabia for better local results
 */
export async function geocodeAddress(
  address: string
): Promise<GeoLocation | null> {
  try {
    // Add "Riyadh, Saudi Arabia" if not already present to improve accuracy
    const searchAddress = address.toLowerCase().includes('riyadh')
      ? address
      : `${address}, Riyadh, Saudi Arabia`

    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', searchAddress)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'sa') // Limit to Saudi Arabia
    url.searchParams.set('viewbox', '46.4,24.5,47.0,25.0') // Riyadh bounding box
    url.searchParams.set('bounded', '1') // Prefer results within viewbox

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'SAM-v2-DCL-ResolutionEngine/1.0',
      },
    })

    if (!response.ok) {
      console.error('Geocoding API error:', response.status)
      return null
    }

    const results = await response.json()

    if (results.length === 0) {
      console.warn('No geocoding results found for:', address)
      return null
    }

    const result = results[0]

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Calculate distance between two geographic points in meters
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}
