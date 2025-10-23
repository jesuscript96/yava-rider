import React, { useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { useStore } from '../store/useStore'
import type { AuthContextType } from '../types/auth'
import { AuthContext } from './AuthContextBase'
// import { clearAllAuthData } from '../lib/debugUtils' // No se usa directamente aquí

// Función para limpiar datos corruptos
const clearCorruptedAuthData = async () => {
  console.log('🧹 Limpiando datos de autenticación corruptos...')
  try {
    // Limpiar localStorage de Supabase
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    )
    supabaseKeys.forEach(key => {
      console.log(`🗑️ Eliminando clave corrupta: ${key}`)
      localStorage.removeItem(key)
    })

    // Limpiar sessionStorage
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    )
    sessionKeys.forEach(key => {
      console.log(`🗑️ Eliminando clave de sesión corrupta: ${key}`)
      sessionStorage.removeItem(key)
    })

    // Forzar signOut
    await supabase.auth.signOut()
    console.log('✅ Datos corruptos limpiados exitosamente')
  } catch (error) {
    console.error('❌ Error limpiando datos corruptos:', error)
  }
}

// Función con timeout para operaciones críticas
const withTimeout = <T,>(promise: Promise<T> | any, timeoutMs: number = 10000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operación timeout después de ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    setUser, 
    setAuthenticated, 
    setLoading,
    logout: logoutStore 
  } = useStore()

  useEffect(() => {
    console.log('🚀 AuthProvider: Iniciando verificación de sesión...')
    
    // Verificar sesión existente con timeout y manejo robusto
    const checkSession = async () => {
      setLoading(true)
      console.log('🔍 Verificando sesión existente...')
      
      try {
        // Verificar si hay múltiples instancias de GoTrueClient
        const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'))
        if (supabaseKeys.length > 10) {
          console.warn('⚠️ Múltiples instancias de GoTrueClient detectadas. Limpiando datos...')
          await clearCorruptedAuthData()
          setAuthenticated(false)
          setUser(null)
          setLoading(false)
          return
        }

        console.log('📡 Obteniendo sesión de Supabase...')
        const sessionPromise = supabase.auth.getSession()
        const { data: { session }, error: sessionError } = await withTimeout(sessionPromise, 8000) as any
        
        if (sessionError) {
          console.error('❌ Error obteniendo sesión:', sessionError)
          await clearCorruptedAuthData()
          setAuthenticated(false)
          setUser(null)
          setLoading(false)
          return
        }

        console.log('📋 Estado de sesión:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          expiresAt: session?.expires_at
        })
        
        if (session?.user) {
          console.log('👤 Usuario encontrado, obteniendo datos del repartidor...')
          
          // Verificar si la sesión está expirada
          const now = Math.floor(Date.now() / 1000)
          if (session.expires_at && session.expires_at < now) {
            console.warn('⏰ Sesión expirada, limpiando datos...')
            await clearCorruptedAuthData()
            setAuthenticated(false)
            setUser(null)
            setLoading(false)
            return
          }

          // Obtener datos del repartidor con timeout
          const client = supabaseAdmin || supabase
          console.log('🔍 Consultando tabla delivery_people...')
          
          const deliveryPersonPromise = client
            .from('delivery_people')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          const { data: deliveryPerson, error: deliveryError } = await withTimeout(deliveryPersonPromise, 15000) as any
          
          if (deliveryError) {
            console.error('❌ Error obteniendo datos del repartidor:', deliveryError)
            // Solo limpiar si es un error real, no un timeout
            if (deliveryError.message && !deliveryError.message.includes('timeout')) {
              console.log('🧹 Limpiando sesión corrupta...')
              await clearCorruptedAuthData()
              setAuthenticated(false)
              setUser(null)
            } else {
              console.log('⏰ Timeout en consulta de base de datos, manteniendo sesión válida...')
              // Mantener la sesión válida pero sin datos del repartidor
              setAuthenticated(true)
              setUser(null) // Usuario será null hasta que se carguen los datos
              
              // Intentar cargar los datos del repartidor en segundo plano
              setTimeout(async () => {
                try {
                  console.log('🔄 Reintentando cargar datos del repartidor...')
                  const client = supabaseAdmin || supabase
                  const { data: deliveryPerson, error: retryError } = await client
                    .from('delivery_people')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                  
                  if (!retryError && deliveryPerson) {
                    console.log('✅ Datos del repartidor cargados en segundo plano')
                    setUser(deliveryPerson)
                  }
                } catch (retryErr) {
                  console.log('⚠️ Error en reintento de carga de datos:', retryErr)
                }
              }, 2000)
            }
          } else if (deliveryPerson) {
            console.log('✅ Datos del repartidor obtenidos:', {
              id: deliveryPerson.id,
              name: deliveryPerson.name,
              email: deliveryPerson.email
            })
            setUser(deliveryPerson)
            setAuthenticated(true)
          } else {
            console.warn('⚠️ No se encontraron datos del repartidor')
            setAuthenticated(false)
            setUser(null)
          }
        } else {
          console.log('👤 No hay sesión activa')
          setAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error('❌ Error crítico en checkSession:', error)
        
        // Solo limpiar datos si es un error real, no un timeout
        if (error instanceof Error && (
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('CORS')
        )) {
          console.log('🧹 Error de conexión detectado, limpiando datos...')
          await clearCorruptedAuthData()
        } else if (error instanceof Error && error.message.includes('timeout')) {
          console.log('⏰ Timeout detectado, manteniendo sesión válida...')
          // No limpiar la sesión si solo es un timeout, pero tampoco autenticar
          // El usuario permanecerá en el estado de carga hasta que se resuelva
          setLoading(false)
          return
        }
        
        setAuthenticated(false)
        setUser(null)
      } finally {
        console.log('🏁 Verificación de sesión completada')
        setLoading(false)
      }
    }

    checkSession()

    // Escuchar cambios de autenticación con logging
    console.log('👂 Configurando listener de cambios de autenticación...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Cambio de estado de autenticación:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id
        })

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Usuario firmado, obteniendo datos...')
          try {
            const client = supabaseAdmin || supabase
            const { data: deliveryPerson, error } = await withTimeout(
              client
                .from('delivery_people')
                .select('*')
                .eq('id', session.user.id)
                .single(),
              15000
            ) as any
            
            if (!error && deliveryPerson) {
              console.log('✅ Datos del repartidor cargados en listener')
              setUser(deliveryPerson)
              setAuthenticated(true)
            } else {
              console.error('❌ Error en listener:', error)
            }
          } catch (error) {
            console.error('❌ Error en listener de SIGNED_IN:', error)
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuario deslogueado')
          setUser(null)
          setAuthenticated(false)
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refrescado')
        }
      }
    )

    return () => {
      console.log('🧹 Limpiando subscription de auth...')
      subscription.unsubscribe()
    }
  }, [setUser, setAuthenticated, setLoading])

  const login = async (email: string, password: string) => {
    console.log('🔐 Iniciando proceso de login...')
    setLoading(true)
    
    try {
      console.log('📡 Enviando credenciales a Supabase...')
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password
      })
      
      const { data, error } = await withTimeout(loginPromise, 10000) as any

      if (error) {
        console.error('❌ Error en login:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log('✅ Login exitoso, obteniendo datos del repartidor...')
        
        const client = supabaseAdmin || supabase
        const { data: deliveryPerson, error: deliveryError } = await withTimeout(
          client
            .from('delivery_people')
            .select('*')
            .eq('id', data.user.id)
            .single(),
          15000
        ) as any

        if (deliveryError) {
          console.error('❌ Error obteniendo datos del repartidor:', deliveryError)
          return { success: false, error: 'Error al obtener datos del repartidor' }
        }

        console.log('✅ Login completado exitosamente')
        setUser(deliveryPerson)
        setAuthenticated(true)
        return { success: true }
      }

      return { success: false, error: 'Error desconocido' }
    } catch (error) {
      console.error('❌ Error crítico en login:', error)
      return { success: false, error: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    console.log('👋 Iniciando proceso de logout...')
    setLoading(true)
    
    try {
      console.log('🧹 Limpiando datos de autenticación...')
      await withTimeout(supabase.auth.signOut(), 5000)
      logoutStore()
      console.log('✅ Logout completado')
    } catch (err) {
      console.error('❌ Error durante logout:', err)
      // Forzar limpieza local aunque falle el logout remoto
      logoutStore()
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
