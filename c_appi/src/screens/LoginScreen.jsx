import React, { useState } from 'react';
import { auth } from "../config/firebase";
import {
  signInWithEmailAndPassword,
} from "firebase/auth";

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
        role: 'employee' // Puedes obtener el rol de Firestore si lo almacenas ahí
      });
      
    } catch (err) {
      console.error("Error completo al iniciar sesión:", err);
      console.error("Código de error:", err.code);
      console.error("Mensaje de error:", err.message);
      
      // Mensajes de error más específicos
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
    // Fondo adaptado a la paleta "planta de agua": tonos azules y verdes suaves
    
    <div className="min-h-screen flex items-center justify-center animated-water-bg text-slate-100 font-sans p-4">
      {/* Contenedor Principal: borde de gradiente aqua -> azul profundo */}
      
      <div className="relative p-0.5 rounded-2xl shadow-2xl bg-linear-to-br from-teal-500/80 to-sky-700/80">

        {/* Formulario Interno: fondo oscuro neutro para resaltar los acentos azules/verde-agua */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 w-full max-w-sm sm:max-w-md p-8 sm:p-10 bg-slate-800 rounded-2xl"
        >

          {/* Título: gradiente inspirado en agua */}
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center tracking-tight bg-clip-text text-transparent bg-linear-to-r from-sky-300 to-teal-200">
            EL MANANTIAL
          </h2>

          {/* Subtítulo / descripción pequeña */}
          <p className="text-center text-sm text-slate-300 mb-6">Accede con tu identificador</p>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-700 bg-slate-700 text-slate-100 rounded-lg placeholder-slate-400 transition duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-inner"
              placeholder="correo@ejemplo.com"
              required
              autoFocus
              aria-label="Email"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-700 bg-slate-700 text-slate-100 rounded-lg placeholder-slate-400 transition duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-inner"
              placeholder="Contraseña"
              required
              aria-label="Contraseña"
            />
          </div>

          {/* Botón de Entrar: gradiente agua -> azul, alto contraste y accesible */}
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
            Acceso seguro · Planta de tratamiento
          </p>

        </form>
      </div>
    </div>
  );
}