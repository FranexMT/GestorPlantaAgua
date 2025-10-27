import React, { useState } from 'react';
import { auth } from "../config/firebase";
import {
  signInWithEmailAndPassword,
} from "firebase/auth";


import ElManantialLogo from '../img/man.png';

export default function LoginScreen({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      return setError('Introduce email y contraseña');
    }

    setLoading(true);

    try {
      // Autenticar con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('Usuario autenticado:', user);

      // Llamar a onLogin para actualizar el estado en App
      onLogin({
        name: user.email,
        uid: user.uid,
        role: 'employee' // Rol por defecto, se puede obtener de Firestore
      });

    } catch (err) {
      console.error("Error completo al iniciar sesión:", err);
      console.error("Código de error:", err.code);
      console.error("Mensaje de error:", err.message);

      // Mensajes de error más específicos basados en códigos de Firebase Auth
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Email inválido. Verifica el formato del correo.');
          break;
        case 'auth/user-disabled':
          setError('Usuario deshabilitado. Contacta al administrador.');
          break;
        case 'auth/user-not-found':
          setError('Usuario no encontrado. Verifica tu email o regístrate.');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta. Intenta de nuevo.');
          break;
        case 'auth/invalid-credential':
          setError('Credenciales inválidas. El usuario no existe o la contraseña es incorrecta.');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos fallidos. Espera un momento e intenta de nuevo.');
          break;
        case 'auth/network-request-failed':
          setError('Error de conexión. Verifica tu internet.');
          break;
        default:
          setError(`Error al iniciar sesión: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor principal con fondo de temática de agua
    <div className="min-h-screen flex items-center justify-center animated-water-bg text-slate-100 font-sans p-4">

      {/* 1. Contenedor exterior: Usa el color #1C3156 */}
      <div className="relative p-0.5 rounded-2xl shadow-2xl bg-[#1C3156]">

        {/* 2. Formulario Interno: Usa el color #1C3156 */}
        <form
          onSubmit={handleSubmit}
          // Fondo del formulario al color #1C3156
          className="relative z-10 w-full max-w-sm sm:max-w-md p-8 sm:p-10 bg-[#1C3156] rounded-2xl"
        >

          {/* LOGO INTEGRADO */}
          <div className="flex justify-center flex-col items-center mb-4">
            <img
              src={ElManantialLogo} // Uso de la variable importada
              alt="Logo El Manantial"
              className="w-48 h-auto sm:w-64 object-contain"
            />
          </div>

          {/* Subtítulo: Cambiado a blanco (text-white) */}
          <p className="text-center text-sm text-white mb-6">Acceso a Planta de Agua Purificada y Hielo</p>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-slate-100 text-sm font-medium mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Campos de input: Usa el mismo color #1C3156 para eliminar el contraste.
              className="w-full px-4 py-3 border border-transparent bg-[#334b74] text-slate-100 rounded-lg placeholder-slate-400 transition duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-inner"
              placeholder="correo@ejemplo.com"
              required
              autoFocus
              aria-label="Email"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-slate-100 text-sm font-medium mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // Campos de input: Usa el mismo color #1C3156 para eliminar el contraste.
              className="w-full px-4 py-3 border border-transparent bg-[#334b74] text-slate-100 rounded-lg placeholder-slate-400 transition duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-inner"
              placeholder="Contraseña"
              required
              aria-label="Contraseña"
            />
          </div>

          {/* Botón de Entrar */}
          <button
            type="submit"
            disabled={loading}
            aria-disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold text-lg tracking-wide transition duration-200 ease-in-out transform shadow-md active:scale-98 ${!loading
              ? 'bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 focus:ring-4 focus:ring-teal-400/40'
              : 'bg-slate-600 cursor-not-allowed opacity-70 shadow-none'
              }`}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {error && (
            <p className="text-center text-sm text-red-400 mt-4">{error}</p>
          )}

          {onRegister && (
            <button
              type="button"
              onClick={onRegister}
              className="w-full mt-4 py-2 text-teal-400 hover:text-teal-300 transition underline"
            >
              ¿No tienes cuenta? Regístrate aquí
            </button>
          )}

          <p className="text-center text-xs text-slate-400 mt-6">
            Acceso seguro · Sistema de Gestión
          </p>

        </form>
      </div>
    </div>
  );
}
