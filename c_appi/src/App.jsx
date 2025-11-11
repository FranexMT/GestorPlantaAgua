import React, { useState, useEffect } from "react";
import InventoryScreen from './screens/InventoryScreen';
import SalesScreen from './screens/SalesScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from 'react-toastify';
import { auth } from './config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { isAdmin } from './config/roles';
import { User, UserCog } from "lucide-react"; // 👈 íconos para empleado y admin
import { initWeeklyOfferNotification } from './Services/scheduler';
import { enviarNotificacionOferta } from './Services/emailServices';

function App() {
   const [activeScreen, setActiveScreen] = useState('sales'); // 'inventory' o 'sales' (por defecto ventas)
  const [user, setUser] = useState(null); // { name, role }
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  // Escuchar cambios en la autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const role = isAdmin(firebaseUser.email) ? 'admin' : 'employee';
       setUser({ name: firebaseUser.email, uid: firebaseUser.uid, role });
        // Redirigir automáticamente según rol al cargar sesión
        setActiveScreen(role === 'admin' ? 'inventory' : 'sales');
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Inicializar scheduler de notificaciones de oferta (miércoles 7:00 AM)
  useEffect(() => {
    const cleanup = initWeeklyOfferNotification({
      hour: 7,        // 🕐 Cambia la hora aquí (0-23)
      minute: 0,      // 🕐 Cambia los minutos aquí (0-59)
      second: 0,      // 🕐 Cambia los segundos aquí (0-59)
      testMode: false, // ⚙️ false = solo miércoles | true = cualquier día (pruebas)
      templateData: {
        subject: 'Miércoles de Oferta - Mi Planta',
        message: '¡Hoy es miércoles! Ven por nuestras ofertas especiales en garrafones, hielo y más.',
        to_email: 'anuarmartinez0110@gmail.com',
        from_name: 'Mi Planta - Ofertas',
        reply_to: 'soporte@miplanta.com'
      }
    });
    return () => cleanup && cleanup();
  }, []);

  // Cerrar sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // 🧪 FUNCIÓN DE PRUEBA - Enviar notificación de oferta ahora mismo
  const handleTestNotification = async () => {
    console.log('🧪 Enviando notificación de prueba...');
    await enviarNotificacionOferta({
      subject: '🧪 PRUEBA MANUAL - Miércoles de Oferta',
      message: 'Esta es una prueba manual del sistema de notificaciones de oferta.',
      to_email: 'anuarmartinez0110@gmail.com',
      from_name: 'Mi Planta - Ofertas',
      reply_to: 'soporte@miplanta.com'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark-blue"
        toastClassName="custom-toast"
      />

      {/* NAVBAR */}
      {user && (
        <nav className="bg-gray-900 shadow-md">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-center h-16">
              {/* <div className="flex items-center space-x-4">
                <button
                  onClick={() => setActiveScreen('inventory')}
                  className="relative inline-block p-px font-semibold leading-6 text-white border bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 hover:border-[#646cff]"
                >
                  Inventario
                </button>
                <button
                  onClick={() => setActiveScreen('sales')}
                  className="relative inline-block p-px font-semibold leading-6 text-white border bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 hover:border-[#646cff]"
                >
                  Ventas
                </button> */}
                 <div className="flex items-center space-x-4">
                  {/* Mostrar Inventario solo a admin */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setActiveScreen('inventory')}
                      className="relative inline-block p-px font-semibold leading-6 text-white border bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 hover:border-[#646cff]"
                    >
                      Inventario
                    </button>
                  )}
                  <button
                    onClick={() => setActiveScreen('sales')}
                    className="relative inline-block p-px font-semibold leading-6 text-white border bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 hover:border-[#646cff]"
                  >
                    Ventas
                  </button>
                </div>


                {/* Usuario e ícono */}
                <div className="flex items-center space-x-4 ml-6">
                  {/* 🧪 BOTÓN DE PRUEBA - Eliminar después de probar */}
                  <button
                    onClick={handleTestNotification}
                    className="px-3 py-1 bg-green-600 rounded text-white hover:bg-green-700 transition text-xs"
                    title="Prueba de notificación de oferta"
                  >
                    🧪 Test Email
                  </button>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    {user.role === 'admin' ? (
                      // Ícono de admin con corbata
                      <div className="flex items-center gap-1">
                        <UserCog className="w-7 h-7 text-blue-400" />
                        <span className="text-blue-300 font-semibold">Administrador</span>
                      </div>
                    ) : (
                      // Ícono de empleado sin corbata
                      <div className="flex items-center gap-1">
                        <User className="w-7 h-7 text-gray-300" />
                        <span className="text-gray-300 font-semibold">Empleado</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 bg-red-600 rounded text-white hover:bg-red-700 transition"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
        </nav>
      )}

      {/* Contenido principal */}
      <main>
        {!user ? (
          showRegister ? (
            <RegisterScreen onBack={() => setShowRegister(false)} />
          ) : (
            // <LoginScreen
            //   onLogin={(u) => {
            //     setUser(u);
            //     setActiveScreen('inventory');
            //   }}
            //   onRegister={() => setShowRegister(true)}
            // />
            <LoginScreen
              onLogin={(u) => {
                setUser(u);
                // Después del login, admin -> Inventario, empleado -> Ventas
                setActiveScreen(u.role === 'admin' ? 'inventory' : 'sales');
              }}
              onRegister={() => setShowRegister(true)}
            />
          )
        ) : (
          <>
            {activeScreen === 'inventory' && <InventoryScreen user={user} />}
            {activeScreen === 'sales' && <SalesScreen user={user} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
