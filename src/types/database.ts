// Tipos para la base de datos
export interface DeliveryPerson {
  id: string
  business_id: string
  name: string
  email: string
  phone?: string
  schedule_config?: Record<string, unknown>
  active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  business_id: string
  customer_name: string
  customer_address: string
  customer_phone: string
  products: Record<string, unknown>[]
  total_amount: number
  delivery_time: string
  status: 'pending' | 'assigned' | 'in_route' | 'delivered' | 'cancelled'
  source: 'manual' | 'stripe'
  delivery_person_id?: string
  assigned_date?: string
  notes?: string
  stripe_session_id?: string
  created_at: string
  updated_at: string
  assigned_delivery_start_time?: string
  assigned_delivery_end_time?: string
}

export interface Business {
  id: string
  name: string
  email: string
  stripe_webhook_secret?: string
  stripe_publishable_key?: string
  created_at: string
  updated_at: string
  stripe_signing_secret?: string
}
