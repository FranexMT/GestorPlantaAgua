import React, { useState, useEffect } from "react";
import InventoryScreen from './screens/InventoryScreen';
import SalesScreen from './screens/SalesScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from 'react-toastify';
import { auth } from './config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [activeScreen, setActiveScreen] = useState('inventory'); // 'inventory' o 'sales'
  const [user, setUser] = useState(null); // { name, role }
  const [loading, setLoading] = useState(true); // Estado de carga inicial
  const [showRegister, setShowRegister] = useState(false); // Mostrar pantalla de registro

  // Escuchar cambios en la autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado
        setUser({
          name: firebaseUser.email,
          uid: firebaseUser.uid,
          role: 'employee' // Puedes obtener el rol de Firestore
        });
      } else {
        // No hay usuario autenticado
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => unsubscribe();
  }, []);

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Mostrar un loader mientras se verifica la autenticación
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
      {user && (
        <nav className="bg-gray-900 shadow-md">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-center h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setActiveScreen('inventory')}
                  className={`relative inline-block p-px font-semibold leading-6 text-white border bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 hover:border-[#646cff]`}
                >
                  Inventario
                </button>
                <button
                  onClick={() => setActiveScreen('sales')}
                  className={`relative inline-block p-px font-semibold leading-6 text-white border bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 hover:border-[#646cff]`}
                >
                  Ventas
                </button>
                <div className="flex items-center space-x-4 ml-6">
                  <span className="text-sm text-gray-300">{user.name} ({user.role})</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 bg-red-600 rounded text-white hover:bg-red-700 transition"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Renderizado condicional de la pantalla activa */}
      <main>
        {!user ? (
          showRegister ? (
            <RegisterScreen onBack={() => setShowRegister(false)} />
          ) : (
            <LoginScreen 
              onLogin={(u) => { setUser(u); setActiveScreen('inventory'); }} 
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