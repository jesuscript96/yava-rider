import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('Google Maps API key not found. Maps functionality will be limited.')
}

// Configurar las opciones globalmente (solo una vez)
setOptions({
  apiKey: GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  language: 'es',
})

// Función para cargar las librerías de Google Maps
export async function loadGoogleMaps() {
  try {
    const { Map } = await importLibrary('maps')
    const { DirectionsService, DirectionsRenderer } = await importLibrary('routes')
    const { Marker } = await importLibrary('marker')
    const { Geocoder } = await importLibrary('geocoding')
    const { PlacesService } = await importLibrary('places')
    const { LatLngBounds } = await importLibrary('core')
    
    return { Map, DirectionsService, DirectionsRenderer, Marker, Geocoder, PlacesService, LatLngBounds }
  } catch (error) {
    console.error('Error loading Google Maps libraries:', error)
    throw error
  }
}

export interface RoutePoint {
  id: string
  address: string
  lat?: number
  lng?: number
  orderId: string
  customerName: string
  deliveryTime?: string
  timeWindow?: {
    start: string
    end: string
  }
}

export interface OptimizedRoute {
  waypoints: RoutePoint[]
  totalDistance: number
  totalDuration: number
  polyline: string
  directions: google.maps.DirectionsResult
}

export class RouteOptimizer {
  private directionsService: google.maps.DirectionsService | null = null
  private geocoder: google.maps.Geocoder | null = null
  private isInitialized = false

  async initialize() {
    if (this.isInitialized) return

    try {
      const { DirectionsService, Geocoder } = await loadGoogleMaps()
      this.directionsService = new DirectionsService()
      this.geocoder = new Geocoder()
      this.isInitialized = true
    } catch (error) {
      console.error('Error loading Google Maps:', error)
      throw error
    }
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.geocoder) {
      throw new Error('Geocoder not initialized')
    }

    try {
      const result = await this.geocoder.geocode({ address })
      if (result.results.length > 0) {
        const location = result.results[0].geometry.location
        return {
          lat: location.lat(),
          lng: location.lng()
        }
      }
      return null
    } catch (error) {
      console.error('Error geocoding address:', error)
      return null
    }
  }

  async optimizeRoute(
    startPoint: { lat: number; lng: number },
    endPoint: { lat: number; lng: number },
    waypoints: RoutePoint[]
  ): Promise<OptimizedRoute | null> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.directionsService) {
      throw new Error('Directions service not initialized')
    }

    try {
      // Geocodificar direcciones que no tengan coordenadas
      const geocodedWaypoints = await Promise.all(
        waypoints.map(async (waypoint) => {
          if (waypoint.lat && waypoint.lng) {
            return waypoint
          }
          
          const coords = await this.geocodeAddress(waypoint.address)
          return {
            ...waypoint,
            lat: coords?.lat,
            lng: coords?.lng
          }
        })
      )

      // Filtrar waypoints que no pudieron ser geocodificados
      const validWaypoints = geocodedWaypoints.filter(
        (wp) => wp.lat && wp.lng
      ) as (RoutePoint & { lat: number; lng: number })[]

      if (validWaypoints.length === 0) {
        throw new Error('No valid waypoints found')
      }

      // Crear request para Directions API
      const request: google.maps.DirectionsRequest = {
        origin: startPoint,
        destination: endPoint,
        waypoints: validWaypoints.map((wp) => ({
          location: { lat: wp.lat, lng: wp.lng },
          stopover: true
        })),
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }

      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        this.directionsService!.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result)
          } else {
            reject(new Error(`Directions request failed: ${status}`))
          }
        })
      })

      // Reorganizar waypoints según el orden optimizado
      const optimizedWaypoints: RoutePoint[] = []
      if (result.routes[0]?.waypoint_order) {
        result.routes[0].waypoint_order.forEach((index) => {
          optimizedWaypoints.push(validWaypoints[index])
        })
      } else {
        optimizedWaypoints.push(...validWaypoints)
      }

      // Calcular estadísticas de la ruta
      const route = result.routes[0]
      
      const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0)
      const totalDuration = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0)

      // Obtener polyline
      const polyline = route.overview_polyline.encoded_path

      return {
        waypoints: optimizedWaypoints,
        totalDistance,
        totalDuration,
        polyline,
        directions: result
      }
    } catch (error) {
      console.error('Error optimizing route:', error)
      return null
    }
  }

  generateGoogleMapsUrl(
    startPoint: { lat: number; lng: number },
    waypoints: RoutePoint[]
  ): string {
    const baseUrl = 'https://www.google.com/maps/dir/'
    const start = `${startPoint.lat},${startPoint.lng}`
    const waypointCoords = waypoints
      .filter((wp) => wp.lat && wp.lng)
      .map((wp) => `${wp.lat},${wp.lng}`)
      .join('/')
    
    return `${baseUrl}${start}/${waypointCoords}`
  }
}

export const routeOptimizer = new RouteOptimizer()
