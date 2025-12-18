# 🧪 Guía de Prueba - Rastreo en Segundo Plano

## 🎯 Objetivo de la Prueba

Verificar que el GPS funciona **perfectamente** cuando:
- Cambias de aplicación
- Bloqueas la pantalla  
- Usas otras apps
- Dejas la app en segundo plano

---

## 📱 Preparación

1. **Accede a la app:**
   - Local: http://localhost:3000
   - Móvil: http://192.168.0.20:3000

2. **Permisos necesarios:**
   - ✅ Ubicación (Always Allow / Permitir siempre)
   - ✅ Notificaciones (Activar)
   - ✅ Desactivar ahorro de batería para el navegador

3. **Herramientas:**
   - Consola del navegador (F12)
   - Cronómetro (para medir tiempo en background)

---

## 🔬 Prueba 1: Cambio de Aplicación (5 minutos)

### Pasos:

1. **Iniciar rastreo:**
   ```
   - Login como driver
   - Nombre: Test
   - Legajo: 123
   - Patente: ABC123
   - Click "Iniciar Rastreo"
   ```

2. **Verificar que está activo:**
   - Abre consola (F12)
   - Deberías ver logs:
   ```
   📍 GPS PREMIUM: -34.5678901, -58.1234567 | Precisión: 4.23m | Velocidad: 0.00 km/h | Visibilidad: visible
   💾 10 posiciones guardadas (visible)
   💓 GPS Keep-Alive [☀️ FOREGROUND] - WatchID: 12
   ```

3. **Muévete un poco** (camina 50-100 metros):
   - Verifica que el marcador se mueve
   - La distancia aumenta
   - Se dibuja el polyline

4. **Cambia de app** (ej: WhatsApp, Chrome):
   - Observa en consola (antes de cambiar):
   ```
   🔄 App en segundo plano - GPS continúa activo
   💾 Guardada última posición antes de background: -34.567890, -58.123456
   ```
   - Verás notificación: "DIBIAGI GPS Activo - El rastreo GPS continúa..."

5. **Espera 5 minutos** en la otra app

6. **Vuelve a la app GPS:**
   - Observa en consola:
   ```
   ✅ App volvió al primer plano - recuperando datos
   ⏱️ Estuvo 5 minutos 23 segundos en segundo plano
   📦 Recuperando 15 posiciones del background
   ✅ Recuperado: +23.5m
   ✅ Recuperado: +21.8m
   ✅ Recuperado: +24.2m
   ... (12 más)
   🗺️ Polyline actualizado con 150 puntos (incluye recuperados)
   ```
   - Verás notificación: "GPS Recuperado - 15 puntos GPS recuperados"

### ✅ Resultado Esperado:

- [ ] El polyline NO tiene "saltos"
- [ ] La distancia aumentó proporcionalmente
- [ ] Se recuperaron posiciones del background
- [ ] Notificaciones aparecieron correctamente
- [ ] El recorrido es continuo

---

## 🔬 Prueba 2: Bloqueo de Pantalla (10 minutos)

### Pasos:

1. **Con el rastreo activo**, bloquea la pantalla

2. **Camina 500 metros** con la pantalla bloqueada

3. **Desbloquea después de 10 minutos**

4. **Abre la app GPS**

### ✅ Resultado Esperado:

- [ ] Se recuperan ~30-40 posiciones
- [ ] Distancia: +500m aproximadamente
- [ ] Polyline dibujado completamente
- [ ] Log muestra "10 minutos X segundos en segundo plano"
- [ ] Keep-Alive funcionó (~60 pings)

### 📊 Logs Esperados:

```
✅ App volvió al primer plano - recuperando datos
⏱️ Estuvo 10 minutos 12 segundos en segundo plano
📦 Recuperando 35 posiciones del background
✅ Recuperado: +14.2m
✅ Recuperado: +16.8m
✅ Recuperado: +13.5m
... (32 más)
📏 Distancia recuperada: +505.3m
🗺️ Polyline actualizado con 200 puntos (incluye recuperados)
```

---

## 🔬 Prueba 3: Uso Intensivo de Otras Apps

### Pasos:

1. **Inicia rastreo** y muévete continuamente

2. **Alterna entre apps cada 2 minutos:**
   - Minuto 0-2: GPS (visible)
   - Minuto 2-4: WhatsApp (GPS en background)
   - Minuto 4-6: GPS (vuelve, recupera)
   - Minuto 6-8: Chrome (GPS en background)
   - Minuto 8-10: GPS (vuelve, recupera)

3. **Verifica en cada retorno:**
   - Se recuperan posiciones
   - No hay saltos
   - Distancia precisa

### ✅ Resultado Esperado:

- [ ] 2-3 recuperaciones exitosas
- [ ] Cada recuperación con 6-10 posiciones
- [ ] Polyline completamente continuo
- [ ] Distancia total precisa
- [ ] Múltiples notificaciones de recuperación

---

## 🔬 Prueba 4: Keep-Alive Verification

### Pasos:

1. **Con rastreo activo**, observa la consola

2. **Cuenta los pings de Keep-Alive:**
   ```
   💓 GPS Keep-Alive [☀️ FOREGROUND] - WatchID: 12
   (10 segundos después)
   💓 GPS Keep-Alive [☀️ FOREGROUND] - WatchID: 12
   (10 segundos después)
   💓 GPS Keep-Alive [☀️ FOREGROUND] - WatchID: 12
   ```

3. **Cambia de app** y espera 30 segundos

4. **Vuelve y verifica:**
   - Debería haber 3 pings de BACKGROUND:
   ```
   💓 GPS Keep-Alive [🌙 BACKGROUND] - WatchID: 12
   💓 GPS Keep-Alive [🌙 BACKGROUND] - WatchID: 12
   💓 GPS Keep-Alive [🌙 BACKGROUND] - WatchID: 12
   ```

### ✅ Resultado Esperado:

- [ ] Ping cada 10 segundos (visible e invisible)
- [ ] WatchID consistente
- [ ] Estado correcto (☀️ FOREGROUND / 🌙 BACKGROUND)
- [ ] No errores en consola

---

## 🔬 Prueba 5: Persistencia en localStorage

### Pasos:

1. **Inicia rastreo** y muévete 200m

2. **Cambia de app** por 2 minutos

3. **Abre DevTools** (antes de volver a la app)
   - Application → Local Storage → http://192.168.0.20:3000
   - Busca key: `route_driver_2025-12-18`

4. **Verifica contenido:**
   - Deberías ver array de posiciones
   - Cada una con `lat`, `lng`, `timestamp`, `wasBackground`
   - Algunas con `wasBackground: true`

5. **Vuelve a la app** y verifica que se recuperan

### ✅ Resultado Esperado:

- [ ] localStorage tiene todas las posiciones
- [ ] Posiciones con `wasBackground: true` cuando estaba oculta
- [ ] Posiciones con `savedAt` timestamp
- [ ] Se recuperan correctamente al volver

---

## 🔬 Prueba 6: Recorrido Largo (30 minutos)

### Pasos:

1. **Inicia rastreo** al comenzar un recorrido real

2. **Usa el teléfono normalmente:**
   - Responde mensajes
   - Navega en Chrome
   - Recibe llamadas
   - Bloquea pantalla

3. **Cada vez que vuelvas a la app GPS**, verifica:
   - Notificación de recuperación
   - Polyline continuo
   - Distancia actualizada

4. **Al final (30 min), verifica:**
   - Distancia total precisa
   - ~300-400 posiciones registradas
   - Polyline completo sin gaps
   - Velocidad promedio calculada

### ✅ Resultado Esperado:

- [ ] Tracking continuo durante 30 minutos
- [ ] Multiple recuperaciones exitosas
- [ ] Polyline sin interrupciones
- [ ] Distancia precisa (comparar con odómetro)
- [ ] Estadísticas finales correctas

---

## 📊 Métricas a Verificar

### En Consola (F12):

```
✅ Logs de GPS:
   - Cada 1-3 segundos
   - Muestra estado de visibilidad
   - Precisión < 5m

✅ Keep-Alive:
   - Cada 10 segundos
   - Estado correcto (FOREGROUND/BACKGROUND)

✅ Guardado:
   - Cada 10 posiciones: "💾 X posiciones guardadas"
   - Estado visible/hidden

✅ Recuperación:
   - Al volver: "📦 Recuperando X posiciones"
   - Cada posición: "✅ Recuperado: +Xm"
   - Total: "🗺️ Polyline actualizado con X puntos"
```

### En Pantalla:

```
✅ Distancia:
   - 3 decimales (1.234 km)
   - Aumenta continuamente
   - No retrocede

✅ Velocidad:
   - 1 decimal (15.3 km/h)
   - Suave (sin picos)
   - 0.0 cuando quieto

✅ Precisión GPS:
   - Verde (<5m) = PREMIUM
   - Amarillo (>5m) = rechazado

✅ Polyline:
   - Rojo continuo
   - Sin saltos
   - Sin gaps
```

---

## 🐛 Problemas Comunes

### ❌ "No se recuperan posiciones"

**Causa:** localStorage bloqueado o lleno

**Solución:**
```javascript
// En consola
localStorage.clear(); // Limpiar todo
// Reiniciar tracking
```

---

### ❌ "GPS se pausa en background"

**Causa:** Restricciones del navegador/OS

**Solución:**
1. Settings → Apps → Chrome → Battery → Unrestricted
2. Settings → Apps → Chrome → Permissions → Location → Always
3. Mantener pantalla encendida (Wake Lock activo)

---

### ❌ "Polyline tiene saltos"

**Causa:** Filtros muy estrictos rechazan posiciones válidas

**Debug:**
```javascript
// Ver posiciones rechazadas en consola
// Buscar logs: "🔇", "🐌", "⚠️", "🔒"
// Si muchos rechazos consecutivos, considerar relajar filtros
```

---

### ❌ "No aparecen notificaciones"

**Causa:** Permisos denegados

**Solución:**
```
Settings → Notifications → Chrome → Allow
En la app: Aceptar permiso de notificaciones al inicio
```

---

## ✅ Checklist Final

Después de todas las pruebas:

- [ ] GPS funciona en FOREGROUND ✅
- [ ] GPS funciona en BACKGROUND ✅
- [ ] Recuperación automática funciona ✅
- [ ] Keep-Alive mantiene GPS activo ✅
- [ ] Notificaciones aparecen correctamente ✅
- [ ] localStorage guarda todas las posiciones ✅
- [ ] Polyline es continuo sin saltos ✅
- [ ] Distancia es precisa ✅
- [ ] Velocidad es suave ✅
- [ ] Filtros funcionan correctamente ✅

---

## 🎉 Si Todo Funciona...

**¡ÉXITO! El sistema de rastreo en segundo plano está funcionando perfectamente! 🚀**

Ahora puedes:
- ✅ Usar el teléfono normalmente
- ✅ Cambiar de app sin perder datos
- ✅ Bloquear pantalla sin interrumpir tracking
- ✅ Recibir llamadas sin saltos en el recorrido
- ✅ Confiar en la precisión del GPS

---

## 📝 Reportar Resultados

Si encuentras algún problema, anota:
1. ¿En qué paso ocurrió?
2. ¿Qué logs aparecieron en consola?
3. ¿Cuánto tiempo estuvo en background?
4. ¿Qué notificaciones aparecieron?
5. ¿Se recuperaron posiciones?

**Ejemplo de reporte:**
```
❌ Problema en Prueba 2 (Bloqueo de Pantalla)
- Tiempo en background: 10 minutos
- Logs: Solo 5 posiciones recuperadas (esperaba ~35)
- Notificación: Apareció correctamente
- Keep-Alive: Solo 30 pings (esperaba 60)
- Posible causa: GPS pausado por ahorro de batería
```

---

**¡Buena suerte con las pruebas! 🚀📍**
