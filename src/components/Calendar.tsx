import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Order } from '../types/database'
import { getOrdersForDateRange } from '../lib/supabaseUtils'
import { useStore } from '../store/useStore'
import { useAuth } from '../hooks/useAuth'

// Configurar moment en español
moment.locale('es')
const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    orderCount: number
    orders: Order[]
  }
}

const CalendarView: React.FC = () => {
  const { user } = useAuth()
  const { setSelectedDate, setOrders } = useStore()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchOrders = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const startDate = moment().startOf('month').format('YYYY-MM-DD')
      const endDate = moment().add(2, 'months').endOf('month').format('YYYY-MM-DD')
      
      const orders = await getOrdersForDateRange(user.id, startDate, endDate)
      setOrders(orders)

      // Agrupar pedidos por fecha
      const ordersByDate = orders.reduce((acc, order) => {
        const date = order.assigned_date
        if (date) {
          if (!acc[date]) {
            acc[date] = []
          }
          acc[date].push(order)
        }
        return acc
      }, {} as Record<string, Order[]>)

      // Crear eventos para el calendario
      const calendarEvents: CalendarEvent[] = Object.entries(ordersByDate).map(([date, dayOrders]) => ({
        id: date,
        title: `${dayOrders.length} pedido${dayOrders.length !== 1 ? 's' : ''}`,
        start: moment(date).toDate(),
        end: moment(date).toDate(),
        resource: {
          orderCount: dayOrders.length,
          orders: dayOrders
        }
      }))

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [user, setOrders])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user, fetchOrders])

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedDate(moment(event.start).toDate())
    setOrders(event.resource.orders)
    navigate('/day')
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const orderCount = event.resource.orderCount
    let backgroundColor = '#3b82f6' // azul por defecto
    
    if (orderCount >= 10) {
      backgroundColor = '#dc2626' // rojo para muchos pedidos
    } else if (orderCount >= 5) {
      backgroundColor = '#f59e0b' // amarillo para muchos pedidos
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendario de Entregas</h1>
        <p className="text-gray-600 mt-1">
          Haz clic en un día para ver los pedidos asignados
        </p>
      </div>

      <div className="mb-4 flex items-center space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span>1-4 pedidos</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
          <span>5-9 pedidos</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span>10+ pedidos</span>
        </div>
      </div>

      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month']}
          defaultView="month"
          messages={{
            next: 'Siguiente',
            previous: 'Anterior',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'No hay pedidos en este rango de fechas',
            showMore: total => `+ Ver ${total} más`
          }}
          culture="es"
        />
      </div>
    </div>
  )
}

export default CalendarView
