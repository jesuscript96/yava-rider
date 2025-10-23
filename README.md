# RiderYava - App de Gestión de Rutas para Repartidores

Una aplicación web moderna para la gestión de rutas de repartidores, construida con React, TypeScript y Supabase.

## 🚀 Características

- **Autenticación segura** con Supabase Auth
- **Calendario interactivo** con indicadores visuales de pedidos
- **Gestión de estados** de pedidos en tiempo real
- **Optimización de rutas** con Google Maps API
- **Vista de mapa** interactiva con marcadores
- **Diseño responsive** optimizado para móviles
- **Cliente dual de Supabase** para máxima compatibilidad
- **Utilidades centralizadas** para operaciones de base de datos
- **Componente de debug** para desarrollo

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Base de datos**: Supabase
- **Autenticación**: Supabase Auth
- **Mapas**: Google Maps API
- **Estado**: Zustand
- **Routing**: React Router DOM
- **Calendario**: React Big Calendar

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- API Key de Google Maps

## ⚙️ Configuración

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_de_supabase

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps
```

### 3. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script SQL de la base de datos (ver `bbddoriginal`)
3. Configura Row Level Security (RLS) para que cada repartidor solo vea sus pedidos
4. Obtén la URL y la clave anónima de tu proyecto

### 4. Configurar Google Maps API

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Habilita las siguientes APIs:
   - Maps JavaScript API
   - Directions API
   - Distance Matrix API
3. Crea una API Key y restríngela por dominio

## 🚀 Ejecutar la aplicación

```bash
# Modo desarrollo
npm run dev

# Construir para producción
npm run build

# Preview de producción
npm run preview
```

## 📱 Uso

1. **Iniciar sesión**: Los repartidores inician sesión con su email y contraseña
2. **Ver calendario**: El calendario muestra los días con pedidos asignados
3. **Seleccionar día**: Haz clic en un día para ver los pedidos detallados
4. **Gestionar estados**: Cambia el estado de los pedidos según el progreso
5. **Optimizar rutas**: Usa el botón "Diseñar Ruta" para obtener la ruta óptima
6. **Navegar**: Abre la ruta en Google Maps para navegación

## 🗄️ Estructura de Base de Datos

La aplicación utiliza las siguientes tablas principales:

- `delivery_people`: Información de los repartidores
- `orders`: Pedidos con detalles de entrega
- `businesses`: Información de las empresas

## 🔒 Seguridad

- Row Level Security (RLS) configurado en Supabase
- Autenticación basada en tokens JWT
- Cliente dual de Supabase (anónimo + servicio)
- Validación de datos en frontend y backend
- Variables de entorno para claves sensibles
- Utilidades centralizadas para operaciones de base de datos

## 📱 Responsive Design

La aplicación está optimizada para dispositivos móviles, ya que los repartidores la usarán principalmente en sus teléfonos.

## 🚧 Funcionalidades Futuras

- Notificaciones push
- Historial de rutas completadas
- Análisis de rendimiento
- Integración con sistemas de pago

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.