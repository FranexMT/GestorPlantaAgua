import { useState, useEffect } from 'react';
import {
  getVentas,
  createVenta,
  updateVenta,
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

  
const handleAddVenta = async (ventaData) => {
    try {
      setError(null);
      const nuevaVenta = await createVenta(ventaData);
      setVentas(prevVentas => [nuevaVenta, ...prevVentas]);
      return nuevaVenta;
    } catch (err) {
      setError(err.message);
      console.error('Error al agregar venta:', err);
      throw err;
    }
  };

  // Actualizar venta existente
  const handleUpdateVenta = async (ventaId, ventaData) => {
    try {
      setError(null);
      const ventaActualizada = await updateVenta(ventaId, ventaData);
      setVentas(prevVentas =>
        prevVentas.map(venta =>
          venta.id === ventaId ? { ...ventaActualizada, id: ventaId } : venta
        )
      );
      return ventaActualizada;
    } catch (err) {
      setError(err.message);
      console.error('Error al actualizar venta:', err);
      throw err;
    }
  };
  
  // Cargar ventas al montar el componente
  useEffect(() => {
    fetchVentas();
  }, []);

  return {
    ventas,
    loading,
    error,
    addVenta: handleAddVenta,
    updateVenta: handleUpdateVenta,
    //deleteVenta: handleDeleteVenta,
    refetchVentas: fetchVentas
  };
};