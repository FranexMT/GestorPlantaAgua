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

  // Cargar productos (sin cambios)
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
  
  // Actualizar producto (Optimizado)
  const handleUpdateProducto = async (id, datosActualizados) => {
    try {
      setError(null);
      const productoActualizado = await updateProducto(id, datosActualizados);

      // ✨ Optimización: Actualizamos el estado localmente en lugar de volver a pedir toda la lista
      setProductos(prev => 
        prev.map(prod => (prod.id === id ? { ...prod, ...productoActualizado } : prod))
      );
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  // Agregar o actualizar producto (Lógica principal corregida)
  const handleAddProducto = async (nuevoProducto) => {
    try {
      setError(null);

      // 1. Lógica para buscar si el producto ya existe (por nombre, ignorando mayúsculas/minúsculas)
      const productoExistente = productos.find(
        (p) => p.nombre.trim().toLowerCase() === nuevoProducto.nombre.trim().toLowerCase()
      );

      if (productoExistente) {
        // --- Si el producto YA EXISTE, actualizamos su stock ---
        console.log("Producto existente encontrado. Actualizando stock...");
        const stockActualizado = productoExistente.stock + nuevoProducto.stock;
        
        // Llamamos a la función de actualizar con el nuevo stock
        return await handleUpdateProducto(productoExistente.id, { stock: stockActualizado });

      } else {
        // --- Si el producto NO EXISTE, lo creamos ---
        console.log("Producto nuevo. Creando...");
        
        // ¡Corrección importante! Llamamos a la función que crea el producto y luego
        // actualizamos el estado. Se elimina la validación que causaba el falso error.
        const productoAgregado = await onSubmitProducto(nuevoProducto);

        // Actualizamos el estado localmente para reflejar el cambio al instante
        setProductos(prev => [...prev, productoAgregado]);
        return { success: true };
      }
    } catch (err) {
      console.error('Error en handleAddProducto:', err);
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Eliminar producto (sin cambios)
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