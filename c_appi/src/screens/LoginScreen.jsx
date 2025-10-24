import React, { useState } from 'react';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const role = 'employee'; // Rol fijo para la base de datos

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) return setError('Introduce email y contraseña');
    // Local login (no Firebase): accept the credentials locally for testing
    setLoading(true)
    try {
      const uid = 'local-' + Date.now()
      onLogin({ name: email.trim(), uid, role })
    } catch (err) {
      console.error('Local login error', err)
      setError('Error iniciando sesión')
    } finally {
      setLoading(false)
    }
  }

  // Firebase/Firestore integration removed from this component.
  // If you need to fetch a profile from Firestore, re-add the helper here.

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
                Usuario
            </label>
            <input
              id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-700 bg-slate-700 text-slate-100 rounded-lg placeholder-slate-400 transition duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-inner"
                placeholder="usuario"
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
            className={`w-full py-3 rounded-lg text-white font-semibold text-lg tracking-wide transition duration-200 ease-in-out transform shadow-md active:scale-98 ${
              !loading
                ? 'bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 focus:ring-4 focus:ring-teal-400/40'
                : 'bg-slate-600 cursor-not-allowed opacity-70 shadow-none'
            }`}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {error && (
            <p className="text-center text-sm text-red-400 mt-4">{error}</p>
          )}

          <p className="text-center text-xs text-slate-400 mt-6">
              Acceso seguro · Planta de tratamiento
          </p>

        </form>
      </div>
    </div>
  );
}