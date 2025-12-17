# 🚛 DIBIAGI - Sistema de Rastreo GPS

Sistema de rastreo GPS en tiempo real para la flota de **DIBIAGI Transporte Internacional SA**. Permite a los choferes compartir su ubicación en tiempo real y a los administradores monitorear todos los vehículos, rutas y kilómetros recorridos.

## 🌟 Características

- ✅ **Rastreo GPS en tiempo real** - Ubicación precisa de cada camión
- ✅ **Cálculo automático de kilómetros** - Distancia recorrida con precisión
- ✅ **Visualización de rutas** - Historial completo del recorrido
- ✅ **Panel administrativo** - Vista general de toda la flota
- ✅ **Optimizado para móviles** - PWA instalable en celulares
- ✅ **Funciona offline** - Guarda datos localmente
- ✅ **Despliegue en Vercel** - Hosting gratuito y rápido

## 📱 Capturas de Pantalla

### Vista del Chofer
- Pantalla de inicio de sesión
- Mapa con ubicación en tiempo real
- Contador de kilómetros y velocidad

### Panel Administrativo
- Dashboard con estadísticas
- Lista de choferes activos
- Kilómetros totales recorridos

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ instalado
- Una cuenta de Google Cloud (para Google Maps API)
- Cuenta en Vercel (gratis)

### Paso 1: Instalar Dependencias

```bash
npm install
```

### Paso 2: Configurar Google Maps API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Maps JavaScript API**
4. Crea una clave de API (API Key)
5. Restringe la clave a tu dominio (opcional pero recomendado)

### Paso 3: Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
```bash
copy .env.example .env.local
```

2. Abre `.env.local` y agrega tu clave de Google Maps:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_clave_aqui
```

### Paso 4: Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Despliegue en Vercel

### Opción 1: Desde la Terminal

1. Instala Vercel CLI:
```bash
npm install -g vercel
```

2. Ejecuta el deploy:
```bash
vercel
```

3. Sigue las instrucciones en pantalla

4. Configura la variable de entorno:
```bash
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### Opción 2: Desde GitHub (Recomendado)

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com) e inicia sesión
3. Haz clic en "New Project"
4. Importa tu repositorio de GitHub
5. En "Environment Variables" agrega:
   - **Name:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value:** Tu clave de Google Maps
6. Haz clic en "Deploy"

¡Listo! Tu aplicación estará disponible en `https://tu-proyecto.vercel.app`

## 📱 Instalar en Celulares

### Android (Chrome)
1. Abre la aplicación en Chrome
2. Toca el menú (⋮)
3. Selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"

### iOS (Safari)
1. Abre la aplicación en Safari
2. Toca el botón de compartir
3. Selecciona "Agregar a pantalla de inicio"

## 👥 Uso

### Para Choferes

1. Abrir la aplicación
2. Seleccionar "Acceso Chofer"
3. Ingresar ID de chofer (ej: CHOFER001) y contraseña
4. Presionar "Iniciar Rastreo"
5. El GPS comenzará a registrar la ruta y kilómetros

### Para Administradores

1. Abrir la aplicación
2. Seleccionar "Panel Administrativo"
3. Ingresar usuario admin y contraseña
4. Ver estadísticas de toda la flota en tiempo real

## 🔧 Configuración Avanzada

### Usar Base de Datos Real

Por defecto, la aplicación usa `localStorage` para demo. Para producción, recomendamos:

- **Firebase Realtime Database** (gratis hasta 1GB)
- **Supabase** (PostgreSQL gratis)
- **MongoDB Atlas** (gratis hasta 512MB)

### Personalizar Colores

Edita `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: '#tu-color-principal',
      secondary: '#tu-color-secundario',
    },
  },
}
```

## 🛡️ Seguridad

### Para Producción:

1. **Autenticación real**: Implementa un sistema de autenticación con JWT
2. **Base de datos**: Usa Firebase o similar para almacenar datos
3. **API Key**: Restringe tu clave de Google Maps a tu dominio
4. **HTTPS**: Vercel incluye HTTPS automáticamente

## 🐛 Solución de Problemas

### El mapa no se carga
- Verifica que la clave de Google Maps sea válida
- Asegúrate de haber habilitado la API de Maps JavaScript
- Revisa la consola del navegador para ver errores

### El GPS no funciona
- El dispositivo debe permitir acceso a la ubicación
- Solo funciona en HTTPS (Vercel lo provee automáticamente)
- En iOS, debe estar en Safari para mejor compatibilidad

### Los datos no se guardan
- Verifica que el navegador permita localStorage
- En modo incógnito puede no funcionar correctamente

## 📞 Soporte

Para problemas o preguntas:
- Email: soporte@dibiagi.com
- WhatsApp: +54 XXX XXX XXXX

## 📄 Licencia

© 2025 DIBIAGI Transporte Internacional SA. Todos los derechos reservados.

---

**Desarrollado con ❤️ para DIBIAGI**
