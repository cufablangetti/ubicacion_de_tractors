# 📋 Guía Paso a Paso para Desplegar en Vercel

## Método 1: Despliegue Manual (Más Rápido)

### Paso 1: Preparar el Proyecto

1. Abre una terminal en la carpeta del proyecto
2. Asegúrate de que todos los archivos estén guardados

### Paso 2: Instalar Vercel CLI

```powershell
npm install -g vercel
```

### Paso 3: Login en Vercel

```powershell
vercel login
```

Sigue las instrucciones para autenticarte (se abrirá tu navegador).

### Paso 4: Deployar

```powershell
vercel
```

**Preguntas que te hará:**
- **Set up and deploy?** → Presiona Enter (Yes)
- **Which scope?** → Selecciona tu cuenta
- **Link to existing project?** → No (presiona N)
- **What's your project's name?** → `dibiagi-gps-tracker` (o el nombre que prefieras)
- **In which directory is your code located?** → Presiona Enter (usa la actual)
- **Want to override the settings?** → No (presiona N)

Espera a que termine el deploy (1-2 minutos).

### Paso 5: Agregar la Clave de Google Maps

```powershell
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

**Te preguntará:**
- **What's the value?** → Pega tu clave de Google Maps
- **Add to which environment?** → Selecciona "Production" (presiona Enter)

### Paso 6: Re-deployar con las Variables

```powershell
vercel --prod
```

¡Listo! Te dará una URL como: `https://dibiagi-gps-tracker.vercel.app`

---

## Método 2: Desde GitHub (Recomendado para Producción)

### Paso 1: Crear Repositorio en GitHub

1. Ve a [github.com](https://github.com)
2. Haz clic en el botón "+" → "New repository"
3. Nombre: `dibiagi-gps-tracker`
4. Privado o Público (recomendado: Privado)
5. Clic en "Create repository"

### Paso 2: Subir el Código

En la terminal del proyecto:

```powershell
git init
git add .
git commit -m "Initial commit - DIBIAGI GPS Tracker"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/dibiagi-gps-tracker.git
git push -u origin main
```

### Paso 3: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "New Project"
3. Importa tu repositorio de GitHub
4. Configura:
   - **Framework Preset**: Next.js (detectado automáticamente)
   - **Root Directory**: ./ (dejar por defecto)
   - **Build Command**: `npm run build` (automático)
   - **Output Directory**: .next (automático)

### Paso 4: Agregar Variables de Entorno

En la sección "Environment Variables":

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = TU_CLAVE_AQUI
```

### Paso 5: Deploy

Haz clic en "Deploy" y espera (2-3 minutos).

### Paso 6: Configurar Dominio Personalizado (Opcional)

Si tienes un dominio propio (ej: gps.dibiagi.com):

1. En el dashboard de Vercel, ve a tu proyecto
2. Settings → Domains
3. Agrega tu dominio
4. Sigue las instrucciones para configurar DNS

---

## 🔑 Obtener Clave de Google Maps

### Paso 1: Ir a Google Cloud Console

Visita: https://console.cloud.google.com/

### Paso 2: Crear Proyecto

1. Haz clic en "Select a project" (arriba a la izquierda)
2. "NEW PROJECT"
3. Nombre: "DIBIAGI GPS"
4. Clic en "CREATE"

### Paso 3: Habilitar APIs

1. En el menú lateral: APIs & Services → Library
2. Busca: "Maps JavaScript API"
3. Clic en "ENABLE"

### Paso 4: Crear Clave de API

1. APIs & Services → Credentials
2. "CREATE CREDENTIALS" → "API key"
3. Copia la clave (algo como: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### Paso 5: Restringir la Clave (Importante)

1. Haz clic en "RESTRICT KEY"
2. Application restrictions → HTTP referrers
3. Agrega:
   ```
   https://tu-proyecto.vercel.app/*
   localhost:3000/*
   ```
4. API restrictions → Restrict key
5. Selecciona: "Maps JavaScript API"
6. SAVE

---

## 🔧 Actualizar la Aplicación

### Si usaste GitHub:

```powershell
git add .
git commit -m "Descripción de cambios"
git push
```

Vercel automáticamente detecta los cambios y hace el deploy.

### Si usaste CLI:

```powershell
vercel --prod
```

---

## ✅ Verificar que Funciona

1. Abre la URL de tu proyecto
2. Selecciona "Acceso Chofer"
3. Ingresa cualquier usuario y contraseña
4. Presiona "Iniciar Rastreo"
5. Debes ver el mapa con tu ubicación

**Si no funciona:**
- Abre la consola del navegador (F12)
- Revisa si hay errores
- Verifica que la clave de Google Maps esté configurada

---

## 📱 Probar en Celulares

### Acceso Remoto

1. Comparte la URL de Vercel con los choferes
2. Desde sus celulares, abren la URL
3. Para instalar: menú del navegador → "Instalar app"

### Acceso Local en Red

Si quieres probarlo antes de deployar:

```powershell
npm run dev
```

Busca tu IP local (en cmd: `ipconfig`)
Los celulares en la misma WiFi pueden acceder a: `http://TU-IP:3000`

---

## 🆘 Solución de Problemas Comunes

### "Failed to compile"
```powershell
# Borra node_modules y reinstala
Remove-Item -Recurse -Force node_modules
npm install
```

### "API key not valid"
- Verifica que la clave esté bien copiada
- Asegúrate de haber habilitado Maps JavaScript API
- Revisa las restricciones de la clave

### "Geolocation not available"
- Solo funciona en HTTPS (Vercel lo tiene por defecto)
- El usuario debe permitir acceso a ubicación
- En iOS Safari puede requerir configuración adicional

### "Command not found: vercel"
```powershell
# Reinstala Vercel CLI globalmente
npm uninstall -g vercel
npm install -g vercel
```

---

## 💡 Tips de Producción

1. **Backup de datos**: Implementa una base de datos real (Firebase/Supabase)
2. **Autenticación**: Usa sistema de login con JWT
3. **Monitoreo**: Configura alertas en Vercel para errores
4. **Logs**: Usa Vercel Analytics para ver uso
5. **Dominio**: Compra un dominio personalizado (ej: gps.dibiagi.com)

---

**¿Necesitas ayuda?** Contacta a soporte técnico de DIBIAGI
