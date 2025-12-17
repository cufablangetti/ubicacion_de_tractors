# 📊 Funcionalidad de Resumen de Viaje

## 🎯 Descripción General

Cuando el chofer finaliza un viaje, la aplicación automáticamente genera un **resumen completo** con todos los datos registrados y detecta **paradas prolongadas** durante el recorrido.

---

## ✨ Características Principales

### 1. **Datos del Viaje**
- ✅ Distancia total recorrida (km)
- ✅ Duración total del viaje
- ✅ Velocidad promedio
- ✅ Velocidad máxima
- ✅ Hora de inicio y finalización
- ✅ Cantidad de puntos GPS registrados
- ✅ Frecuencia promedio de captura

### 2. **Detección de Paradas** 🚏
La aplicación detecta automáticamente cuando el vehículo estuvo **detenido durante períodos prolongados**.

#### Criterios de Detección:
- **Radio de parada:** 50 metros
- **Tiempo mínimo:** 5 minutos consecutivos
- **Indicador visual:** Color según duración
  - 🟡 Amarillo: 5-14 minutos
  - 🟠 Naranja: 15-29 minutos
  - 🔴 Rojo: 30+ minutos

#### Información de Cada Parada:
- Número de parada
- Hora de inicio
- Hora de finalización
- Duración total
- Coordenadas GPS exactas
- Enlace directo a Google Maps

### 3. **Escaneo QR para Registro** 📱
- Botón destacado para escanear código QR
- Exportación de datos para sistema de campo
- Integración con registro de parcelas/campos

---

## 🛠️ Cómo Funciona

### Flujo de Usuario:

1. **Durante el Viaje:**
   - El GPS registra posiciones cada pocos segundos
   - Los datos se guardan localmente de forma continua

2. **Al Finalizar:**
   - Presionar botón "Finalizar Recorrido"
   - La app automáticamente:
     - Analiza todas las posiciones registradas
     - Detecta paradas según criterios
     - Calcula estadísticas completas
     - Guarda los datos
     - **Redirige a la página de resumen**

3. **En la Pantalla de Resumen:**
   - Ver estadísticas principales
   - Revisar lista de paradas detectadas
   - Escanear QR para enviar datos
   - Iniciar un nuevo viaje

---

## 📱 Interfaz de Resumen

### Sección Superior - Estadísticas
```
┌────────────────────────────────────┐
│  📊 Resumen del Viaje             │
│  Chofer: Juan Pérez                │
│  Martes, 17 de diciembre de 2024   │
├────────────────────────────────────┤
│  [12.5 km] [2h 15m] [55 km/h] [80 km/h]│
│  Distancia  Duración  Promedio  Máxima │
├────────────────────────────────────┤
│  Inicio: 08:30 HS | Fin: 10:45 HS  │
│  Puntos GPS: 450 | Frecuencia: ~18s│
└────────────────────────────────────┘
```

### Sección Media - Paradas Detectadas
```
┌────────────────────────────────────┐
│  🚏 Paradas Detectadas (3)        │
├────────────────────────────────────┤
│  Parada #1              [25 min]🟠│
│  Inicio: 09:00 HS               │
│  Fin: 09:25 HS                  │
│  Ubicación: -31.234567, -61.234 │
│  [Ver en Google Maps →]         │
├────────────────────────────────────┤
│  Parada #2              [8 min]🟡 │
│  Parada #3              [45 min]🔴│
└────────────────────────────────────┘
```

### Sección Inferior - Acciones
```
┌────────────────────────────────────┐
│  [📷 Escanear QR para Enviar Datos]│
│     Registrar en sistema de campo  │
│                                    │
│  [➕ Iniciar Nuevo Viaje]          │
└────────────────────────────────────┘
```

---

## 🔧 Configuración Técnica

### Parámetros Ajustables (en código):

```javascript
// En app/resumen/page.tsx

const TIEMPO_MINIMO_PARADA = 5; // minutos
const RADIO_PARADA = 0.05; // 50 metros en km
```

### Para Cambiar el Tiempo Mínimo de Parada:
```javascript
// Línea 40 aproximadamente
const paradasDetectadas = detectarParadas(
  viaje.posiciones, 
  5  // ← Cambiar este número (minutos)
);
```

---

## 📊 Datos Exportados al QR

Cuando se presiona "Escanear QR", se preparan estos datos:

```json
{
  "chofer": "Juan Pérez",
  "fecha": "2024-12-17T08:30:00.000Z",
  "horaInicio": "2024-12-17T08:30:00.000Z",
  "horaFin": "2024-12-17T10:45:00.000Z",
  "distanciaTotal": 12.5,
  "duracionTotal": 135,
  "velocidadPromedio": 55.4,
  "velocidadMaxima": 80.2,
  "paradas": [
    {
      "latitud": -31.234567,
      "longitud": -61.234567,
      "inicio": "2024-12-17T09:00:00.000Z",
      "fin": "2024-12-17T09:25:00.000Z",
      "duracion": 25
    }
  ],
  "ruta": [ /* Array completo de posiciones GPS */ ]
}
```

---

## 🚀 Próximas Mejoras

### Funcionalidad QR (En Desarrollo):
- [ ] Integración con librería de escaneo QR
- [ ] Envío automático al backend
- [ ] Confirmación de registro exitoso
- [ ] Generación de reporte PDF

### Análisis Avanzado:
- [ ] Detección de velocidad excesiva
- [ ] Alertas de desvío de ruta
- [ ] Consumo de combustible estimado
- [ ] Comparación con viajes anteriores

---

## 💡 Consejos de Uso

### Para Choferes:
1. **No cerrar la app durante el viaje** - Los datos se pierden
2. **Esperar a la pantalla de resumen** - Confirma que se guardó todo
3. **Revisar las paradas** - Verificar que sean correctas
4. **Escanear el QR inmediatamente** - Para no perder los datos

### Para Administradores:
1. **Configurar tiempo de parada** según necesidades de la empresa
2. **Revisar patrones de paradas** para optimizar rutas
3. **Analizar velocidades** para seguridad vial
4. **Exportar datos regularmente** para respaldo

---

## 🆘 Solución de Problemas

### "No se detectan paradas"
- Verificar que el tiempo de parada sea suficiente (>5 min)
- Confirmar que el GPS tuvo buena señal
- Revisar que el vehículo estuvo realmente detenido

### "Demasiadas paradas detectadas"
- Aumentar el tiempo mínimo de parada en el código
- Verificar la calidad de señal GPS durante el viaje

### "No aparece el botón de QR"
- Verificar que el navegador soporte cámara
- Dar permisos de cámara a la aplicación
- Recargar la página si es necesario

---

## 📞 Soporte

Para consultas sobre esta funcionalidad:
- Revisar MANUAL.md para guía de usuario
- Consultar USO_OPTIMIZADO.md para funciones GPS
- Contactar al administrador del sistema

---

**Versión:** 1.0  
**Última actualización:** Diciembre 2024  
**DIBIAGI - Sistema de Rastreo GPS**
