// hooks/useProductos.js
import { useState, useEffect } from 'react';
import {
  getProducto,
  onSubmitProducto,
  updateProducto,
  deleteProducto
} from '../conexiones/crudInventario';

export const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleAddProducto = async (nuevoProducto) => {
    try {
      setError(null);
      await onSubmitProducto(nuevoProducto);
      await fetchProductos(); // Recargar la lista
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Cargar productos
  const fetchProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducto();
      setProductos(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // Eliminar producto (useProducto)
  const handleDeleteProducto = async (id) => {
    try {
      setError(null);
      await deleteProducto(id);
      setProductos(prev => prev.filter(prod => prod.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Actualizar producto
  const handleUpdateProducto = async (id, datosActualizados) => {
    try {
      setError(null);
      await updateProducto(id, datosActualizados);
      await fetchProductos(); // Recargar la lista
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

 

  return {
    productos,
    loading,
    error,
    addProducto: handleAddProducto,
    updateProducto: handleUpdateProducto,
    deleteProducto: handleDeleteProducto,
    refetchProductos: fetchProductos
  };
};
