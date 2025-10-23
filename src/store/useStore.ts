import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DeliveryPerson, Order } from '../types/database'

interface AppState {
  // Auth state
  user: DeliveryPerson | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Orders state
  orders: Order[]
  selectedDate: Date | null
  selectedOrder: Order | null
  
  // Actions
  setUser: (user: DeliveryPerson | null) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  setLoading: (isLoading: boolean) => void
  setOrders: (orders: Order[]) => void
  setSelectedDate: (date: Date | null) => void
  setSelectedOrder: (order: Order | null) => void
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  logout: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      orders: [],
      selectedDate: null,
      selectedOrder: null,
      
      // Actions
      setUser: (user) => {
        console.log('👤 Store: Actualizando usuario:', user ? `${user.name} (${user.email})` : 'null')
        set({ user })
      },
      setAuthenticated: (isAuthenticated) => {
        console.log('🔐 Store: Actualizando estado de autenticación:', isAuthenticated)
        set({ isAuthenticated })
      },
      setLoading: (isLoading) => {
        console.log('⏳ Store: Actualizando estado de carga:', isLoading)
        set({ isLoading })
      },
      setOrders: (orders) => {
        console.log('📦 Store: Actualizando pedidos:', orders.length)
        set({ orders })
      },
      setSelectedDate: (selectedDate) => {
        console.log('📅 Store: Actualizando fecha seleccionada:', selectedDate)
        set({ selectedDate })
      },
      setSelectedOrder: (selectedOrder) => {
        console.log('📋 Store: Actualizando pedido seleccionado:', selectedOrder?.id)
        set({ selectedOrder })
      },
      
      updateOrderStatus: (orderId, status) => {
        console.log('🔄 Store: Actualizando estado del pedido:', { orderId, status })
        const orders = get().orders
        const updatedOrders = orders.map(order => 
          order.id === orderId ? { ...order, status } : order
        )
        set({ orders: updatedOrders })
      },
      
      logout: () => {
        console.log('👋 Store: Ejecutando logout - limpiando estado local')
        set({
          user: null,
          isAuthenticated: false,
          orders: [],
          selectedDate: null,
          selectedOrder: null
        })
      }
    }),
    {
      name: 'rideryava-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      // Agregar versionado para manejar cambios en el schema
      version: 1,
      // Migración para limpiar datos corruptos
      migrate: (persistedState: any, version: number) => {
        console.log('🔄 Store: Migrando datos persistidos desde versión:', version)
        
        // Si hay datos corruptos, limpiarlos
        if (persistedState && typeof persistedState === 'object') {
          const { user, isAuthenticated } = persistedState
          
          // Verificar si los datos del usuario son válidos
          if (user && (!user.id || !user.email || !user.name)) {
            console.warn('⚠️ Store: Datos de usuario corruptos detectados, limpiando...')
            return { user: null, isAuthenticated: false }
          }
          
          // Verificar consistencia entre user y isAuthenticated
          if (isAuthenticated && !user) {
            console.warn('⚠️ Store: Estado inconsistente detectado (autenticado sin usuario), limpiando...')
            return { user: null, isAuthenticated: false }
          }
        }
        
        return persistedState
      }
    }
  )
)
