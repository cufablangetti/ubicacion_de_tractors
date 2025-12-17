# 📷 Guía del Escáner QR - Envío de Datos al Sistema de Campo

## 🎉 ¡Funcionalidad Completa Implementada!

Ahora puedes **escanear códigos QR con la cámara de tu dispositivo** y enviar automáticamente los datos del viaje al sistema de registro de campo.

---

## 🎯 ¿Cómo Funciona?

### Flujo Completo:

```
1. Finalizar Viaje
         ↓
2. Ver Resumen Completo
         ↓
3. Presionar "Escanear QR para Enviar Datos"
         ↓
4. Se abre la CÁMARA REAL
         ↓
5. Apuntar al código QR del campo
         ↓
6. El sistema detecta automáticamente la URL
         ↓
7. Confirmar envío
         ↓
8. Datos enviados al servidor del campo
         ↓
9. ✅ Confirmación de envío exitoso
```

---

## 📱 Paso a Paso Detallado

### 1️⃣ Preparar el Código QR del Campo

El código QR debe contener:
- **URL del endpoint** del sistema de registro de campo
- Formato: `https://tu-servidor.com/api/registro-viaje`
- O cualquier URL válida que acepte datos POST

**Ejemplo de QR válido:**
```
https://api.dibiagi.com/campo/registro
https://sistema-campo.com/viajes/nuevo
http://192.168.1.100:3000/api/viaje
```

### 2️⃣ Abrir el Escáner

1. En la pantalla de **Resumen del Viaje**
2. Presionar el botón morado: **"Escanear QR para Enviar Datos"**
3. La app solicitará **permiso de cámara** (solo la primera vez)
4. **Permitir acceso** a la cámara

### 3️⃣ Escanear el QR

**Instrucciones en pantalla:**
- ✅ Coloca el código QR dentro del **recuadro blanco animado**
- ✅ Mantén la cámara **estable y enfocada**
- ✅ El escaneo es **totalmente automático**
- ✅ Usa la **linterna** si hay poca luz (botón en pantalla)

**El escáner detectará:**
- La URL del servidor automáticamente
- Mostrará la URL detectada en verde
- Pedirá confirmación antes de enviar

### 4️⃣ Confirmar y Enviar

Aparecerá un diálogo de confirmación:
```
¿Enviar datos del viaje a:
sistema-campo.com

Distancia: 12.5 km
Paradas: 3

¿Continuar?
[Cancelar] [OK]
```

- Presionar **OK** para enviar
- Presionar **Cancelar** para volver a escanear

### 5️⃣ Recibir Confirmación

Si todo va bien:
```
✅ Datos enviados exitosamente!

Respuesta del servidor:
{
  "id": "12345",
  "status": "success",
  "mensaje": "Viaje registrado correctamente"
}
```

Si hay error:
```
❌ Error: No se pudo conectar con el servidor
- Verifica tu conexión a internet
- Confirma que la URL sea correcta
- Intenta nuevamente
```

---

## 📊 Datos Enviados Automáticamente

Cuando escaneas el QR, se envía un **POST request** con estos datos:

```json
{
  "chofer": "Juan Pérez",
  "fecha": 1734393600000,
  "horaInicio": 1734393600000,
  "horaFin": 1734400800000,
  "distanciaTotal": 12.5,
  "duracionTotal": 120,
  "velocidadPromedio": 62.5,
  "velocidadMaxima": 85.0,
  "paradas": [
    {
      "latitud": -31.4201,
      "longitud": -64.1888,
      "inicio": "2024-12-17T08:30:00.000Z",
      "fin": "2024-12-17T08:45:00.000Z",
      "duracion": 15
    },
    {
      "latitud": -31.4551,
      "longitud": -64.2238,
      "inicio": "2024-12-17T09:30:00.000Z",
      "fin": "2024-12-17T10:00:00.000Z",
      "duracion": 30
    }
  ],
  "ruta": [
    {
      "lat": -31.4201,
      "lng": -64.1888,
      "timestamp": 1734393600000,
      "speed": 50,
      "accuracy": 10
    },
    // ... más de 400 puntos GPS
  ]
}
```

---

## 🔧 Requisitos del Sistema de Campo

### El Endpoint Debe:

1. **Aceptar método POST**
   ```
   POST https://tu-servidor.com/api/registro
   ```

2. **Recibir JSON en el body**
   ```
   Content-Type: application/json
   ```

3. **Responder con JSON**
   ```json
   {
     "status": "success",
     "id": "12345",
     "mensaje": "Datos recibidos"
   }
   ```

### Ejemplo de Backend (Node.js/Express):

```javascript
app.post('/api/registro-viaje', async (req, res) => {
  try {
    const {
      chofer,
      fecha,
      distanciaTotal,
      paradas,
      ruta
    } = req.body;
    
    // Guardar en base de datos
    const viaje = await db.viajes.create({
      chofer,
      fecha,
      distanciaTotal,
      paradas,
      ruta
    });
    
    res.json({
      status: 'success',
      id: viaje.id,
      mensaje: 'Viaje registrado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      mensaje: error.message
    });
  }
});
```

---

## 🎨 Características de la Interfaz

### Elementos Visuales:

1. **Recuadro Animado**
   - Guía visual para centrar el QR
   - Animación pulsante
   - Ajuste automático de tamaño

2. **Indicadores de Estado**
   - 🟢 Verde: URL detectada correctamente
   - 🔵 Azul: Instrucciones
   - 🔴 Rojo: Errores o advertencias

3. **Información en Tiempo Real**
   - Datos a enviar (distancia, paradas, puntos)
   - URL detectada
   - Estado del envío

4. **Linterna Integrada**
   - Botón para activar flash
   - Útil en condiciones de poca luz
   - Solo en dispositivos compatibles

---

## 🚨 Manejo de Errores

### Error: "Permiso de cámara denegado"

**Causa:** No se permitió acceso a la cámara

**Solución:**
1. Ir a configuración del navegador
2. Buscar permisos del sitio
3. Habilitar cámara para la aplicación
4. Recargar la página

### Error: "No se encontró ninguna cámara"

**Causa:** El dispositivo no tiene cámara

**Solución:**
- Usar un dispositivo con cámara
- Probar con otro navegador
- Verificar que la cámara funcione en otras apps

### Error: "La cámara está siendo usada"

**Causa:** Otra aplicación usa la cámara

**Solución:**
1. Cerrar otras apps que usen la cámara
2. Reiniciar el navegador
3. Intentar nuevamente

### Error: "El QR no contiene una URL válida"

**Causa:** El QR no tiene formato correcto

**Solución:**
- Verificar que el QR contenga una URL
- El formato debe ser: `http://` o `https://`
- Regenerar el QR si es necesario

### Error: "Error de conexión"

**Causa:** No hay internet o el servidor no responde

**Solución:**
- Verificar conexión a internet
- Confirmar que el servidor esté activo
- Probar la URL en un navegador
- Intentar más tarde

---

## 🔐 Seguridad y Privacidad

### Datos Locales:
- ✅ Los datos se guardan temporalmente en el navegador
- ✅ Se borran después de envío exitoso
- ✅ No se almacenan en servidores externos sin tu consentimiento

### Permisos:
- ✅ Solo solicita acceso a cámara cuando lo necesita
- ✅ Los permisos se pueden revocar en cualquier momento
- ✅ No accede a otros datos del dispositivo

### Transmisión:
- ✅ Los datos se envían directamente al servidor del QR
- ✅ Conexión HTTPS recomendada para seguridad
- ✅ No hay intermediarios en la comunicación

---

## 💡 Consejos y Mejores Prácticas

### Para Obtener Mejores Resultados:

1. **Iluminación**
   - Usa buena luz natural o artificial
   - Activa la linterna si es necesario
   - Evita reflejos en el QR

2. **Distancia**
   - Mantén 10-30 cm del QR
   - No te acerques demasiado
   - No te alejes demasiado

3. **Estabilidad**
   - Mantén el celular firme
   - Apoya los codos si es posible
   - Espera 1-2 segundos sin mover

4. **Calidad del QR**
   - Asegúrate que esté nítido
   - Sin arrugas ni daños
   - Tamaño mínimo recomendado: 3x3 cm

5. **Conexión**
   - Verifica tener internet estable
   - WiFi es mejor que datos móviles
   - Evita enviar en zonas sin señal

---

## 🧪 Probar el Sistema

### Generar un QR de Prueba:

1. Ir a: https://www.qr-code-generator.com/
2. Elegir "URL"
3. Ingresar: `https://httpbin.org/post`
4. Descargar el QR
5. Escanear desde la app

**Resultado esperado:**
```json
{
  "data": "{\"chofer\":\"...\",\"distanciaTotal\":12.5,...}",
  "headers": {...},
  "url": "https://httpbin.org/post"
}
```

---

## 📱 Compatibilidad

### Navegadores Compatibles:
- ✅ **Chrome/Edge (Android)** - Excelente
- ✅ **Safari (iOS)** - Excelente
- ✅ **Firefox Mobile** - Bueno
- ✅ **Samsung Internet** - Bueno
- ⚠️ **Opera Mini** - Limitado

### Dispositivos:
- ✅ Smartphones (Android/iOS)
- ✅ Tablets con cámara
- ⚠️ Computadoras con webcam (funciona pero no ideal)

### Permisos Necesarios:
- 📷 Acceso a cámara (obligatorio)
- 🌐 Conexión a internet (obligatorio)
- 💡 Flash/linterna (opcional)

---

## 🔄 Flujo en Caso de Error

```
1. Abrir Escáner
         ↓
2. Error Detectado
         ↓
3. Mensaje de Error en Pantalla
         ↓
4. Revisar y Corregir el Problema
         ↓
5. Intentar Nuevamente
         ↓
6. ✅ Escaneo Exitoso
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Entrega en Campo

```
Chofer termina entrega → 
Ve resumen → 
Escanea QR del campo → 
Datos registrados automáticamente → 
Confirmación recibida
```

### Caso 2: Múltiples Entregas

```
Viaje con 5 paradas → 
Resumen muestra todas las paradas → 
Escanea QR del despacho central → 
Sistema actualiza inventario → 
Facturas generadas automáticamente
```

### Caso 3: Inspección de Ruta

```
Supervisor revisa viaje → 
Escanea QR de auditoría → 
Datos enviados al sistema de control → 
Análisis de eficiencia generado → 
Reporte disponible
```

---

## 📞 Soporte

### Problemas Comunes:

| Problema | Solución Rápida |
|----------|----------------|
| No se abre la cámara | Verificar permisos |
| QR no se detecta | Mejorar iluminación |
| Error de conexión | Verificar internet |
| Servidor no responde | Contactar administrador |
| URL inválida | Regenerar QR |

### Documentación Relacionada:
- `NUEVA_FUNCIONALIDAD.md` - Guía completa de resumen
- `RESUMEN_VIAJE.md` - Documentación técnica
- `MANUAL.md` - Manual de usuario general

---

## ✨ Resumen de Funcionalidad

### ✅ Lo que HACE:
- Abre la cámara real del dispositivo
- Escanea códigos QR automáticamente
- Extrae la URL del QR
- Envía los datos del viaje por POST
- Muestra confirmación del servidor
- Maneja errores de forma clara

### ❌ Lo que NO hace:
- No guarda fotos del QR
- No envía datos a múltiples destinos
- No modifica los datos originales
- No requiere internet para ver el resumen (solo para enviar)

---

**¡Listo para usar!** 🎉

El escáner QR está completamente funcional y listo para producción. Pruébalo escaneando cualquier QR que contenga una URL y verás cómo se envían los datos automáticamente.

---

**Versión:** 2.1  
**Última actualización:** Diciembre 2024  
**DIBIAGI - Sistema de Rastreo GPS con Escáner QR Integrado**
