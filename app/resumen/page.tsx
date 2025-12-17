'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
  accuracy?: number;
}

interface Parada {
  ubicacion: { lat: number; lng: number };
  inicio: Date;
  fin: Date;
  duracion: number; // en minutos
  direccion?: string;
}

export default function ResumenPage() {
  const router = useRouter();
  const [resumenData, setResumenData] = useState<any>(null);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    // Cargar datos del viaje desde localStorage
    const data = localStorage.getItem('ultimo_viaje');
    if (!data) {
      router.push('/tracker');
      return;
    }

    const viaje = JSON.parse(data);
    setResumenData(viaje);

    // Analizar paradas
    if (viaje.posiciones && viaje.posiciones.length > 0) {
      const paradasDetectadas = detectarParadas(viaje.posiciones, 5); // 5 minutos mínimo
      setParadas(paradasDetectadas);
    }
  }, [router]);

  const detectarParadas = (posiciones: Position[], minutosMinimos: number): Parada[] => {
    const paradas: Parada[] = [];
    const umbralDistancia = 0.05; // 50 metros en km
    const umbralTiempo = minutosMinimos * 60 * 1000; // Convertir a milisegundos

    let paradaActual: { inicio: Position; fin: Position } | null = null;

    for (let i = 1; i < posiciones.length; i++) {
      const pos1 = posiciones[i - 1];
      const pos2 = posiciones[i];
      const distancia = calcularDistancia(pos1, pos2);

      if (distancia < umbralDistancia) {
        // Posible parada
        if (!paradaActual) {
          paradaActual = { inicio: pos1, fin: pos2 };
        } else {
          paradaActual.fin = pos2;
        }
      } else {
        // Movimiento detectado
        if (paradaActual) {
          const duracion = paradaActual.fin.timestamp - paradaActual.inicio.timestamp;
          if (duracion >= umbralTiempo) {
            paradas.push({
              ubicacion: {
                lat: paradaActual.inicio.lat,
                lng: paradaActual.inicio.lng,
              },
              inicio: new Date(paradaActual.inicio.timestamp),
              fin: new Date(paradaActual.fin.timestamp),
              duracion: Math.round(duracion / 60000), // minutos
            });
          }
          paradaActual = null;
        }
      }
    }

    // Verificar última parada
    if (paradaActual) {
      const duracion = paradaActual.fin.timestamp - paradaActual.inicio.timestamp;
      if (duracion >= umbralTiempo) {
        paradas.push({
          ubicacion: {
            lat: paradaActual.inicio.lat,
            lng: paradaActual.inicio.lng,
          },
          inicio: new Date(paradaActual.inicio.timestamp),
          fin: new Date(paradaActual.fin.timestamp),
          duracion: Math.round(duracion / 60000),
        });
      }
    }

    return paradas;
  };

  const calcularDistancia = (pos1: Position, pos2: Position): number => {
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

  const formatearDuracion = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins} min`;
  };

  const handleEscanearQR = () => {
    setShowQRScanner(true);
  };

  const handleVolverATracker = () => {
    localStorage.removeItem('ultimo_viaje');
    router.push('/tracker');
  };

  const handleExportarDatos = () => {
    if (!resumenData) return;

    const datos = {
      chofer: resumenData.chofer,
      fecha: resumenData.fecha,
      horaInicio: resumenData.horaInicio,
      horaFin: resumenData.horaFin,
      distanciaTotal: resumenData.distanciaTotal,
      duracionTotal: resumenData.duracionTotal,
      velocidadPromedio: resumenData.velocidadPromedio,
      velocidadMaxima: resumenData.velocidadMaxima,
      paradas: paradas.map(p => ({
        latitud: p.ubicacion.lat,
        longitud: p.ubicacion.lng,
        inicio: p.inicio.toISOString(),
        fin: p.fin.toISOString(),
        duracion: p.duracion,
      })),
      ruta: resumenData.posiciones,
    };

    // Preparar para enviar al QR
    localStorage.setItem('datos_para_qr', JSON.stringify(datos));
    setShowQRScanner(true);
  };

  if (!resumenData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600 text-xl">Cargando resumen...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">📊 Resumen del Viaje</h1>
          <p className="text-sm text-blue-200">Chofer: {resumenData.chofer}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Tarjeta Principal */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              ✅ Viaje Finalizado
            </h2>
            <p className="text-sm text-gray-600">
              {new Date(resumenData.fecha).toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Estadísticas Principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-900">
                {resumenData.distanciaTotal.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Kilómetros</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-900">
                {formatearDuracion(resumenData.duracionTotal)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Duración</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-900">
                {resumenData.velocidadPromedio.toFixed(0)}
              </div>
              <div className="text-xs text-gray-600 mt-1">km/h Promedio</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-900">
                {resumenData.velocidadMaxima.toFixed(0)}
              </div>
              <div className="text-xs text-gray-600 mt-1">km/h Máxima</div>
            </div>
          </div>

          {/* Horarios */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Inicio</p>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(resumenData.horaInicio).toLocaleTimeString('es-AR')}
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Fin</p>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(resumenData.horaFin).toLocaleTimeString('es-AR')}
              </p>
            </div>
          </div>

          {/* Puntos Registrados */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Puntos GPS registrados:</span>{' '}
              {resumenData.posiciones.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Frecuencia promedio: ~{Math.round((resumenData.duracionTotal * 60) / resumenData.posiciones.length)} segundos
            </p>
          </div>
        </div>

        {/* Paradas Detectadas */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🚏</span>
            Paradas Detectadas
            <span className="ml-2 bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
              {paradas.length}
            </span>
          </h2>

          {paradas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                ✅ No se detectaron paradas prolongadas (más de 5 minutos)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paradas.map((parada, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">
                      Parada #{index + 1}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        parada.duracion < 15
                          ? 'bg-yellow-100 text-yellow-800'
                          : parada.duracion < 30
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {formatearDuracion(parada.duracion)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Inicio:</p>
                      <p className="font-semibold">
                        {parada.inicio.toLocaleTimeString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Fin:</p>
                      <p className="font-semibold">
                        {parada.fin.toLocaleTimeString('es-AR')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600">Ubicación:</p>
                    <p className="text-xs font-mono text-gray-800">
                      {parada.ubicacion.lat.toFixed(6)}, {parada.ubicacion.lng.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${parada.ubicacion.lat},${parada.ubicacion.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                    >
                      Ver en Google Maps →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-700">
              <strong>ℹ️ Criterio de parada:</strong> Se considera parada cuando el vehículo
              permanece en un radio de 50 metros durante más de 5 minutos consecutivos.
            </p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-4">
          {/* Botón de Escanear QR */}
          <button
            onClick={handleExportarDatos}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center justify-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              Escanear QR para Enviar Datos
            </div>
            <p className="text-xs mt-1 opacity-90">
              Registrar en sistema de campo
            </p>
          </button>

          {/* Botón de Nuevo Viaje */}
          <button
            onClick={handleVolverATracker}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition"
          >
            <div className="flex items-center justify-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Iniciar Nuevo Viaje
            </div>
          </button>
        </div>
      </div>

      {/* Modal de Escáner QR */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">📷 Escanear Código QR</h3>
            
            <div className="bg-gray-100 rounded-lg p-8 mb-4 text-center">
              <p className="text-gray-600 mb-4">
                Apunta la cámara al código QR del registro de campo
              </p>
              
              {/* Aquí iría el componente de escáner QR real */}
              <div className="bg-white border-4 border-dashed border-gray-300 rounded-lg p-12">
                <svg
                  className="w-24 h-24 mx-auto text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                <p className="text-sm text-gray-500 mt-2">
                  Escáner QR (en desarrollo)
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-700">
                <strong>ℹ️ Próximamente:</strong> Esta funcionalidad permitirá enviar
                los datos del viaje directamente al sistema de registro de campo mediante QR.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowQRScanner(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert('Datos preparados para enviar. En producción, esto enviará la información al sistema de campo.');
                  setShowQRScanner(false);
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                Enviar Datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
