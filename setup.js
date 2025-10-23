#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 Configurando RiderYava...\n')

// Verificar si existe el archivo .env.local
const envPath = path.join(__dirname, '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('📝 Creando archivo .env.local...')
  
  const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
`
  
  fs.writeFileSync(envPath, envContent)
  console.log('✅ Archivo .env.local creado')
} else {
  console.log('✅ Archivo .env.local ya existe')
}

console.log('\n📋 Próximos pasos:')
console.log('1. Configura las variables de entorno en .env.local')
console.log('2. Configura tu proyecto de Supabase')
console.log('3. Obtén una API key de Google Maps')
console.log('4. Ejecuta: npm run dev')
console.log('\n🎉 ¡Listo para empezar!')
