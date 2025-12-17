'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '@googlemaps/js-api-loader';

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
}

export default function TrackerPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [path, setPath] = useState<Position[]>([]);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [userName, setUserName] = useState('');
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');

    if (!userId || userRole !== 'driver') {
      router.push('/login?role=driver');
      return;
    }

    setUserName(name || userId);
    initializeMap();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [router]);

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

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Tu dispositivo no soporta geolocalización');
      return;
    }

    setIsTracking(true);
    setPath([]);
    setTotalDistance(0);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: Position = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed || 0,
        };

        setCurrentSpeed(position.coords.speed ? position.coords.speed * 3.6 : 0); // Convertir m/s a km/h

        // Actualizar marcador
        if (marker) {
          marker.setPosition({ lat: newPos.lat, lng: newPos.lng });
        }

        // Actualizar mapa para seguir la ubicación
        if (map) {
          map.panTo({ lat: newPos.lat, lng: newPos.lng });
        }

        // Actualizar ruta
        setPath((prevPath) => {
          const updatedPath = [...prevPath, newPos];

          // Calcular distancia
          if (prevPath.length > 0) {
            const lastPos = prevPath[prevPath.length - 1];
            const distance = calculateDistance(lastPos, newPos);
            setTotalDistance((prev) => prev + distance);
          }

          // Actualizar polyline
          if (map && updatedPath.length > 1) {
            if (polyline) {
              polyline.setPath(updatedPath.map(p => ({ lat: p.lat, lng: p.lng })));
            } else {
              const newPolyline = new google.maps.Polyline({
                path: updatedPath.map(p => ({ lat: p.lat, lng: p.lng })),
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 4,
                map: map,
              });
              setPolyline(newPolyline);
            }
          }

          // Guardar en localStorage para persistencia
          savePositionToStorage(newPos);

          return updatedPath;
        });
      },
      (error) => {
        console.error('Error de seguimiento:', error);
        alert('Error al rastrear ubicación: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
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
          <div>
            <h1 className="text-xl font-bold">DIBIAGI GPS</h1>
            <p className="text-sm text-blue-200">Chofer: {userName}</p>
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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Distancia Total</p>
            <p className="text-2xl font-bold text-blue-900">
              {totalDistance.toFixed(2)} km
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Velocidad Actual</p>
            <p className="text-2xl font-bold text-green-900">
              {currentSpeed.toFixed(0)} km/h
            </p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Control Panel */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        {!isTracking ? (
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
        ) : (
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
        )}
      </div>
    </div>
  );
}
