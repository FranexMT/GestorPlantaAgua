import { useState, useEffect } from 'react';
import {
  getVentas,
  //createVenta,
  //updateVenta,
  //deleteVenta
} from '../conexiones/ventas.js';

export const useVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar ventas desde Firebase
  const fetchVentas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVentas();
      setVentas(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  

  

  return {
    ventas,
    loading,
    error,
    //addVenta: handleAddVenta,
    //updateVenta: handleUpdateVenta,
    //deleteVenta: handleDeleteVenta,
    refetchVentas: fetchVentas
  };
};