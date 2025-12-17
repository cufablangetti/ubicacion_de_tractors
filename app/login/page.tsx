'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'driver';
  
  const [formData, setFormData] = useState({
    nombre: '',
    legajo: '',
    patente: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validaciones
    if (role === 'driver') {
      if (!formData.nombre.trim()) {
        setError('Por favor ingrese su nombre completo');
        setIsLoading(false);
        return;
      }
      if (!formData.legajo.trim()) {
        setError('Por favor ingrese su número de legajo');
        setIsLoading(false);
        return;
      }
      if (!formData.patente.trim()) {
        setError('Por favor ingrese la patente del vehículo');
        setIsLoading(false);
        return;
      }
    } else {
      if (!formData.nombre.trim()) {
        setError('Por favor ingrese su nombre de usuario');
        setIsLoading(false);
        return;
      }
    }

    // Simular carga para mejor UX
    await new Promise(resolve => setTimeout(resolve, 800));

    // Guardar en localStorage
    localStorage.setItem('userId', formData.legajo || formData.nombre);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', formData.nombre);
    
    if (role === 'driver' && formData.patente) {
      localStorage.setItem('vehiclePatente', formData.patente.toUpperCase());
    }

    // Redirigir
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/tracker');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4 relative overflow-hidden">
      {/* Efecto de fondo animado */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className={`relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-500 ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl mb-4 shadow-lg">
            {role === 'admin' ? (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
            {role === 'admin' ? 'Panel Administrativo' : 'Acceso Chofer'}
          </h1>
          <p className="text-gray-600 font-medium">DIBIAGI Transporte Internacional SA</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Sistema en línea
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div className="group">
            <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-2">
              {role === 'admin' ? '👤 Usuario Administrativo' : '👤 Nombre Completo'}
            </label>
            <input
              type="text"
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400"
              placeholder={role === 'admin' ? 'admin' : 'Ej: Juan Pérez'}
              autoComplete="name"
              disabled={isLoading}
            />
          </div>

          {/* Legajo (solo para choferes) */}
          {role === 'driver' && (
            <div className="group">
              <label htmlFor="legajo" className="block text-sm font-semibold text-gray-700 mb-2">
                🔢 Número de Legajo
              </label>
              <input
                type="text"
                id="legajo"
                value={formData.legajo}
                onChange={(e) => setFormData({ ...formData, legajo: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 uppercase group-hover:border-gray-400"
                placeholder="Ej: EMP001 o 12345"
                autoComplete="off"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Patente (solo para choferes) */}
          {role === 'driver' && (
            <div className="group">
              <label htmlFor="patente" className="block text-sm font-semibold text-gray-700 mb-2">
                🚛 Patente del Vehículo
              </label>
              <input
                type="text"
                id="patente"
                value={formData.patente}
                onChange={(e) => setFormData({ ...formData, patente: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 uppercase font-bold tracking-wider group-hover:border-gray-400"
                placeholder="ABC123 o AB123CD"
                maxLength={8}
                autoComplete="off"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Ingrese la patente del camión que conducirá
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando...
              </>
            ) : (
              <>
                Iniciar Sesión
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors duration-200"
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio
          </button>
        </div>

        {/* Info adicional */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Conexión segura y cifrada</span>
          </div>
        </div>
      </div>

      {/* Estilos para animaciones */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
