import React, { useEffect, useRef, useState, useCallback } from 'react'
import { routeOptimizer, loadGoogleMaps } from '../lib/googleMaps'
import type { RoutePoint, OptimizedRoute } from '../lib/googleMaps'
import { useStore } from '../store/useStore'

interface MapViewProps {
  route?: OptimizedRoute
  onRouteGenerated?: (route: OptimizedRoute) => void
}

const MapView: React.FC<MapViewProps> = ({ route, onRouteGenerated }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null)
  const markers = useRef<google.maps.Marker[]>([])
  const { orders, selectedDate } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const centerMapOnOrders = useCallback(async () => {
    if (!mapInstance.current || orders.length === 0) return

    try {
      const { LatLngBounds } = await loadGoogleMaps()
      const bounds = new LatLngBounds()
      let hasValidCoords = false

      for (const order of orders) {
        // Intentar geocodificar la dirección si no tiene coordenadas
        const coords = await routeOptimizer.geocodeAddress(order.customer_address)
        if (coords) {
          bounds.extend(coords)
          hasValidCoords = true
        }
      }

      if (hasValidCoords) {
        mapInstance.current.fitBounds(bounds)
      }
    } catch (error) {
      console.error('Error centering map on orders:', error)
    }
  }, [orders])

  const initializeMap = useCallback(async () => {
    if (!mapRef.current) {
      console.log('Map container not ready')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Cargar las librerías de Google Maps
      const { Map, DirectionsRenderer } = await loadGoogleMaps()
      
      // Configuración inicial del mapa
      const mapOptions: google.maps.MapOptions = {
        center: { lat: 40.4168, lng: -3.7038 }, // Madrid por defecto
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      }

      mapInstance.current = new Map(mapRef.current, mapOptions)
      directionsRenderer.current = new DirectionsRenderer({
        draggable: false,
        suppressMarkers: true
      })
      directionsRenderer.current.setMap(mapInstance.current)

      setMapReady(true)

      // Centrar el mapa en los pedidos del día si hay alguno
      if (orders.length > 0) {
        await centerMapOnOrders()
      }
    } catch (error) {
      console.error('Error initializing map:', error)
      setError('Error al cargar el mapa. Verifica tu API key de Google Maps.')
    } finally {
      setLoading(false)
    }
  }, [orders, centerMapOnOrders])

  // Callback ref para asegurar que el elemento esté disponible
  const setMapRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      mapRef.current = node
      // Inicializar el mapa cuando el elemento esté disponible
      setTimeout(() => {
        if (mapRef.current && !mapInstance.current) {
          initializeMap()
        }
      }, 50)
    }
  }, [initializeMap])

  const displayRoute = useCallback(async (route: OptimizedRoute) => {
    if (!directionsRenderer.current) return

    directionsRenderer.current.setDirections(route.directions)
    
    // Agregar marcadores numerados
    clearMarkers()
    await addNumberedMarkers(route.waypoints)
  }, [])

  // Efecto para reinicializar cuando cambian las dependencias
  useEffect(() => {
    if (mapReady && mapInstance.current) {
      centerMapOnOrders()
    }
  }, [orders, centerMapOnOrders, mapReady])

  useEffect(() => {
    if (route && mapInstance.current) {
      displayRoute(route)
    }
  }, [route, displayRoute])

  const addNumberedMarkers = async (waypoints: RoutePoint[]) => {
    if (!mapInstance.current) return

    try {
      const { Marker, InfoWindow } = await loadGoogleMaps()

      waypoints.forEach((waypoint, index) => {
        if (!waypoint.lat || !waypoint.lng) return

        const marker = new Marker({
          position: { lat: waypoint.lat, lng: waypoint.lng },
          map: mapInstance.current,
          title: `${index + 1}. ${waypoint.customerName}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 20,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          label: {
            text: (index + 1).toString(),
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        })

        // Info window con detalles del pedido
        const infoWindow = new InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold text-gray-900">${waypoint.customerName}</h3>
              <p class="text-sm text-gray-600">${waypoint.address}</p>
              ${waypoint.deliveryTime ? `<p class="text-sm text-gray-500">Entrega: ${waypoint.deliveryTime}</p>` : ''}
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(mapInstance.current, marker)
        })

        markers.current.push(marker)
      })
    } catch (error) {
      console.error('Error adding markers:', error)
    }
  }

  const clearMarkers = () => {
    markers.current.forEach(marker => marker.setMap(null))
    markers.current = []
  }

  const handleOptimizeRoute = async () => {
    if (orders.length === 0) return

    setLoading(true)
    setError(null)

    try {
      // Usar la ubicación actual del usuario como punto de inicio
      // Por ahora usamos una ubicación por defecto
      const startPoint = { lat: 40.4168, lng: -3.7038 }
      const endPoint = { lat: 40.4168, lng: -3.7038 } // Mismo punto de inicio

      const waypoints: RoutePoint[] = orders.map(order => ({
        id: order.id,
        address: order.customer_address,
        orderId: order.id,
        customerName: order.customer_name,
        deliveryTime: order.assigned_delivery_start_time && order.assigned_delivery_end_time
          ? `${order.assigned_delivery_start_time} - ${order.assigned_delivery_end_time}`
          : undefined
      }))

      const optimizedRoute = await routeOptimizer.optimizeRoute(
        startPoint,
        endPoint,
        waypoints
      )

      if (optimizedRoute) {
        onRouteGenerated?.(optimizedRoute)
      } else {
        setError('No se pudo optimizar la ruta. Verifica las direcciones.')
      }
    } catch (error) {
      console.error('Error optimizing route:', error)
      setError('Error al optimizar la ruta.')
    } finally {
      setLoading(false)
    }
  }

  const openInGoogleMaps = () => {
    if (!route || route.waypoints.length === 0) return

    const startPoint = { lat: 40.4168, lng: -3.7038 } // Ubicación por defecto
    const url = routeOptimizer.generateGoogleMapsUrl(startPoint, route.waypoints)
    window.open(url, '_blank')
  }

  if (loading && !mapInstance.current) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Mapa de Rutas</h3>
            <p className="text-sm text-gray-600">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''} para {selectedDate ? selectedDate.toLocaleDateString('es-ES') : 'hoy'}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleOptimizeRoute}
              disabled={loading || orders.length === 0}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Optimizando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>Optimizar Ruta</span>
                </>
              )}
            </button>
            
            {route && (
              <button
                onClick={openInGoogleMaps}
                className="btn-secondary flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Abrir en Maps</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas de la ruta */}
      {route && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {Math.round(route.totalDistance / 1000)} km
              </p>
              <p className="text-sm text-gray-600">Distancia total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {Math.round(route.totalDuration / 60)} min
              </p>
              <p className="text-sm text-gray-600">Tiempo estimado</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {route.waypoints.length}
              </p>
              <p className="text-sm text-gray-600">Entregas</p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Mapa */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div 
          ref={setMapRef} 
          className="w-full h-96 min-h-[384px]" 
          style={{ minHeight: '384px' }}
        />
      </div>
    </div>
  )
}

export default MapView
