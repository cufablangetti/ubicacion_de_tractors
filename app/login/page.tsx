'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'driver';
  
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación simple (en producción usar base de datos real)
    if (!formData.userId || !formData.password) {
      setError('Por favor complete todos los campos');
      return;
    }

    // Para demo: cualquier contraseña funciona
    // En producción: verificar contra base de datos
    localStorage.setItem('userId', formData.userId);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', formData.userId);

    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/tracker');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            {role === 'admin' ? 'Panel Administrativo' : 'Acceso Chofer'}
          </h1>
          <p className="text-gray-600">DIBIAGI Transporte Internacional SA</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              {role === 'admin' ? 'Usuario Administrativo' : 'ID de Chofer'}
            </label>
            <input
              type="text"
              id="userId"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={role === 'admin' ? 'admin' : 'Ej: CHOFER001'}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Volver al inicio
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <strong>Demo:</strong> Use cualquier usuario y contraseña para entrar
          </p>
        </div>
      </div>
    </div>
  );
}
