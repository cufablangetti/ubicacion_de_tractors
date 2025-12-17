# ⚡ INICIO RÁPIDO - DIBIAGI GPS

## 🚀 Para Comenzar (5 minutos)

### 1. Instalar Dependencias
```powershell
npm install
```

### 2. Configurar Google Maps
1. Ve a: https://console.cloud.google.com/
2. Crea un proyecto nuevo
3. Habilita "Maps JavaScript API"
4. Crea una API Key
5. Copia el archivo `.env.example` a `.env.local`:
   ```powershell
   copy .env.example .env.local
   ```
6. Abre `.env.local` y pega tu API Key

### 3. Ejecutar en Desarrollo
```powershell
npm run dev
```

Abre: http://localhost:3000

### 4. Probar la Aplicación

**Como Chofer:**
- Usuario: CHOFER001
- Contraseña: cualquiera
- Clic en "Iniciar Rastreo"

**Como Admin:**
- Usuario: admin
- Contraseña: cualquiera
- Ver estadísticas de la flota

---

## 📦 Desplegar en Vercel

### Opción A: CLI (Más Rápido)
```powershell
npm install -g vercel
vercel login
vercel
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
vercel --prod
```

### Opción B: GitHub
1. Sube a GitHub
2. Conecta en vercel.com
3. Agrega la variable de entorno
4. Deploy

Ver guía completa en `DEPLOY.md`

---

## 📱 Características Principales

✅ **Rastreo GPS en tiempo real**
- Alta precisión con GPS del celular
- Actualización continua de posición
- Funciona con datos móviles o WiFi

✅ **Cálculo automático de KM**
- Algoritmo de distancia geodésica
- Precisión de ±50 metros
- Historial de recorridos

✅ **Panel Administrativo**
- Vista de todos los choferes
- Estado activo/inactivo
- KM totales del día

✅ **Optimizado para Celulares**
- PWA instalable
- Interfaz táctil
- Funciona offline (guarda en localStorage)

✅ **Deploy Gratuito en Vercel**
- HTTPS incluido
- CDN global
- Sin límite de tráfico (plan free)

---

## 🔧 Personalización

### Cambiar Colores
Edita `tailwind.config.js`:
```js
colors: {
  primary: '#TU_COLOR',
  secondary: '#TU_COLOR',
}
```

### Cambiar Nombre de Empresa
Busca y reemplaza "DIBIAGI" en todos los archivos.

### Agregar Logo
Coloca `logo.png` en `/public/` y edita los componentes.

---

## 📞 Ayuda

- 📖 Documentación completa: `README.md`
- 🚀 Guía de deploy: `DEPLOY.md`
- 🐛 Problemas comunes: Ver sección en DEPLOY.md

---

## ✨ Próximos Pasos

1. ✅ Instalar y probar localmente
2. ✅ Configurar Google Maps API
3. ✅ Deployar en Vercel
4. ✅ Probar en celulares reales
5. 🔄 Implementar base de datos real (Firebase/Supabase)
6. 🔐 Agregar autenticación segura
7. 📊 Implementar reportes y estadísticas avanzadas

---

**Desarrollado para DIBIAGI Transporte Internacional SA**
