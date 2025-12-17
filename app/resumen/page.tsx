'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Importar el escáner QR de forma dinámica para evitar SSR
const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), {
  ssr: false,
});

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
  const [scannerError, setScannerError] = useState<string>('');
  const [enviandoDatos, setEnviandoDatos] = useState(false);
  const [urlDestino, setUrlDestino] = useState<string>('');

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
    // Preparar datos antes de abrir el escáner
    if (!resumenData) return;

    const datos = {
      chofer: resumenData.chofer,
      patente: resumenData.patente || 'Sin patente',
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

    localStorage.setItem('datos_para_qr', JSON.stringify(datos));
    setScannerError('');
    setShowQRScanner(true);
  };

  const handleVolverATracker = () => {
    localStorage.removeItem('ultimo_viaje');
    router.push('/tracker');
  };

  const handleQRScanned = async (result: string) => {
    try {
      console.log('QR escaneado:', result);
      setUrlDestino(result);
      
      // Validar que sea una URL válida
      const url = new URL(result);
      
      // Obtener los datos preparados
      const datosStr = localStorage.getItem('datos_para_qr');
      if (!datosStr) {
        throw new Error('No hay datos para enviar');
      }

      const datos = JSON.parse(datosStr);
      
      // Mostrar confirmación antes de enviar
      const confirmar = confirm(
        `¿Enviar datos del viaje a:\n${url.hostname}\n\nDistancia: ${datos.distanciaTotal.toFixed(2)} km\nParadas: ${datos.paradas.length}\n\n¿Continuar?`
      );
      
      if (!confirmar) {
        setShowQRScanner(false);
        return;
      }

      setEnviandoDatos(true);

      // Enviar datos por POST al endpoint del QR
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const resultado = await response.json();
      
      setShowQRScanner(false);
      setEnviandoDatos(false);
      
      alert(`✅ Datos enviados exitosamente!\n\nRespuesta del servidor:\n${JSON.stringify(resultado, null, 2)}`);
      
      // Limpiar datos temporales
      localStorage.removeItem('datos_para_qr');
      
    } catch (error: any) {
      console.error('Error al enviar datos:', error);
      setEnviandoDatos(false);
      
      if (error.message.includes('URL')) {
        setScannerError('❌ El QR no contiene una URL válida');
      } else if (error.message.includes('fetch')) {
        setScannerError('❌ Error de conexión. Verifica tu internet.');
      } else {
        setScannerError(`❌ Error: ${error.message}`);
      }
    }
  };

  const handleScanError = (error: any) => {
    console.error('Error del escáner:', error);
    
    if (error.name === 'NotAllowedError') {
      setScannerError('❌ Permiso de cámara denegado. Por favor, permite el acceso a la cámara.');
    } else if (error.name === 'NotFoundError') {
      setScannerError('❌ No se encontró ninguna cámara en el dispositivo.');
    } else if (error.name === 'NotReadableError') {
      setScannerError('❌ La cámara está siendo usada por otra aplicación.');
    } else {
      setScannerError(`❌ Error: ${error.message || 'Error desconocido'}`);
    }
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
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm text-blue-200">
              👤 Chofer: {resumenData.chofer}
            </p>
            {resumenData.patente && (
              <p className="text-sm text-blue-200">
                🚛 Patente: {resumenData.patente}
              </p>
            )}
          </div>
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
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                👤 {resumenData.chofer}
              </span>
              {resumenData.patente && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                  🚛 {resumenData.patente}
                </span>
              )}
            </div>
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
            onClick={handleEscanearQR}
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
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
              <div className="flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center">
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
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Escanear Código QR
                </h3>
                <button
                  onClick={() => setShowQRScanner(false)}
                  className="text-white hover:text-gray-200 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Área del Escáner */}
            <div className="p-4">
              <div className="bg-gray-900 rounded-lg overflow-hidden mb-4 relative">
                {enviandoDatos ? (
                  <div className="aspect-video flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-lg font-semibold">Enviando datos...</p>
                      <p className="text-sm text-gray-300 mt-2">Por favor espera</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Scanner
                      onScan={(result) => {
                        if (result && result.length > 0) {
                          handleQRScanned(result[0].rawValue);
                        }
                      }}
                      onError={handleScanError}
                      constraints={{
                        facingMode: 'environment', // Usar cámara trasera en móviles
                      }}
                      components={{
                        torch: true, // Habilitar linterna si está disponible
                        finder: true,
                      }}
                      styles={{
                        container: {
                          width: '100%',
                          aspectRatio: '16/9',
                        },
                      }}
                    />
                    
                    {/* Overlay de guía */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="border-4 border-white rounded-lg w-48 h-48 shadow-lg animate-pulse"></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Instrucciones */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Instrucciones:</strong>
                    </p>
                    <ul className="text-xs text-blue-600 mt-1 list-disc list-inside">
                      <li>Coloca el QR dentro del recuadro blanco</li>
                      <li>Mantén la cámara estable y enfocada</li>
                      <li>El escaneo es automático</li>
                      <li>El QR debe contener la URL del servidor</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Errores */}
              {scannerError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{scannerError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* URL Detectada */}
              {urlDestino && (
                <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4">
                  <p className="text-xs text-green-700">
                    <strong>✅ URL detectada:</strong>
                  </p>
                  <p className="text-xs text-green-600 font-mono mt-1 break-all">
                    {urlDestino}
                  </p>
                </div>
              )}

              {/* Información adicional */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>📊 Datos a enviar:</strong>
                </p>
                <ul className="text-xs text-gray-500 mt-1 space-y-1">
                  <li>• Distancia total: {resumenData?.distanciaTotal.toFixed(2)} km</li>
                  <li>• Duración: {formatearDuracion(resumenData?.duracionTotal || 0)}</li>
                  <li>• Paradas detectadas: {paradas.length}</li>
                  <li>• Puntos GPS: {resumenData?.posiciones.length || 0}</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 p-4 border-t">
              <button
                onClick={() => {
                  setShowQRScanner(false);
                  setScannerError('');
                  setUrlDestino('');
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                disabled={enviandoDatos}
              >
                {enviandoDatos ? 'Enviando...' : 'Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
