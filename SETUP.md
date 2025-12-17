# ⚡ CONFIGURACIÓN RÁPIDA (5 MINUTOS)

## Paso 1: Google Maps API Key

### Opción A: Ya tengo una cuenta Google Cloud
```
1. Ve a: https://console.cloud.google.com/
2. Selecciona tu proyecto o crea uno nuevo
3. Menú → APIs y servicios → Biblioteca
4. Busca: "Maps JavaScript API"
5. Clic en "HABILITAR"
6. Menú → APIs y servicios → Credenciales
7. "CREAR CREDENCIALES" → "Clave de API"
8. Copia la clave (empieza con AIza...)
```

### Opción B: Primera vez en Google Cloud
```
1. Ve a: https://console.cloud.google.com/
2. Acepta los términos
3. Clic en "Select a project" (arriba izquierda)
4. "NEW PROJECT"
5. Nombre: "DIBIAGI GPS" → CREATE
6. Espera 30 segundos
7. Menú lateral → APIs & Services → Library
8. Busca "Maps JavaScript API" → ENABLE
9. Vuelve a APIs & Services → Credentials
10. "CREATE CREDENTIALS" → "API key"
11. COPIA la clave mostrada
```

## Paso 2: Configurar el Proyecto

Abre el archivo `.env.local` y pega tu clave:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
```

⚠️ **IMPORTANTE:** Reemplaza el texto completo con TU clave.

## Paso 3: Probar Localmente

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
npm run dev
```

Espera el mensaje:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

Abre en tu navegador: http://localhost:3000

## Paso 4: Verificar que Funciona

### Test 1: Página de Inicio ✅
- Debes ver: Logo DIBIAGI y 2 botones

### Test 2: Login Chofer ✅
- Presiona "Acceso Chofer"
- Usuario: `test` / Password: `1234`
- Presiona "Iniciar Sesión"

### Test 3: Mapa ✅
- Debes ver un mapa de Google
- Si dice "Por favor permite acceso a ubicación" → OK
- Presiona "Iniciar Rastreo"
- Acepta el permiso de ubicación
- Debes ver un punto azul en tu ubicación

### Test 4: Panel Admin ✅
- Vuelve atrás y presiona "Panel Administrativo"
- Usuario: `admin` / Password: `admin`
- Debes ver tabla con choferes de ejemplo

## Paso 5: Desplegar en Vercel

### 5.1 Instalar Vercel CLI
```powershell
npm install -g vercel
```

### 5.2 Login
```powershell
vercel login
```
Se abrirá tu navegador → Confirma el login

### 5.3 Deploy
```powershell
vercel
```

Responde a las preguntas:
- **Set up and deploy?** → `Y` (Enter)
- **Which scope?** → Selecciona tu cuenta (Enter)
- **Link to existing project?** → `N` (Enter)
- **Project name?** → `dibiagi-gps` (o el que quieras)
- **Directory?** → `.` (Enter)
- **Override settings?** → `N` (Enter)

Espera 1-2 minutos...

### 5.4 Agregar Variable de Entorno
```powershell
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

Responde:
- **Value?** → Pega tu clave de Google Maps
- **Environment?** → Selecciona `Production` (Enter)

### 5.5 Deploy Final
```powershell
vercel --prod
```

Espera 1-2 minutos...

¡LISTO! Te dará una URL como:
```
https://dibiagi-gps.vercel.app
```

## Paso 6: Compartir con el Equipo

### Para Choferes:
1. Comparte la URL de Vercel
2. Pídeles que abran en su celular
3. Instrúyelos a "Agregar a pantalla de inicio"
4. Asigna usuario/contraseña a cada uno

### Para Administradores:
1. Comparte la URL + `/admin`
2. Ejemplo: `https://dibiagi-gps.vercel.app/admin`
3. Proporciona credenciales de admin

## ✅ Checklist Final

- [ ] Google Maps API creada y copiada
- [ ] Archivo `.env.local` configurado
- [ ] App funciona en localhost
- [ ] Mapa se ve correctamente
- [ ] GPS obtiene ubicación
- [ ] Deployed en Vercel
- [ ] Variable de entorno agregada en Vercel
- [ ] URL funciona en producción
- [ ] Probado en celular
- [ ] Instalado como PWA

## 🎉 ¡Todo Listo!

Tu aplicación está funcionando. Ahora:

1. **Personaliza colores** (opcional)
   - Edita `tailwind.config.js`

2. **Configura usuarios reales** (recomendado)
   - Lee `README.md` → Sección "Seguridad"

3. **Agrega base de datos** (producción)
   - Firebase o Supabase para datos persistentes

4. **Monitorea uso**
   - Ve a vercel.com → Analytics

## 🆘 Si Algo Sale Mal

### El mapa no se ve en localhost
```powershell
# Detén el servidor (Ctrl+C)
# Verifica que .env.local tenga la clave
# Reinicia
npm run dev
```

### Error al deployar en Vercel
```powershell
# Verifica que estés logueado
vercel whoami

# Si no, vuelve a hacer login
vercel login
```

### Mapa funciona local pero no en Vercel
```powershell
# Asegúrate de agregar la variable de entorno
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Luego redeploya
vercel --prod
```

### GPS no funciona en celular
1. Verifica que la URL sea HTTPS (Vercel lo da automático)
2. El usuario debe permitir ubicación en su navegador
3. Prueba en Safari (iOS) o Chrome (Android)

## 📞 Soporte

¿Problemas? Revisa:
1. `MANUAL.md` - Guía de uso completa
2. `README.md` - Documentación técnica
3. `DEPLOY.md` - Guía detallada de despliegue

---

**Total de tiempo: 5-10 minutos** ⏱️

**¡Éxito con tu sistema de rastreo GPS!** 🚛📍
