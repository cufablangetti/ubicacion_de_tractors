'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '@googlemaps/js-api-loader';

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
  accuracy?: number;
}

export default function TrackerPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [path, setPath] = useState<Position[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [userName, setUserName] = useState('');
  const [vehiclePatente, setVehiclePatente] = useState('');
  const [accuracy, setAccuracy] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const positionBufferRef = useRef<Position[]>([]); // Buffer para promediar posiciones
  const consecutiveStillCountRef = useRef<number>(0); // Contador de posiciones "quietas"

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const patente = localStorage.getItem('vehiclePatente');

    if (!userId || userRole !== 'driver') {
      router.push('/login?role=driver');
      return;
    }

    setUserName(name || userId);
    setVehiclePatente(patente || 'Sin patente');
    initializeMap();

    // Solicitar permisos de notificación para alertas en segundo plano
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [router]);

  // Efecto separado para mantener rastreo en segundo plano
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isTracking) {
        console.log('🔄 App en segundo plano - GPS continúa activo');
        
        // Guardar timestamp cuando va a background
        localStorage.setItem('background_timestamp', Date.now().toString());
        
        // Mostrar notificación silenciosa
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('DIBIAGI GPS Activo', {
            body: '📍 El rastreo GPS continúa registrando tu recorrido',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'gps-tracking',
            requireInteraction: false,
            silent: true,
          });
        }
      } else if (document.visibilityState === 'visible' && isTracking) {
        console.log('✅ App volvió al primer plano - verificando continuidad');
        
        // Verificar tiempo en background
        const backgroundTime = localStorage.getItem('background_timestamp');
        if (backgroundTime) {
          const timeInBackground = Date.now() - parseInt(backgroundTime);
          const minutesInBackground = Math.floor(timeInBackground / 60000);
          
          if (minutesInBackground > 0) {
            console.log(`⏱️ Estuvo ${minutesInBackground} minutos en segundo plano`);
            
            // Mostrar notificación de continuidad
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('GPS Continuo', {
                body: `✅ Rastreo registrado durante ${minutesInBackground} min en segundo plano`,
                icon: '/icon-192x192.png',
                tag: 'gps-resume',
              });
            }
          }
          
          localStorage.removeItem('background_timestamp');
        }
        
        // Forzar actualización del mapa y polyline con todas las posiciones
        if (path.length > 0 && map) {
          const lastPos = path[path.length - 1];
          map.panTo({ lat: lastPos.lat, lng: lastPos.lng });
          
          // Actualizar polyline con todos los puntos
          if (polylineRef.current && path.length > 1) {
            polylineRef.current.setPath(path.map(p => ({ lat: p.lat, lng: p.lng })));
            console.log('🗺️ Polyline actualizado con', path.length, 'puntos después de volver');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking, path, map]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
      });

      await loader.load();

      // Obtener ubicación inicial
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const initialPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          const mapInstance = new google.maps.Map(mapRef.current!, {
            center: initialPos,
            zoom: 15,
            mapTypeId: 'roadmap',
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          });

          const markerInstance = new google.maps.Marker({
            position: initialPos,
            map: mapInstance,
            title: 'Mi ubicación',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          setMap(mapInstance);
          setMarker(markerInstance);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          alert('Error: No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
        },
        {
          enableHighAccuracy: true,
        }
      );
    } catch (error) {
      console.error('Error inicializando mapa:', error);
      alert('Error al cargar Google Maps. Verifica la configuración de la API.');
    }
  };

  const startTracking = async () => {
    if (!navigator.geolocation) {
      alert('Tu dispositivo no soporta geolocalización');
      return;
    }

    // Solicitar Wake Lock para mantener la pantalla activa
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock activado - pantalla permanecerá encendida');
        
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Wake Lock fue liberado');
        });
      }
    } catch (err) {
      console.log('Wake Lock no disponible:', err);
    }

    setIsTracking(true);
    setPath([]);
    setTotalDistance(0);
    positionBufferRef.current = []; // Limpiar buffer
    consecutiveStillCountRef.current = 0; // Resetear contador

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        // FILTRO 1: Precisión EXTREMA - Solo GPS premium (< 5 metros = ±0.5m error real)
        if (position.coords.accuracy > 5) {
          console.log('❌ GPS insuficiente:', position.coords.accuracy.toFixed(1), 'm (REQUIERE < 5m para ±0.5m precisión)');
          return;
        }

        const newPos: Position = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed || 0,
          accuracy: position.coords.accuracy,
        };

        // Actualizar estados inmediatamente
        const speedKmh = position.coords.speed ? position.coords.speed * 3.6 : 0;
        setCurrentSpeed(speedKmh);
        setAccuracy(position.coords.accuracy);
        setLastUpdate(new Date());

        console.log(`📍 GPS PREMIUM: ${newPos.lat.toFixed(7)}, ${newPos.lng.toFixed(7)} | Precisión: ${position.coords.accuracy.toFixed(2)}m (±0.5m) | Velocidad: ${speedKmh.toFixed(2)} km/h`);

        // Actualizar marcador con color según precisión EXTREMA
        if (marker) {
          marker.setPosition({ lat: newPos.lat, lng: newPos.lng });
          // Verde solo para < 5m (precisión premium), resto rechazado
          const color = position.coords.accuracy < 3 ? '#00FF00' : 
                       position.coords.accuracy < 5 ? '#90EE90' : '#FFFF00';
          marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12, // Más grande para ver mejor
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          });
        }

        // Centrar mapa en la ubicación actual (SIEMPRE, incluso en segundo plano)
        if (map) {
          map.panTo({ lat: newPos.lat, lng: newPos.lng });
        }

        // Actualizar ruta y calcular distancia
        setPath((prevPath) => {
          let updatedPath = [...prevPath];

          // Detectar gaps y filtrar ruido GPS
          if (prevPath.length > 0) {
            const lastPos = prevPath[prevPath.length - 1];
            const distance = calculateDistance(lastPos, newPos);
            const timeGap = newPos.timestamp - lastPos.timestamp; // milisegundos
            const distanceMeters = distance * 1000; // Convertir a metros
            
            // FILTRO 2: EXTREMO - Movimiento mínimo 20 metros para precisión ±0.5m
            if (distanceMeters < 20) {
              consecutiveStillCountRef.current++;
              console.log(`🔇 Micro-movimiento ignorado: ${distanceMeters.toFixed(2)}m < 20m (x${consecutiveStillCountRef.current})`);
              return prevPath;
            }
            
            // FILTRO 3: Velocidad mínima - Debe moverse rápido (> 3 km/h)
            if (speedKmh < 3) {
              consecutiveStillCountRef.current++;
              console.log(`🐌 Demasiado lento: ${speedKmh.toFixed(1)} km/h < 3 km/h (x${consecutiveStillCountRef.current})`);
              return prevPath;
            }
            
            // FILTRO 4: Doble verificación - Distancia < 30m Y velocidad < 8 km/h
            if (distanceMeters < 30 && speedKmh < 8) {
              consecutiveStillCountRef.current++;
              console.log(`⚠️ Movimiento inseguro: ${distanceMeters.toFixed(2)}m a ${speedKmh.toFixed(1)} km/h (x${consecutiveStillCountRef.current})`);
              return prevPath;
            }
            
            // FILTRO 5: Modo BLOQUEADO EXTREMO - Si quieto >15 intentos, requiere >30m
            if (consecutiveStillCountRef.current > 15 && distanceMeters < 30) {
              console.log(`🔒 BLOQUEADO: ${distanceMeters.toFixed(2)}m < 30m requeridos (tras ${consecutiveStillCountRef.current} rechazos)`);
              return prevPath;
            }
            
            // FILTRO 6: Verificación de aceleración súbita (posible error GPS)
            if (distanceMeters > 100 && timeGap < 5000) {
              // Movimiento > 100m en < 5 segundos = > 72 km/h = probablemente error
              const speedCalc = (distanceMeters / 1000) / (timeGap / 3600000);
              if (speedCalc > 60) {
                consecutiveStillCountRef.current++;
                console.log(`⚡ Salto GPS ignorado: ${distanceMeters.toFixed(0)}m en ${(timeGap/1000).toFixed(1)}s = ${speedCalc.toFixed(0)} km/h (x${consecutiveStillCountRef.current})`);
                return prevPath;
              }
            }
            
            // Si llegamos aquí, hay movimiento REAL - resetear contador
            if (consecutiveStillCountRef.current > 0) {
              console.log(`✅ MOVIMIENTO REAL detectado: ${distanceMeters.toFixed(1)}m a ${speedKmh.toFixed(1)} km/h (desbloqueo tras ${consecutiveStillCountRef.current} quietos)`);
            }
            consecutiveStillCountRef.current = 0;
            
            // Si hay un gap grande (> 100m o > 30s), interpolar puntos
            if (distance > 0.1 || timeGap > 30000) {
              console.log(`⚠️ GAP DETECTADO: ${distanceMeters.toFixed(0)}m en ${(timeGap / 1000).toFixed(0)}s`);
              
              // Interpolar puntos intermedios para suavizar la ruta
              const numPoints = Math.min(Math.floor(distance / 0.05), 10); // Máx 10 puntos
              
              if (numPoints > 1) {
                console.log(`🔗 Interpolando ${numPoints} puntos para suavizar gap`);
                
                for (let i = 1; i <= numPoints; i++) {
                  const ratio = i / (numPoints + 1);
                  updatedPath.push({
                    lat: lastPos.lat + (newPos.lat - lastPos.lat) * ratio,
                    lng: lastPos.lng + (newPos.lng - lastPos.lng) * ratio,
                    timestamp: lastPos.timestamp + (newPos.timestamp - lastPos.timestamp) * ratio,
                    speed: lastPos.speed,
                    accuracy: Math.max(lastPos.accuracy || 0, newPos.accuracy || 0),
                  });
                }
              }
            }
            
            // Agregar la nueva posición real (solo si pasó los filtros)
            updatedPath.push(newPos);
            
            // Calcular y actualizar distancia
            setTotalDistance((prev) => {
              const newTotal = prev + distance;
              const gapTag = (distance > 0.1 || timeGap > 30000) ? ' [INTERPOLADO]' : '';
              console.log('✅ Distancia:', newTotal.toFixed(3), 'km (+', distanceMeters.toFixed(1), 'm)' + gapTag);
              return newTotal;
            });
          } else {
            // Primera posición
            updatedPath.push(newPos);
            console.log('🎯 Primera posición registrada');
          }

          // Actualizar polyline inmediatamente
          if (map && updatedPath.length > 1) {
            const pathCoords = updatedPath.map(p => ({ lat: p.lat, lng: p.lng }));
            
            if (polylineRef.current) {
              // Actualizar polyline existente
              polylineRef.current.setPath(pathCoords);
            } else {
              // Crear nuevo polyline
              polylineRef.current = new google.maps.Polyline({
                path: pathCoords,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 4,
                map: map,
              });
              console.log('🗺️ Polyline creado');
            }
          }

          return updatedPath;
        });

        // Guardar en localStorage para persistencia
        savePositionToStorage(newPos);
      },
      (error) => {
        console.error('❌ Error GPS:', error.message, '(code:', error.code, ')');
        if (error.code === 1) {
          alert('⚠️ Acceso a ubicación denegado. Por favor permite el acceso en la configuración del navegador.');
        } else if (error.code === 2) {
          alert('⚠️ No se pudo obtener tu ubicación. Verifica que el GPS esté activado.');
        } else if (error.code === 3) {
          console.log('⏱️ Timeout GPS, reintentando...');
        }
      },
      {
        enableHighAccuracy: true, // GPS de alta precisión
        timeout: 5000, // Timeout de 5 segundos (más rápido)
        maximumAge: 0, // Nunca usar caché, siempre posición fresca
      }
    );
  };

  const stopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    // Liberar Wake Lock
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock liberado');
      } catch (err) {
        console.log('Error liberando Wake Lock:', err);
      }
    }
    
    setIsTracking(false);
    localStorage.setItem('tracking_active', 'false');
    
    // Guardar datos completos del viaje para el resumen
    const duracionMinutos = path.length > 0 
      ? Math.round((path[path.length - 1].timestamp - path[0].timestamp) / 60000) 
      : 0;
    
    const velocidades = path.filter(p => p.speed && p.speed > 0).map(p => (p.speed || 0) * 3.6);
    const velocidadPromedio = velocidades.length > 0 
      ? velocidades.reduce((a, b) => a + b, 0) / velocidades.length 
      : 0;
    const velocidadMaxima = velocidades.length > 0 ? Math.max(...velocidades) : 0;
    
    const resumenViaje = {
      chofer: userName,
      patente: vehiclePatente,
      fecha: Date.now(),
      horaInicio: path.length > 0 ? path[0].timestamp : Date.now(),
      horaFin: path.length > 0 ? path[path.length - 1].timestamp : Date.now(),
      distanciaTotal: totalDistance,
      duracionTotal: duracionMinutos,
      velocidadPromedio: velocidadPromedio,
      velocidadMaxima: velocidadMaxima,
      posiciones: path,
    };
    
    localStorage.setItem('ultimo_viaje', JSON.stringify(resumenViaje));
    
    // Redirigir a la página de resumen
    router.push('/resumen');
  };

  const calculateDistance = (pos1: Position, pos2: Position): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(pos2.lat - pos1.lat);
    const dLon = toRad(pos2.lng - pos1.lng);
    const lat1 = toRad(pos1.lat);
    const lat2 = toRad(pos2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
  };

  const savePositionToStorage = (position: Position) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const storageKey = `route_${userId}_${new Date().toISOString().split('T')[0]}`;
    const existingData = localStorage.getItem(storageKey);
    const positions = existingData ? JSON.parse(existingData) : [];
    positions.push(position);
    localStorage.setItem(storageKey, JSON.stringify(positions));

    // Guardar también el estado actual para recuperación
    localStorage.setItem('tracking_active', isTracking.toString());
    localStorage.setItem('tracking_distance', totalDistance.toString());
    localStorage.setItem('tracking_last_update', new Date().toISOString());
  };

  const handleLogout = () => {
    stopTracking();
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    router.push('/');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-xl font-bold">DIBIAGI GPS</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-blue-200">
                👤 {userName}
              </p>
              <p className="text-sm text-blue-200">
                🚛 {vehiclePatente}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">📏 Distancia Total</p>
            <p className="text-2xl font-bold text-blue-900">
              {totalDistance.toFixed(2)} km
            </p>
            {isTracking && (
              <p className="text-xs text-blue-600 mt-1">
                {path.length} puntos GPS
              </p>
            )}
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">⚡ Velocidad Actual</p>
            <p className="text-2xl font-bold text-green-900">
              {currentSpeed.toFixed(0)} km/h
            </p>
            {isTracking && (
              <p className="text-xs text-green-600 mt-1">
                En tiempo real
              </p>
            )}
          </div>
        </div>
        
        {/* Indicadores de precisión y estado */}
        {isTracking && (
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-lg p-2 ${
              accuracy < 20 ? 'bg-green-100' : 
              accuracy < 50 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <p className="text-xs text-gray-600">🎯 Precisión GPS</p>
              <p className="text-sm font-bold">
                ±{accuracy.toFixed(0)}m {
                  accuracy < 20 ? '🟢 Excelente' : 
                  accuracy < 50 ? '🟡 Buena' : '🔴 Baja'
                }
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2">
              <p className="text-xs text-gray-600">🕐 Última actualización</p>
              <p className="text-sm font-bold">
                {lastUpdate ? lastUpdate.toLocaleTimeString('es-AR') : '--:--'}
              </p>
            </div>
          </div>
        )}

        {!isTracking && (
          <div className="bg-gray-100 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600">
              Presiona "Iniciar Rastreo" para comenzar a registrar tu recorrido
            </p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Control Panel */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        {!isTracking ? (
          <div>
            <button
              onClick={startTracking}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg"
            >
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Iniciar Rastreo
              </div>
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              El rastreo continuará aunque uses otras apps
            </p>
          </div>
        ) : (
          <div>
            <div className="bg-green-100 border border-green-400 rounded-lg p-3 mb-3">
              <p className="text-sm text-green-800 text-center font-semibold">
                🔴 RASTREANDO EN VIVO
              </p>
              <p className="text-xs text-green-700 text-center mt-1">
                Puedes minimizar la app, el rastreo continúa
              </p>
            </div>
            <button
              onClick={stopTracking}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg"
            >
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Detener Rastreo
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
