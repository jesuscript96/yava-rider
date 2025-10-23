// Utilidades de debugging para diagnóstico de problemas de autenticación

export const debugAuthState = () => {
  console.log('🔍 === DIAGNÓSTICO DE ESTADO DE AUTENTICACIÓN ===')
  
  // Verificar localStorage
  const localStorageKeys = Object.keys(localStorage)
  const supabaseKeys = localStorageKeys.filter(key => key.startsWith('sb-') || key.includes('supabase'))
  
  console.log('📦 Claves de localStorage relacionadas con Supabase:', supabaseKeys)
  supabaseKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      console.log(`  ${key}:`, value ? JSON.parse(value) : 'null')
    } catch (e) {
      console.log(`  ${key}: [datos corruptos]`)
    }
  })
  
  // Verificar sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage)
  const sessionSupabaseKeys = sessionStorageKeys.filter(key => key.startsWith('sb-') || key.includes('supabase'))
  
  console.log('📦 Claves de sessionStorage relacionadas con Supabase:', sessionSupabaseKeys)
  sessionSupabaseKeys.forEach(key => {
    try {
      const value = sessionStorage.getItem(key)
      console.log(`  ${key}:`, value ? JSON.parse(value) : 'null')
    } catch (e) {
      console.log(`  ${key}: [datos corruptos]`)
    }
  })
  
  // Verificar cookies
  const cookies = document.cookie.split(';').filter(cookie => 
    cookie.includes('supabase') || cookie.includes('sb-')
  )
  console.log('🍪 Cookies relacionadas con Supabase:', cookies)
  
  console.log('🔍 === FIN DEL DIAGNÓSTICO ===')
}

export const clearAllAuthData = async () => {
  console.log('🧹 Limpiando TODOS los datos de autenticación...')
  
  // Limpiar localStorage
  const localStorageKeys = Object.keys(localStorage)
  localStorageKeys.forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase') || key.includes('rideryava')) {
      console.log(`🗑️ Eliminando de localStorage: ${key}`)
      localStorage.removeItem(key)
    }
  })
  
  // Limpiar sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage)
  sessionStorageKeys.forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      console.log(`🗑️ Eliminando de sessionStorage: ${key}`)
      sessionStorage.removeItem(key)
    }
  })
  
  // Limpiar cookies
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim()
    if (name.includes('supabase') || name.includes('sb-')) {
      console.log(`🗑️ Eliminando cookie: ${name}`)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  })
  
  console.log('✅ Limpieza completa realizada')
}

// Función para verificar si hay datos corruptos
export const hasCorruptedAuthData = (): boolean => {
  try {
    const localStorageKeys = Object.keys(localStorage)
    const supabaseKeys = localStorageKeys.filter(key => key.startsWith('sb-'))
    
    // Si hay más de 10 claves de Supabase, probablemente hay datos corruptos
    if (supabaseKeys.length > 10) {
      console.warn('⚠️ Múltiples instancias de GoTrueClient detectadas')
      return true
    }
    
    // Verificar si hay datos JSON corruptos
    for (const key of supabaseKeys) {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          JSON.parse(value)
        }
      } catch (e) {
        console.warn(`⚠️ Datos corruptos en localStorage: ${key}`)
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('❌ Error verificando datos corruptos:', error)
    return true
  }
}
