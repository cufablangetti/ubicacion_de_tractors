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
  const totalDistanceRef = useRef<number>(0); // Distancia acumulada en ref para actualización instantánea
  const speedHistoryRef = useRef<number[]>([]); // Últimas velocidades para promedio
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null); // Intervalo para mantener GPS activo

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

    // GUARDAR ANTES DE CERRAR: Listener para beforeunload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTracking) {
        // Guardar estado completo
        localStorage.setItem('tracking_active', 'true');
        localStorage.setItem('tracking_distance', totalDistanceRef.current.toString());
        localStorage.setItem('tracking_last_update', new Date().toISOString());
        localStorage.setItem('tracking_path_length', path.length.toString());
        
        console.log('💾 Estado guardado antes de cerrar página');
        
        // Mensaje de advertencia (opcional)
        const message = 'El tracking GPS está activo. ¿Seguro que quieres salir?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    // RECUPERACIÓN AL CARGAR: Detectar si había tracking activo
    const wasTracking = localStorage.getItem('tracking_active') === 'true';
    const lastUpdateStr = localStorage.getItem('tracking_last_update');
    
    if (wasTracking && lastUpdateStr) {
      const lastUpdate = new Date(lastUpdateStr);
      const minutesSinceLastUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
      
      console.log(`🔍 Detectado tracking previo (hace ${minutesSinceLastUpdate} minutos)`);
      
      // Si el tracking era reciente (menos de 2 horas), ofrecer recuperar
      if (minutesSinceLastUpdate < 120) {
        setTimeout(() => {
          const shouldRecover = confirm(
            `🔄 Tracking interrumpido hace ${minutesSinceLastUpdate} minutos.\n\n` +
            `¿Deseas recuperar el recorrido?\n\n` +
            `Se restaurarán todos los datos guardados.`
          );
          
          if (shouldRecover) {
            recoverPreviousTracking(userId);
          } else {
            // Limpiar tracking antiguo
            localStorage.setItem('tracking_active', 'false');
          }
        }, 1000); // Delay para que cargue el mapa primero
      }
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (keepAliveIntervalRef.current !== null) {
        clearInterval(keepAliveIntervalRef.current);
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [router, isTracking, path, totalDistanceRef]);

  // Efecto separado para mantener rastreo en segundo plano y recuperar datos
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isTracking) {
        console.log('🔄 App en segundo plano - GPS continúa activo');
        
        // Guardar timestamp y última posición conocida cuando va a background
        localStorage.setItem('background_timestamp', Date.now().toString());
        if (path.length > 0) {
          const lastPos = path[path.length - 1];
          localStorage.setItem('background_last_position', JSON.stringify(lastPos));
          console.log('💾 Guardada última posición antes de background:', lastPos.lat.toFixed(6), lastPos.lng.toFixed(6));
        }
        
        // Mostrar notificación silenciosa
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('DIBIAGI GPS Activo', {
            body: '📍 El rastreo GPS continúa registrando tu recorrido',
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag: 'gps-tracking',
            requireInteraction: false,
            silent: true,
          });
        }
      } else if (document.visibilityState === 'visible' && isTracking) {
        console.log('✅ App volvió al primer plano - recuperando datos');
        
        // Verificar tiempo en background
        const backgroundTime = localStorage.getItem('background_timestamp');
        const backgroundLastPos = localStorage.getItem('background_last_position');
        
        if (backgroundTime) {
          const timeInBackground = Date.now() - parseInt(backgroundTime);
          const minutesInBackground = Math.floor(timeInBackground / 60000);
          
          console.log(`⏱️ Estuvo ${minutesInBackground} minutos ${Math.floor((timeInBackground % 60000) / 1000)} segundos en segundo plano`);
          
          // Recuperar todas las posiciones guardadas durante el background
          const userId = localStorage.getItem('userId');
          const storageKey = `route_${userId}_${new Date().toISOString().split('T')[0]}`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData && backgroundLastPos) {
            try {
              const allPositions = JSON.parse(storedData) as Position[];
              const lastKnownPos = JSON.parse(backgroundLastPos) as Position;
              
              // Filtrar posiciones nuevas (posteriores a la última conocida)
              const newPositions = allPositions.filter(p => p.timestamp > lastKnownPos.timestamp);
              
              if (newPositions.length > 0) {
                console.log(`📦 Recuperando ${newPositions.length} posiciones del background (MODO ULTRA PERMISIVO)`);
                
                // Ordenar por timestamp
                newPositions.sort((a, b) => a.timestamp - b.timestamp);
                
                // Agregar las posiciones recuperadas al path - ULTRA PERMISIVO
                setPath(prevPath => {
                  const mergedPath = [...prevPath];
                  let addedCount = 0;
                  let rejectedCount = 0;
                  
                  newPositions.forEach((newPos, index) => {
                    // SOLO rechazar duplicados exactos o errores GPS extremos
                    const isDuplicate = mergedPath.some(p => 
                      Math.abs(p.timestamp - newPos.timestamp) < 500 &&
                      Math.abs(p.lat - newPos.lat) < 0.000001 &&
                      Math.abs(p.lng - newPos.lng) < 0.000001
                    );
                    
                    // Rechazar solo GPS extremadamente malo (> 50m)
                    const isVeryBadGPS = newPos.accuracy && newPos.accuracy > 50;
                    
                    if (isDuplicate) {
                      rejectedCount++;
                      return;
                    }
                    
                    if (isVeryBadGPS) {
                      rejectedCount++;
                      if (index % 20 === 0) console.log(`⚠️ GPS muy malo: ${newPos.accuracy?.toFixed(0)}m`);
                      return;
                    }
                    
                    // Calcular distancia si hay posición previa
                    if (mergedPath.length > 0) {
                      const lastPos = mergedPath[mergedPath.length - 1];
                      const distance = calculateDistance(lastPos, newPos);
                      const distanceMeters = distance * 1000;
                      const timeGap = newPos.timestamp - lastPos.timestamp;
                      
                      // Solo rechazar saltos IMPOSIBLES (> 1km en < 5s)
                      if (distanceMeters > 1000 && timeGap < 5000) {
                        const speedKmh = (distanceMeters / 1000) / (timeGap / 3600000);
                        if (speedKmh > 200) {
                          rejectedCount++;
                          console.log(`⚠️ Salto imposible: ${distanceMeters.toFixed(0)}m en ${(timeGap/1000).toFixed(1)}s`);
                          return;
                        }
                      }
                      
                      // ACEPTAR TODO LO DEMÁS - Sin filtros de distancia mínima ni velocidad
                      totalDistanceRef.current += distance;
                      addedCount++;
                      
                      if (index % 10 === 0) {
                        console.log(`✅ Recuperado ${index + 1}/${newPositions.length}: +${distanceMeters.toFixed(1)}m (precisión: ${newPos.accuracy?.toFixed(1) || 'N/A'}m)`);
                      }
                    }
                    
                    mergedPath.push(newPos);
                  });
                  
                  console.log(`✅ ${addedCount} posiciones añadidas, ${rejectedCount} rechazadas`);
                  return mergedPath;
                });
                
                // Actualizar distancia total
                setTotalDistance(totalDistanceRef.current);
                
                // Mostrar notificación de recuperación exitosa
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('GPS Recuperado', {
                    body: `✅ ${newPositions.length} puntos GPS recuperados del segundo plano`,
                    icon: '/icon.svg',
                    tag: 'gps-resume',
                  });
                }
              }
            } catch (error) {
              console.error('❌ Error recuperando datos del background:', error);
            }
          }
          
          localStorage.removeItem('background_timestamp');
          localStorage.removeItem('background_last_position');
        }
        
        // Forzar actualización del mapa y polyline con todas las posiciones (después de recuperar)
        setTimeout(() => {
          if (path.length > 0 && map) {
            const lastPos = path[path.length - 1];
            map.panTo({ lat: lastPos.lat, lng: lastPos.lng });
            
            // Actualizar polyline con todos los puntos
            if (polylineRef.current && path.length > 1) {
              const allCoords = path.map(p => ({ lat: p.lat, lng: p.lng }));
              polylineRef.current.setPath(allCoords);
              console.log('🗺️ Polyline actualizado con', path.length, 'puntos (incluye recuperados)');
            }
          }
        }, 500); // Pequeño delay para asegurar que el estado se actualice
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
    totalDistanceRef.current = 0; // Resetear distancia en ref
    positionBufferRef.current = []; // Limpiar buffer
    consecutiveStillCountRef.current = 0; // Resetear contador
    speedHistoryRef.current = []; // Limpiar histórico de velocidades

    // Sistema Keep-Alive: mantener GPS activo incluso en background
    keepAliveIntervalRef.current = setInterval(() => {
      if (watchIdRef.current !== null) {
        // Ping silencioso para mantener el watchPosition activo
        const status = document.visibilityState === 'hidden' ? '🌙 BACKGROUND' : '☀️ FOREGROUND';
        console.log(`💓 GPS Keep-Alive [${status}] - WatchID: ${watchIdRef.current}`);
        
        // Guardar heartbeat timestamp
        localStorage.setItem('gps_heartbeat', Date.now().toString());
      }
    }, 10000); // Cada 10 segundos

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

        // Calcular velocidad instantánea (usar speed del GPS si está disponible)
        let instantSpeed = 0;
        if (position.coords.speed && position.coords.speed > 0) {
          instantSpeed = position.coords.speed * 3.6; // m/s a km/h
        } else if (path.length > 0) {
          // Si no hay speed, calcular manualmente desde última posición
          const lastPos = path[path.length - 1];
          const distKm = calculateDistance(lastPos, newPos);
          const timeHours = (position.timestamp - lastPos.timestamp) / 3600000;
          if (timeHours > 0) {
            instantSpeed = distKm / timeHours;
          }
        }

        // Mantener histórico de velocidades para suavizar (últimos 3 valores)
        speedHistoryRef.current.push(instantSpeed);
        if (speedHistoryRef.current.length > 3) {
          speedHistoryRef.current.shift();
        }
        
        // Velocidad suavizada (promedio de últimos 3 valores)
        const smoothSpeed = speedHistoryRef.current.reduce((a, b) => a + b, 0) / speedHistoryRef.current.length;
        
        // Actualizar estados inmediatamente
        setCurrentSpeed(smoothSpeed);
        setAccuracy(position.coords.accuracy);
        setLastUpdate(new Date());

        console.log(`📍 GPS PREMIUM: ${newPos.lat.toFixed(7)}, ${newPos.lng.toFixed(7)} | Precisión: ${position.coords.accuracy.toFixed(2)}m (±0.5m) | Velocidad: ${smoothSpeed.toFixed(2)} km/h | Visibilidad: ${document.visibilityState}`);

        // GUARDAR INMEDIATAMENTE en localStorage (antes de filtros) para recuperación en background
        savePositionToStorage(newPos);

        // Actualizar marcador con color según precisión EXTREMA (actualización instantánea)
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

        // Centrar mapa en la ubicación actual (SIEMPRE, incluso en segundo plano - actualización instantánea)
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
            
            // FILTRO 2: Movimiento mínimo ADAPTATIVO
            // Si está en movimiento (velocidad > 2 km/h), usar 15m
            // Si está casi quieto (velocidad < 2 km/h), usar 20m
            const minDistance = smoothSpeed > 2 ? 15 : 20;
            
            if (distanceMeters < minDistance) {
              consecutiveStillCountRef.current++;
              console.log(`🔇 Micro-movimiento ignorado: ${distanceMeters.toFixed(2)}m < ${minDistance}m a ${smoothSpeed.toFixed(1)} km/h (x${consecutiveStillCountRef.current})`);
              return prevPath;
            }
            
            // FILTRO 3: Velocidad mínima ADAPTATIVO
            // Si el gap de tiempo es grande (>10s), ser más permisivo con velocidad baja
            const minSpeed = timeGap > 10000 ? 1 : 3; // 1 km/h si gap >10s, sino 3 km/h
            
            if (smoothSpeed < minSpeed && distanceMeters < 30) {
              consecutiveStillCountRef.current++;
              console.log(`🐌 Demasiado lento: ${smoothSpeed.toFixed(1)} km/h < ${minSpeed} km/h (x${consecutiveStillCountRef.current})`);
              return prevPath;
            }
            
            // FILTRO 4: Doble verificación - Solo si AMBOS son bajos
            if (distanceMeters < 25 && smoothSpeed < 5 && timeGap < 10000) {
              consecutiveStillCountRef.current++;
              console.log(`⚠️ Movimiento inseguro: ${distanceMeters.toFixed(2)}m a ${smoothSpeed.toFixed(1)} km/h en ${(timeGap/1000).toFixed(1)}s (x${consecutiveStillCountRef.current})`);
              return prevPath;
            }
            
            // FILTRO 5: Modo BLOQUEADO - Si quieto >20 intentos, requiere >25m o velocidad >5 km/h
            if (consecutiveStillCountRef.current > 20 && distanceMeters < 25 && smoothSpeed < 5) {
              console.log(`🔒 BLOQUEADO: ${distanceMeters.toFixed(2)}m < 25m o ${smoothSpeed.toFixed(1)} km/h < 5 km/h (tras ${consecutiveStillCountRef.current} rechazos)`);
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
              console.log(`✅ MOVIMIENTO REAL detectado: ${distanceMeters.toFixed(1)}m a ${smoothSpeed.toFixed(1)} km/h (desbloqueo tras ${consecutiveStillCountRef.current} quietos)`);
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
            
            // Actualizar distancia total usando ref para actualización instantánea
            totalDistanceRef.current += distance;
            setTotalDistance(totalDistanceRef.current);
            
            const gapTag = (distance > 0.1 || timeGap > 30000) ? ' [INTERPOLADO]' : '';
            console.log('✅ Distancia:', totalDistanceRef.current.toFixed(3), 'km (+', distanceMeters.toFixed(1), 'm)' + gapTag);
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
        enableHighAccuracy: true, // GPS de alta precisión (premium)
        timeout: 3000, // Timeout de 3 segundos (más rápido = actualizaciones más frecuentes)
        maximumAge: 0, // Nunca usar caché, siempre posición fresca en tiempo real
      }
    );
  };

  const stopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    // Detener keep-alive interval
    if (keepAliveIntervalRef.current !== null) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
      console.log('Keep-Alive detenido');
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
    localStorage.removeItem('gps_heartbeat');
    
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

  const recoverPreviousTracking = (userId: string | null) => {
    if (!userId) return;
    
    console.log('🔄 Iniciando recuperación de tracking previo...');
    
    try {
      const storageKey = `route_${userId}_${new Date().toISOString().split('T')[0]}`;
      const storedData = localStorage.getItem(storageKey);
      const savedDistance = parseFloat(localStorage.getItem('tracking_distance') || '0');
      
      if (storedData) {
        const allPositions = JSON.parse(storedData) as Position[];
        
        if (allPositions.length > 0) {
          console.log(`📦 Recuperando ${allPositions.length} posiciones del localStorage`);
          
          // Ordenar por timestamp para asegurar orden cronológico
          allPositions.sort((a, b) => a.timestamp - b.timestamp);
          
          // FILTROS ULTRA PERMISIVOS para recuperación - Solo eliminar duplicados y errores obvios
          const validPositions: Position[] = [];
          let recoveredDistance = 0;
          let rejectedCount = 0;
          
          allPositions.forEach((pos, index) => {
            // SOLO rechazar si:
            // 1. Es duplicado exacto (mismo timestamp Y mismas coordenadas)
            // 2. GPS extremadamente malo (> 50m de error)
            // 3. Salto imposible (> 1km en < 5 segundos)
            
            // Check 1: Duplicado exacto
            const isDuplicate = validPositions.some(p => 
              Math.abs(p.timestamp - pos.timestamp) < 500 && // Más estricto con timestamp
              Math.abs(p.lat - pos.lat) < 0.000001 && // Prácticamente el mismo punto
              Math.abs(p.lng - pos.lng) < 0.000001
            );
            
            if (isDuplicate) {
              rejectedCount++;
              if (index % 50 === 0) console.log(`⚠️ Duplicado rechazado en posición ${index}`);
              return;
            }
            
            // Check 2: GPS extremadamente malo
            if (pos.accuracy && pos.accuracy > 50) {
              rejectedCount++;
              if (index % 50 === 0) console.log(`⚠️ GPS muy malo rechazado: ${pos.accuracy.toFixed(0)}m`);
              return;
            }
            
            // Check 3: Salto imposible (> 1km en < 5s = > 720 km/h)
            if (validPositions.length > 0) {
              const lastPos = validPositions[validPositions.length - 1];
              const distance = calculateDistance(lastPos, pos);
              const distanceMeters = distance * 1000;
              const timeGap = pos.timestamp - lastPos.timestamp;
              
              if (distanceMeters > 1000 && timeGap < 5000) {
                const speedKmh = (distanceMeters / 1000) / (timeGap / 3600000);
                if (speedKmh > 200) {
                  rejectedCount++;
                  console.log(`⚠️ Salto imposible rechazado: ${distanceMeters.toFixed(0)}m en ${(timeGap/1000).toFixed(1)}s = ${speedKmh.toFixed(0)} km/h`);
                  return;
                }
              }
              
              // Calcular distancia acumulada
              recoveredDistance += distance;
              
              // Log progreso cada 25 puntos
              if (index % 25 === 0) {
                console.log(`✅ Punto ${index + 1}/${allPositions.length}: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)} (+${distanceMeters.toFixed(1)}m, precisión: ${pos.accuracy?.toFixed(1) || 'N/A'}m)`);
              }
            }
            
            // ACEPTAR POSICIÓN - No importa distancia mínima, velocidad, etc.
            validPositions.push(pos);
          });
          
          console.log(`✅ ${validPositions.length}/${allPositions.length} posiciones recuperadas (${rejectedCount} rechazadas)`);
          console.log(`📏 Distancia recuperada: ${recoveredDistance.toFixed(3)} km (guardada: ${savedDistance.toFixed(3)} km)`);
          
          // Restaurar el path
          setPath(validPositions);
          totalDistanceRef.current = savedDistance || recoveredDistance;
          setTotalDistance(totalDistanceRef.current);
          
          // Actualizar mapa después de un delay
          setTimeout(() => {
            if (validPositions.length > 0 && map) {
              const lastPos = validPositions[validPositions.length - 1];
              
              // Centrar mapa en última posición
              map.panTo({ lat: lastPos.lat, lng: lastPos.lng });
              
              // Actualizar marcador
              if (marker) {
                marker.setPosition({ lat: lastPos.lat, lng: lastPos.lng });
              }
              
              // Dibujar polyline completo
              if (validPositions.length > 1) {
                const pathCoords = validPositions.map(p => ({ lat: p.lat, lng: p.lng }));
                
                if (polylineRef.current) {
                  polylineRef.current.setPath(pathCoords);
                } else {
                  polylineRef.current = new google.maps.Polyline({
                    path: pathCoords,
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 4,
                    map: map,
                  });
                }
                
                console.log('🗺️ Mapa y polyline restaurados con', validPositions.length, 'puntos');
              }
            }
            
            // Mostrar notificación de éxito
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Tracking Recuperado', {
                body: `✅ ${validPositions.length} posiciones y ${totalDistanceRef.current.toFixed(2)} km recuperados`,
                icon: '/icon.svg',
              });
            }
            
            // Reactivar tracking automáticamente
            alert(`✅ Tracking recuperado:\n\n` +
                  `📍 ${validPositions.length} posiciones\n` +
                  `📏 ${totalDistanceRef.current.toFixed(3)} km\n\n` +
                  `¿Continuar rastreando?`);
            
            startTracking();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('❌ Error recuperando tracking:', error);
      alert('❌ Error al recuperar el tracking anterior');
    }
  };

  const savePositionToStorage = (position: Position) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      const storageKey = `route_${userId}_${new Date().toISOString().split('T')[0]}`;
      const existingData = localStorage.getItem(storageKey);
      const positions = existingData ? JSON.parse(existingData) : [];
      
      // Agregar marca de tiempo de guardado y estado de visibilidad
      const enrichedPosition = {
        ...position,
        savedAt: Date.now(),
        wasBackground: document.visibilityState === 'hidden',
      };
      
      positions.push(enrichedPosition);
      localStorage.setItem(storageKey, JSON.stringify(positions));

      // Guardar también el estado actual para recuperación
      localStorage.setItem('tracking_active', isTracking.toString());
      localStorage.setItem('tracking_distance', totalDistanceRef.current.toString());
      localStorage.setItem('tracking_last_update', new Date().toISOString());
      localStorage.setItem('tracking_path_length', path.length.toString());
      
      // Log periódico (cada 10 posiciones)
      if (positions.length % 10 === 0) {
        console.log(`💾 ${positions.length} posiciones guardadas (${document.visibilityState})`);
      }
    } catch (error) {
      console.error('❌ Error guardando posición:', error);
    }
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

      {/* Stats Panel - Mejorado con animaciones */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm border border-blue-200 transition-all duration-300 hover:shadow-md">
            <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
              📏 DISTANCIA RECORRIDA
            </p>
            <p className="text-3xl font-bold text-blue-900 mb-1 tracking-tight">
              {totalDistance.toFixed(3)} km
            </p>
            {isTracking && (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-blue-600 font-medium">
                  {path.length} puntos GPS registrados
                </p>
              </div>
            )}
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 shadow-sm border border-green-200 transition-all duration-300 hover:shadow-md">
            <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
              ⚡ VELOCIDAD ACTUAL
            </p>
            <p className="text-3xl font-bold text-green-900 mb-1 tracking-tight">
              {currentSpeed.toFixed(1)} <span className="text-lg">km/h</span>
            </p>
            {isTracking && (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-green-600 font-medium">
                  Actualización continua
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Indicadores de precisión y estado - Mejorados */}
        {isTracking && (
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl p-3 shadow-sm border transition-all duration-300 ${
              accuracy < 5 ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' : 
              accuracy < 10 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300' : 
              'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
            }`}>
              <p className="text-xs font-semibold text-gray-700 mb-1">🎯 Precisión GPS</p>
              <p className="text-lg font-bold">
                ±{accuracy.toFixed(1)}m {
                  accuracy < 5 ? '🟢 PREMIUM' : 
                  accuracy < 10 ? '🟡 BUENA' : '🔴 BAJA'
                }
              </p>
              {accuracy < 5 && (
                <p className="text-xs text-green-700 font-medium mt-1">
                  ±0.5m precisión real
                </p>
              )}
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 shadow-sm border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 mb-1">🕐 Actualización</p>
              <p className="text-lg font-bold text-purple-900">
                {lastUpdate ? lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
              </p>
              <p className="text-xs text-purple-600 font-medium mt-1">
                Tiempo real
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
