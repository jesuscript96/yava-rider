# Guía de Configuración - RiderYava

## 🚀 Configuración Inicial

### 1. Ejecutar el script de configuración

```bash
npm run setup
```

Este script creará automáticamente el archivo `.env.local` con las variables necesarias.

### 2. Configurar Supabase

#### Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a Settings > API para obtener:
   - Project URL
   - Anon public key

#### Obtener las claves de Supabase
1. Ve a Settings > API en tu proyecto de Supabase
2. Copia las siguientes claves:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret** → `VITE_SUPABASE_SERVICE_ROLE_KEY`

#### Configurar la base de datos
1. Ve a SQL Editor en tu proyecto de Supabase
2. Ejecuta el script SQL del archivo `bbddoriginal`
3. Configura Row Level Security (RLS):

```sql
-- Habilitar RLS en las tablas
ALTER TABLE delivery_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política para delivery_people (solo pueden ver sus propios datos)
CREATE POLICY "Delivery people can view own data" ON delivery_people
  FOR SELECT USING (auth.uid() = id);

-- Política para orders (solo pueden ver sus pedidos asignados)
CREATE POLICY "Delivery people can view assigned orders" ON orders
  FOR SELECT USING (auth.uid() = delivery_person_id);

-- Política para actualizar estados de pedidos
CREATE POLICY "Delivery people can update order status" ON orders
  FOR UPDATE USING (auth.uid() = delivery_person_id);
```

#### Configurar autenticación
1. Ve a Authentication > Settings
2. Desactiva "Enable email confirmations" si quieres login directo
3. Configura las URLs permitidas:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000`

### 3. Entender las claves de Supabase

#### Clave Anónima (anon key)
- **Uso**: Operaciones públicas y autenticación de usuarios
- **Permisos**: Limitados por Row Level Security (RLS)
- **Seguridad**: Segura para usar en el frontend

#### Clave de Servicio (service role key)
- **Uso**: Operaciones administrativas y bypass de RLS
- **Permisos**: Acceso completo a la base de datos
- **Seguridad**: ⚠️ **MUY PODEROSA** - solo para desarrollo o backend

> **Nota**: En producción, considera usar un backend intermedio en lugar de exponer la service key en el frontend.

### 4. Configurar Google Maps API

#### Crear proyecto en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - Maps JavaScript API
   - Directions API
   - Distance Matrix API
   - Geocoding API

#### Crear API Key
1. Ve a APIs & Services > Credentials
2. Crea una nueva API Key
3. Restringe la API Key:
   - Application restrictions: HTTP referrers
   - Website restrictions: `http://localhost:3000/*`, `https://tu-dominio.com/*`
   - API restrictions: Selecciona solo las APIs que habilitaste

### 5. Configurar variables de entorno

Edita el archivo `.env.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_aqui

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps
```

### 6. Crear usuarios de prueba

En Supabase, ve a Authentication > Users y crea usuarios de prueba, o usa el SQL Editor:

```sql
-- Crear un repartidor de prueba
INSERT INTO delivery_people (id, business_id, name, email, phone, active)
VALUES (
  'tu-uuid-aqui',
  'business-uuid-aqui',
  'Juan Pérez',
  'juan@ejemplo.com',
  '+1234567890',
  true
);

-- Crear pedidos de prueba
INSERT INTO orders (
  business_id,
  customer_name,
  customer_address,
  customer_phone,
  products,
  total_amount,
  delivery_time,
  status,
  delivery_person_id,
  assigned_date
) VALUES (
  'business-uuid-aqui',
  'María García',
  'Calle Mayor 123, Madrid',
  '+1234567890',
  '[{"name": "Producto 1", "quantity": 2}]',
  25.50,
  '2024-01-15 14:00:00+00',
  'assigned',
  'tu-uuid-aqui',
  '2024-01-15'
);
```

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Construir para producción
npm run build

# Verificar tipos
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Preview de producción
npm run preview
```

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que el archivo `.env.local` existe
- Verifica que las variables tienen los nombres correctos
- Reinicia el servidor de desarrollo

### Error: "Google Maps API key not found"
- Verifica que la API key está configurada en `.env.local`
- Verifica que la API key tiene los permisos correctos
- Verifica que las APIs están habilitadas en Google Cloud Console

### Error de autenticación
- Verifica que RLS está configurado correctamente
- Verifica que las políticas de seguridad permiten las operaciones
- Verifica que el usuario existe en la tabla `delivery_people`

### El mapa no se carga
- Verifica que la API key de Google Maps es válida
- Verifica que las APIs están habilitadas
- Verifica la consola del navegador para errores específicos

## 📱 Testing en Móvil

Para probar en dispositivos móviles:

1. Encuentra tu IP local: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
2. Actualiza las URLs en Supabase:
   - Site URL: `http://tu-ip:3000`
   - Redirect URLs: `http://tu-ip:3000`
3. Ejecuta: `npm run dev -- --host`
4. Accede desde tu móvil: `http://tu-ip:3000`

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Despliega automáticamente

### Netlify
1. Conecta tu repositorio a Netlify
2. Configura las variables de entorno
3. Configura el build command: `npm run build`
4. Configura el publish directory: `dist`

### Actualizar URLs en Supabase
Después del despliegue, actualiza las URLs en Supabase:
- Site URL: `https://tu-dominio.com`
- Redirect URLs: `https://tu-dominio.com`
