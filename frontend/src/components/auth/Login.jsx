import React, { useState } from 'react';
import {
  LogIn,
  User,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  Mail
} from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [modo, setModo] = useState('login');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (modo === 'login') {
      if (!formData.email || !formData.password) {
        setError('Por favor completa todos los campos');
        return;
      }
    } else {
      if (!formData.nombre || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Por favor completa todos los campos');
        return;
      }

      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }

    try {
      setLoading(true);

      const endpoint =
        modo === 'login'
          ? 'http://localhost:5000/api/auth/login'
          : 'http://localhost:5000/api/auth/registro-publico';

      const body =
        modo === 'login'
          ? { email: formData.email, password: formData.password }
          : { nombre: formData.nombre, email: formData.email, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error de autenticación');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      onLoginSuccess(data.usuario, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError('');
    setFormData({
      nombre: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">

      {/* ================= IZQUIERDA ================= */}
      <div className="hidden lg:flex flex-col justify-center px-20 bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-700 text-white">
        <h1 className="text-5xl font-extrabold mb-6">
          ZBNT
        </h1>
        <p className="text-xl opacity-90 max-w-md">
          Plataforma integral para la gestión de ventas, proveedores,
          inventario y usuarios.
        </p>

        <ul className="mt-10 space-y-3 text-sm opacity-90">
          <li>✔ Autenticación segura con JWT</li>
          <li>✔ Control de proveedores</li>
          <li>✔ Roles y permisos</li>
          <li>✔ Gestión de inventario</li>
        </ul>
      </div>

      {/* ================= DERECHA ================= */}
      <div className="flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-3xl shadow-2xl px-8 py-10">

            {/* HEADER */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg mb-4">
                <User size={28} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {modo === 'login' ? 'Bienvenido' : 'Crear cuenta'}
              </h2>
              <p className="text-sm text-gray-500">
                Accede a tu sistema de gestión
              </p>
            </div>

            {/* TABS */}
            <div className="flex bg-gray-100 rounded-xl overflow-hidden mb-6">
              <button
                onClick={() => cambiarModo('login')}
                className={`flex-1 py-3 font-semibold transition ${
                  modo === 'login'
                    ? 'bg-white shadow text-indigo-600'
                    : 'text-gray-500 hover:text-indigo-600'
                }`}
              >
                <LogIn className="inline mr-1" size={18} />
                Login
              </button>
              <button
                onClick={() => cambiarModo('registro')}
                className={`flex-1 py-3 font-semibold transition ${
                  modo === 'registro'
                    ? 'bg-white shadow text-indigo-600'
                    : 'text-gray-500 hover:text-indigo-600'
                }`}
              >
                <UserPlus className="inline mr-1" size={18} />
                Registro
              </button>
            </div>

            {/* ERROR */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* FORM */}
            <div className="space-y-4">

              {modo === 'registro' && (
                <input
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nombre completo"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              )}

              <input
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="Correo electrónico"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              {/* PASSWORD */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 pr-12"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {modo === 'registro' && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 pr-12"
                    placeholder="Confirmar contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition shadow-lg"
              >
                {loading
                  ? 'Procesando...'
                  : modo === 'login'
                  ? 'Iniciar sesión'
                  : 'Registrarse'}
              </button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-6">
              Seguridad y autenticación JWT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
