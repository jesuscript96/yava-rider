import { supabase, supabaseAdmin } from './supabase'
import type { Order, DeliveryPerson } from '../types/database'

/**
 * Utilidades para operaciones de Supabase
 * Usa automáticamente el cliente de servicio cuando está disponible
 */

// Función helper para obtener el cliente apropiado
const getClient = () => supabaseAdmin || supabase

/**
 * Obtener datos de un repartidor por ID
 */
export const getDeliveryPerson = async (id: string): Promise<DeliveryPerson | null> => {
  try {
    const client = getClient()
    const { data, error } = await client
      .from('delivery_people')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching delivery person:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching delivery person:', error)
    return null
  }
}

/**
 * Obtener pedidos de un repartidor para una fecha específica
 */
export const getOrdersForDate = async (
  deliveryPersonId: string, 
  date: string
): Promise<Order[]> => {
  try {
    const client = getClient()
    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('delivery_person_id', deliveryPersonId)
      .eq('assigned_date', date)
      .order('assigned_delivery_start_time', { ascending: true })

    if (error) {
      console.error('Error fetching orders:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}

/**
 * Obtener pedidos de un repartidor para un rango de fechas
 */
export const getOrdersForDateRange = async (
  deliveryPersonId: string,
  startDate: string,
  endDate: string
): Promise<Order[]> => {
  try {
    const client = getClient()
    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('delivery_person_id', deliveryPersonId)
      .gte('assigned_date', startDate)
      .lte('assigned_date', endDate)
      .order('assigned_date', { ascending: true })

    if (error) {
      console.error('Error fetching orders:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}

/**
 * Actualizar el estado de un pedido
 */
export const updateOrderStatus = async (
  orderId: string, 
  status: Order['status']
): Promise<boolean> => {
  try {
    const client = getClient()
    const { error } = await client
      .from('orders')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order status:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating order status:', error)
    return false
  }
}

/**
 * Verificar si el cliente de servicio está disponible
 */
export const isServiceClientAvailable = (): boolean => {
  return supabaseAdmin !== null
}

/**
 * Obtener información de debug sobre la configuración
 */
export const getSupabaseConfig = () => {
  return {
    hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    hasServiceKey: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
    serviceClientAvailable: isServiceClientAvailable()
  }
}
