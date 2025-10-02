// hooks/useProductos.js
import { useState, useEffect } from 'react';


export const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  

  

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