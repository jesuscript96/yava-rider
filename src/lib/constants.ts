// Constantes de la aplicación

export const ORDER_STATUSES = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_ROUTE: 'in_route',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.PENDING]: 'Pendiente',
  [ORDER_STATUSES.ASSIGNED]: 'Asignado',
  [ORDER_STATUSES.IN_ROUTE]: 'En Reparto',
  [ORDER_STATUSES.DELIVERED]: 'Completado',
  [ORDER_STATUSES.CANCELLED]: 'Cancelado'
} as const

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ORDER_STATUSES.ASSIGNED]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUSES.IN_ROUTE]: 'bg-purple-100 text-purple-800',
  [ORDER_STATUSES.DELIVERED]: 'bg-green-100 text-green-800',
  [ORDER_STATUSES.CANCELLED]: 'bg-red-100 text-red-800'
} as const

export const CALENDAR_COLORS = {
  LOW_ORDERS: '#3b82f6', // azul para 1-4 pedidos
  MEDIUM_ORDERS: '#f59e0b', // amarillo para 5-9 pedidos
  HIGH_ORDERS: '#dc2626' // rojo para 10+ pedidos
} as const

export const ORDER_THRESHOLDS = {
  MEDIUM: 5,
  HIGH: 10
} as const

export const DEFAULT_MAP_CENTER = {
  lat: 40.4168,
  lng: -3.7038
} as const

export const MAP_OPTIONS = {
  zoom: 12,
  mapTypeId: 'roadmap' as const,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
} as const
