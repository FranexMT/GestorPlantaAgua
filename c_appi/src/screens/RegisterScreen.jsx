import React, { useState } from 'react';
import { auth } from "../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function RegisterScreen({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email.trim() || !password) {
      return setError('Introduce email y contraseña');
    }

    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('Usuario registrado exitosamente:', user);
      setSuccess(`Usuario ${email} creado exitosamente. Ahora puedes iniciar sesión.`);
      
      // Limpiar campos
      setEmail('');
      setPassword('');
      
    } catch (err) {
      console.error("Error al registrar:", err);
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Este email ya está registrado. Intenta iniciar sesión.');
          break;
        case 'auth/invalid-email':
          setError('Email inválido');
          break;
        case 'auth/weak-password':
          setError('Contraseña débil. Usa al menos 6 caracteres.');
          break;
        default:
          setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animated-water-bg text-slate-100 font-sans p-4">
      <div className="relative p-0.5 rounded-2xl shadow-2xl bg-linear-to-br from-teal-500/80 to-sky-700/80">
        <form
          onSubmit={handleRegister}
          className="relative z-10 w-full max-w-sm sm:max-w-md p-8 sm:p-10 bg-slate-800 rounded-2xl"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center tracking-tight bg-clip-text text-transparent bg-linear-to-r from-sky-300 to-teal-200">
            REGISTRO
          </h2>

          <p className="text-center text-sm text-slate-300 mb-6">Crea una nueva cuenta</p>

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
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold text-lg tracking-wide transition duration-200 ease-in-out transform shadow-md active:scale-98 ${!loading
                ? 'bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 focus:ring-4 focus:ring-teal-400/40'
                : 'bg-slate-600 cursor-not-allowed opacity-70 shadow-none'
              }`}
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </button>

          {error && (
            <p className="text-center text-sm text-red-400 mt-4 bg-red-900/20 p-3 rounded">{error}</p>
          )}

          {success && (
            <p className="text-center text-sm text-green-400 mt-4 bg-green-900/20 p-3 rounded">{success}</p>
          )}

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full mt-4 py-2 text-slate-400 hover:text-slate-200 transition"
            >
              ← Volver al login
            </button>
          )}

          <p className="text-center text-xs text-slate-400 mt-6">
            Los usuarios se crean en Firebase Authentication
          </p>
        </form>
      </div>
    </div>
  );
}
