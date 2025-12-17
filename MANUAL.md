# 📖 MANUAL DE USO - DIBIAGI GPS TRACKER

## 🎯 Para Choferes

### 1. Acceder a la Aplicación

**Desde el celular:**
- Abre el navegador (Chrome/Safari)
- Ve a la URL: `https://tu-proyecto.vercel.app`
- O escanea el código QR que te dará la empresa

**Primera vez:**
- El navegador pedirá "Agregar a pantalla de inicio"
- Acepta para instalarlo como app

### 2. Iniciar Sesión

```
👁️ Pantalla que verás:
┌─────────────────────────┐
│      DIBIAGI            │
│  Transporte Int. SA     │
├─────────────────────────┤
│ Sistema de Rastreo GPS  │
│                         │
│  [Acceso Chofer]  ←     │  Presiona aquí
│  [Panel Admin]          │
└─────────────────────────┘
```

**En la pantalla de login:**
- ID de Chofer: `CHOFER001` (el que te asignó la empresa)
- Contraseña: `tu_contraseña`
- Presiona "Iniciar Sesión"

### 3. Usar el Rastreo GPS

```
👁️ Pantalla principal:
┌─────────────────────────┐
│ DIBIAGI GPS             │
│ Chofer: CHOFER001       │ [Salir]
├─────────────────────────┤
│ Distancia: 125.5 km     │ Velocidad: 80 km/h
├─────────────────────────┤
│                         │
│     🗺️ MAPA             │
│     con tu              │
│     ubicación           │
│                         │
├─────────────────────────┤
│  [▶️ Iniciar Rastreo]   │ ← Presiona para empezar
└─────────────────────────┘
```

**Al presionar "Iniciar Rastreo":**
1. El navegador pedirá permiso de ubicación → ACEPTA
2. Verás tu posición en el mapa (punto azul)
3. A medida que conduces, se dibuja una línea roja
4. Los kilómetros se actualizan automáticamente
5. La velocidad se muestra en km/h

**Mientras rastreas:**
- Mantén la pantalla encendida (o usa un soporte)
- La app funciona en segundo plano
- No cierres el navegador

**Al terminar el viaje:**
- Presiona "⏹️ Detener Rastreo"
- Los datos se guardan automáticamente

### 4. Consejos Importantes

✅ **HACER:**
- Mantener datos móviles o WiFi activos
- Cargar el celular durante viajes largos
- Iniciar rastreo ANTES de salir
- Verificar que el GPS esté activo

❌ **NO HACER:**
- Cerrar el navegador durante el rastreo
- Desactivar la ubicación
- Usar modo avión
- Borrar datos del navegador

---

## 🖥️ Para Administradores

### 1. Acceder al Panel

**Desde la computadora o tablet:**
- Ve a: `https://tu-proyecto.vercel.app`
- Presiona "Panel Administrativo"

**Credenciales:**
- Usuario: `admin`
- Contraseña: `la_que_configures`

### 2. Panel de Control

```
👁️ Vista administrativa:
┌─────────────────────────────────────────┐
│ Panel Administrativo DIBIAGI            │
│ Administrador: admin          [Salir]   │
├─────────────────────────────────────────┤
│  Total Choferes: 15                     │
│  Choferes Activos: 8                    │
│  KM Total Hoy: 1,245.7                  │
├─────────────────────────────────────────┤
│ Estado de la Flota                      │
├──────────┬─────────┬────────┬───────────┤
│ ID       │ Nombre  │ KM     │ Estado    │
├──────────┼─────────┼────────┼───────────┤
│ CHOFER001│ Juan P. │ 245.5  │ 🟢 Activo │
│ CHOFER002│ María G.│ 189.3  │ ⚪ Inactivo│
│ CHOFER003│ Carlos R│ 312.7  │ 🟢 Activo │
└──────────┴─────────┴────────┴───────────┘
```

### 3. Interpretar los Datos

**Indicadores:**
- 🟢 **Activo**: Chofer en ruta, GPS transmitiendo
- ⚪ **Inactivo**: Chofer detuvo rastreo o sin conexión

**Última Actualización:**
- Muestra cuándo fue la última señal recibida
- Si es > 5 minutos, puede haber perdido señal

**Kilómetros:**
- Son del día actual (se resetea a medianoche)
- Solo cuenta cuando el rastreo está activo

### 4. Monitoreo Continuo

**El panel se actualiza automáticamente cada 10 segundos**

No necesitas refrescar la página.

---

## 🔧 Solución de Problemas

### Problema: "El mapa no se carga"

**Síntomas:** Pantalla en blanco donde debería estar el mapa

**Soluciones:**
1. ✅ Verifica tu conexión a internet
2. ✅ Recarga la página (F5)
3. ✅ Limpia caché del navegador
4. ✅ Intenta en modo incógnito
5. ✅ Prueba otro navegador

**Si persiste:** Contacta al administrador del sistema

---

### Problema: "GPS no funciona"

**Síntomas:** No aparece tu ubicación en el mapa

**Soluciones:**

**En Android:**
1. Configuración → Ubicación → Activar
2. Configuración → Apps → Chrome → Permisos → Ubicación → Permitir
3. En la app, recargar y aceptar permiso

**En iOS:**
1. Configuración → Privacidad → Ubicación → Activar
2. Configuración → Safari → Ubicación → Permitir
3. Usar Safari (no Chrome)

**Adicional:**
- Sal al exterior (mejor señal GPS)
- Espera 1-2 minutos para que conecte con satélites
- Reinicia el celular

---

### Problema: "No se guardan los kilómetros"

**Síntomas:** Los km vuelven a 0 o no se actualizan

**Soluciones:**
1. ✅ No uses modo incógnito
2. ✅ No borres datos del navegador
3. ✅ Mantén la app abierta durante el viaje
4. ✅ Verifica que el GPS esté activo

---

### Problema: "App muy lenta"

**Soluciones:**
1. ✅ Cierra otras apps en el celular
2. ✅ Limpia caché del navegador
3. ✅ Verifica conexión a internet
4. ✅ Reinicia el celular

---

## 📞 Contacto de Soporte

**Problemas técnicos:**
- 📧 Email: soporte@dibiagi.com
- 📱 WhatsApp: +54 XXX XXX XXXX
- 🕐 Horario: Lunes a Viernes 8am-6pm

**Emergencias fuera de horario:**
- 📞 Tel: +54 XXX XXX XXXX

---

## ❓ Preguntas Frecuentes

### ¿Consume muchos datos móviles?
Aproximadamente 5-10 MB por hora de uso activo. Con un plan de 1GB puedes usar la app ~100 horas.

### ¿Gasta mucha batería?
Sí, el GPS consume batería. Recomendamos usar cargador de auto.

### ¿Funciona sin internet?
Necesita internet para mostrar el mapa, pero guarda las posiciones localmente. Al recuperar internet, sincroniza.

### ¿Puedo usar otra app al mismo tiempo?
Sí, pero el navegador debe estar abierto en segundo plano.

### ¿Se puede falsificar la ubicación?
No fácilmente. La app usa el GPS real del dispositivo.

### ¿Qué precisión tiene?
±10-50 metros en exterior, según la señal GPS disponible.

### ¿Se puede ver el historial de rutas?
En la versión actual no. Está planificado para futuras actualizaciones.

### ¿Quién puede ver mi ubicación?
Solo los administradores con acceso al panel.

---

## 🎓 Tips para Mejores Resultados

1. **Inicia el rastreo ANTES de salir**
   - No esperes a estar en la ruta
   - Dale tiempo al GPS para conectar

2. **Mantén buena señal GPS**
   - Evita túneles largos
   - No dejes el celular en la guantera
   - Usa soporte con vista al cielo

3. **Carga el celular**
   - Usa cargador de auto
   - Batería externa como respaldo

4. **Verifica antes de cada viaje**
   - GPS activo ✅
   - Datos móviles activos ✅
   - Batería >50% ✅
   - App actualizada ✅

5. **Detén el rastreo al terminar**
   - Ahorra batería
   - Evita datos incorrectos

---

**¡Gracias por usar DIBIAGI GPS Tracker!** 🚛📍

© 2025 DIBIAGI Transporte Internacional SA
