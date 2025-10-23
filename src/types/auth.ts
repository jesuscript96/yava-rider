import type { DeliveryPerson } from './database'

export interface AuthContextType {
  user: DeliveryPerson | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}
