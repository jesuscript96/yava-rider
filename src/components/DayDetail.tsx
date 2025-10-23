import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import type { Order } from '../types/database'
import { getOrdersForDate, updateOrderStatus } from '../lib/supabaseUtils'
import { useAuth } from '../hooks/useAuth'
import moment from 'moment'

const DayDetail: React.FC = () => {
  const { user } = useAuth()
  const { selectedDate, orders, setOrders, updateOrderStatus } = useStore()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchOrdersForDate = useCallback(async () => {
    if (!selectedDate || !user) return

    setLoading(true)
    try {
      const dateStr = moment(selectedDate).format('YYYY-MM-DD')
      const orders = await getOrdersForDate(user.id, dateStr)
      setOrders(orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedDate, user, setOrders])

  useEffect(() => {
    if (selectedDate && user) {
      fetchOrdersForDate()
    }
  }, [selectedDate, user, fetchOrdersForDate])

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const success = await updateOrderStatus(orderId, newStatus)
    if (success) {
      // Actualizar el estado local
      const { updateOrderStatus: updateLocalOrderStatus } = useStore.getState()
      updateLocalOrderStatus(orderId, newStatus)
    }
  }

  const handleDesignRoute = () => {
    const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'assigned')
    
    if (pendingOrders.length === 0) {
      alert('No hay pedidos pendientes para diseñar una ruta')
      return
    }

    try {
      // Crear URL de Google Maps con múltiples destinos
      const baseUrl = 'https://www.google.com/maps/dir/'
      
      // Usar Madrid como punto de inicio por defecto
      const startPoint = '40.4168,-3.7038'
      
      // Crear lista de direcciones
      const destinations = pendingOrders
        .map(order => encodeURIComponent(order.customer_address))
        .join('/')
      
      const googleMapsUrl = `${baseUrl}${startPoint}/${destinations}`
      
      // Abrir en nueva pestaña
      window.open(googleMapsUrl, '_blank')
    } catch (error) {
      console.error('Error generating route:', error)
      alert('Error al generar la ruta. Inténtalo de nuevo.')
    }
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'in_route':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'assigned':
        return 'Asignado'
      case 'in_route':
        return 'En Reparto'
      case 'delivered':
        return 'Completado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'assigned')

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center">Selecciona un día en el calendario para ver los pedidos</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/calendar')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Pedidos del {moment(selectedDate).format('DD [de] MMMM [de] YYYY')}
              </h2>
              <p className="text-gray-600 mt-1">
                {orders.length} pedido{orders.length !== 1 ? 's' : ''} asignado{orders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {pendingOrders.length > 0 && (
              <button
                onClick={handleDesignRoute}
                className="btn-primary flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Diseñar Ruta</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-500">No hay pedidos asignados para este día</p>
          </div>
        ) : (
          orders.map((order, index) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {order.customer_name}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Dirección:</strong> {order.customer_address}</p>
                    <p><strong>Teléfono:</strong> {order.customer_phone}</p>
                    <p><strong>Horario:</strong> {
                      order.assigned_delivery_start_time && order.assigned_delivery_end_time
                        ? `${order.assigned_delivery_start_time} - ${order.assigned_delivery_end_time}`
                        : moment(order.delivery_time).format('HH:mm')
                    }</p>
                    <p><strong>Total:</strong> ${order.total_amount}</p>
                    {order.notes && (
                      <p><strong>Notas:</strong> {order.notes}</p>
                    )}
                  </div>
                </div>
                
                <div className="ml-4">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                    className="input-field text-sm"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="assigned">Asignado</option>
                    <option value="in_route">En Reparto</option>
                    <option value="delivered">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}

export default DayDetail
