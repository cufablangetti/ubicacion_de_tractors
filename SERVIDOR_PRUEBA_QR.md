# 🧪 Servidor de Prueba para QR - Recepción de Datos

Este es un servidor simple para probar la funcionalidad de escaneo QR y recepción de datos del viaje.

## 🚀 Opción 1: Servidor Node.js Simple

### Instalación Rápida:

```bash
# En una carpeta separada
mkdir servidor-prueba-qr
cd servidor-prueba-qr
npm init -y
npm install express cors
```

### Crear `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Endpoint para recibir datos del viaje
app.post('/api/registro-viaje', (req, res) => {
  console.log('\n=== 📊 NUEVO VIAJE RECIBIDO ===\n');
  
  const {
    chofer,
    fecha,
    horaInicio,
    horaFin,
    distanciaTotal,
    duracionTotal,
    velocidadPromedio,
    velocidadMaxima,
    paradas,
    ruta
  } = req.body;
  
  console.log('🚛 Chofer:', chofer);
  console.log('📅 Fecha:', new Date(fecha).toLocaleString('es-AR'));
  console.log('⏰ Inicio:', new Date(horaInicio).toLocaleTimeString('es-AR'));
  console.log('⏰ Fin:', new Date(horaFin).toLocaleTimeString('es-AR'));
  console.log('📏 Distancia:', distanciaTotal.toFixed(2), 'km');
  console.log('⏱️  Duración:', duracionTotal, 'minutos');
  console.log('🏃 Velocidad Promedio:', velocidadPromedio.toFixed(1), 'km/h');
  console.log('⚡ Velocidad Máxima:', velocidadMaxima.toFixed(1), 'km/h');
  console.log('🚏 Paradas:', paradas.length);
  console.log('📍 Puntos GPS:', ruta.length);
  
  if (paradas.length > 0) {
    console.log('\n--- PARADAS DETECTADAS ---');
    paradas.forEach((parada, index) => {
      console.log(`\nParada #${index + 1}:`);
      console.log(`  📍 Ubicación: ${parada.latitud}, ${parada.longitud}`);
      console.log(`  ⏰ Inicio: ${new Date(parada.inicio).toLocaleTimeString('es-AR')}`);
      console.log(`  ⏰ Fin: ${new Date(parada.fin).toLocaleTimeString('es-AR')}`);
      console.log(`  ⏱️  Duración: ${parada.duracion} minutos`);
    });
  }
  
  console.log('\n=== ✅ DATOS PROCESADOS EXITOSAMENTE ===\n');
  
  // Simular guardado en base de datos
  const viajeId = `VIAJE-${Date.now()}`;
  
  // Responder con éxito
  res.json({
    status: 'success',
    id: viajeId,
    mensaje: 'Viaje registrado correctamente',
    timestamp: new Date().toISOString(),
    datos_recibidos: {
      chofer,
      distancia: distanciaTotal,
      duracion: duracionTotal,
      paradas: paradas.length,
      puntos_gps: ruta.length
    }
  });
});

// Endpoint de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: 'Servidor de prueba QR - DIBIAGI',
    estado: 'activo',
    endpoint: '/api/registro-viaje',
    metodo: 'POST'
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 SERVIDOR DE PRUEBA QR INICIADO');
  console.log('='.repeat(60));
  console.log(`\n📡 Servidor escuchando en:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Red:     http://[TU-IP-LOCAL]:${PORT}`);
  console.log(`\n📌 Endpoint para QR:`);
  console.log(`   http://[TU-IP-LOCAL]:${PORT}/api/registro-viaje`);
  console.log('\n💡 Para generar QR, usa la URL completa del endpoint');
  console.log('='.repeat(60) + '\n');
});
```

### Ejecutar:

```bash
node server.js
```

### Obtener tu IP local:

**Windows:**
```bash
ipconfig
# Buscar "Dirección IPv4"
```

**Linux/Mac:**
```bash
ifconfig
# o
ip addr show
```

### Generar QR:

1. Obtén tu IP (ejemplo: `192.168.1.100`)
2. URL completa: `http://192.168.1.100:3001/api/registro-viaje`
3. Genera QR en: https://www.qr-code-generator.com/
4. ¡Escanea desde la app!

---

## 🌐 Opción 2: Usar Servicio Online de Prueba

### httpbin.org (Recomendado para testing):

**URL para QR:**
```
https://httpbin.org/post
```

**Ventaja:** No requiere configurar servidor  
**Desventaja:** Solo devuelve eco de datos, no los procesa

### webhook.site (Con UI visual):

1. Ir a: https://webhook.site/
2. Copiar la URL única generada
3. Crear QR con esa URL
4. Escanear desde la app
5. Ver los datos recibidos en la web

---

## 🎨 Opción 3: Servidor con Base de Datos

### Con SQLite (Persistencia Simple):

```javascript
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3001;

// Base de datos
const db = new sqlite3.Database('./viajes.db');

// Crear tabla si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS viajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chofer TEXT,
    fecha INTEGER,
    distancia_total REAL,
    duracion_total INTEGER,
    velocidad_promedio REAL,
    velocidad_maxima REAL,
    cantidad_paradas INTEGER,
    cantidad_puntos INTEGER,
    datos_completos TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/registro-viaje', (req, res) => {
  const datos = req.body;
  
  // Guardar en base de datos
  db.run(
    `INSERT INTO viajes (
      chofer, fecha, distancia_total, duracion_total,
      velocidad_promedio, velocidad_maxima,
      cantidad_paradas, cantidad_puntos, datos_completos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.chofer,
      datos.fecha,
      datos.distanciaTotal,
      datos.duracionTotal,
      datos.velocidadPromedio,
      datos.velocidadMaxima,
      datos.paradas.length,
      datos.ruta.length,
      JSON.stringify(datos)
    ],
    function(err) {
      if (err) {
        console.error('Error guardando:', err);
        return res.status(500).json({
          status: 'error',
          mensaje: err.message
        });
      }
      
      console.log(`✅ Viaje #${this.lastID} guardado`);
      
      res.json({
        status: 'success',
        id: this.lastID,
        mensaje: 'Viaje guardado en base de datos'
      });
    }
  );
});

// Ver todos los viajes
app.get('/api/viajes', (req, res) => {
  db.all('SELECT * FROM viajes ORDER BY fecha_registro DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      total: rows.length,
      viajes: rows.map(r => ({
        id: r.id,
        chofer: r.chofer,
        fecha: new Date(r.fecha).toLocaleString('es-AR'),
        distancia: r.distancia_total,
        duracion: r.duracion_total,
        paradas: r.cantidad_paradas,
        puntos: r.cantidad_puntos
      }))
    });
  });
});

// Ver viaje específico
app.get('/api/viajes/:id', (req, res) => {
  db.get('SELECT * FROM viajes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
    res.json({
      ...row,
      datos_completos: JSON.parse(row.datos_completos)
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor con DB iniciado en puerto ${PORT}`);
  console.log(`📊 Ver viajes: http://localhost:${PORT}/api/viajes\n`);
});
```

**Instalar dependencias:**
```bash
npm install sqlite3
```

---

## 📱 Opción 4: Backend Cloud (Producción)

### Desplegar en Vercel:

**`api/registro-viaje.js`:**
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  const datos = req.body;
  
  // Aquí conectarías con tu base de datos real
  // Por ejemplo: MongoDB, PostgreSQL, etc.
  
  console.log('Viaje recibido:', datos.chofer, datos.distanciaTotal);
  
  res.json({
    status: 'success',
    id: Date.now(),
    mensaje: 'Viaje registrado correctamente'
  });
}
```

**Desplegar:**
```bash
vercel
```

**URL del QR:**
```
https://tu-proyecto.vercel.app/api/registro-viaje
```

---

## 🔗 Generadores de QR Online

### Mejores Opciones:

1. **QR Code Generator** (Recomendado)
   - URL: https://www.qr-code-generator.com/
   - Gratis, sin registro
   - Alta calidad

2. **QR Code Monkey**
   - URL: https://www.qrcode-monkey.com/
   - Personalizable con logo
   - Descarga en alta resolución

3. **QR Stuff**
   - URL: https://www.qrstuff.com/
   - Múltiples formatos
   - Muy simple

### Cómo Usarlos:

1. Seleccionar tipo: **URL**
2. Pegar tu endpoint completo
3. Generar código
4. Descargar como PNG o SVG
5. Imprimir o mostrar en pantalla
6. Escanear desde la app

---

## 🧪 Probar el Sistema Completo

### Test 1: Servidor Local

```bash
# Terminal 1: Servidor de prueba
cd servidor-prueba-qr
node server.js

# Terminal 2: App React
cd google_maps_tractor
npm run dev

# Generar QR con: http://[TU-IP]:3001/api/registro-viaje
# Escanear desde móvil
# Ver datos en consola del servidor
```

### Test 2: httpbin.org

```bash
# Solo app React
npm run dev

# Generar QR con: https://httpbin.org/post
# Escanear desde la app
# Ver respuesta en pantalla
```

### Test 3: webhook.site

```bash
# 1. Ir a webhook.site
# 2. Copiar URL única
# 3. Generar QR
# 4. Escanear
# 5. Ver datos en el sitio web
```

---

## 📊 Ejemplo de Respuesta Exitosa

```json
{
  "status": "success",
  "id": "VIAJE-1734393600000",
  "mensaje": "Viaje registrado correctamente",
  "timestamp": "2024-12-17T12:00:00.000Z",
  "datos_recibidos": {
    "chofer": "Juan Pérez",
    "distancia": 12.5,
    "duracion": 120,
    "paradas": 3,
    "puntos_gps": 450
  }
}
```

---

## 🎯 Checklist de Prueba

- [ ] Servidor iniciado correctamente
- [ ] Obtener IP local del servidor
- [ ] Generar QR con URL completa
- [ ] Abrir app en móvil
- [ ] Finalizar un viaje de prueba
- [ ] Ver resumen completo
- [ ] Presionar "Escanear QR"
- [ ] Permitir acceso a cámara
- [ ] Apuntar al QR generado
- [ ] Ver URL detectada en pantalla
- [ ] Confirmar envío
- [ ] Verificar respuesta exitosa
- [ ] Ver datos en servidor/consola
- [ ] Probar con diferentes URLs
- [ ] Probar manejo de errores

---

## 💡 Tips para Producción

### Seguridad:
```javascript
// Validar origen
app.use(cors({
  origin: 'https://tu-app.vercel.app'
}));

// Validar datos
const validarViaje = (datos) => {
  if (!datos.chofer || !datos.distanciaTotal) {
    throw new Error('Datos incompletos');
  }
  if (datos.distanciaTotal < 0 || datos.distanciaTotal > 1000) {
    throw new Error('Distancia inválida');
  }
  return true;
};
```

### Autenticación:
```javascript
// Token en QR
const QR_URL = `https://api.com/viaje?token=SECRET_123`;

// Validar en servidor
if (req.query.token !== process.env.SECRET_TOKEN) {
  return res.status(401).json({ error: 'No autorizado' });
}
```

### Rate Limiting:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10 // 10 requests por ventana
});

app.use('/api/registro-viaje', limiter);
```

---

**¡Todo listo para probar el escáner QR en producción!** 🎉
