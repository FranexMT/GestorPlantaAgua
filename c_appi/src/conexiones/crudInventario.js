import { db } from '../config/firebase';
import {
  getDocs,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';

const productosCollection = collection(db, "productos");

// Obtener todos los productos (crudInventario)
export const getProducto = async () => {
  try {
    const data = await getDocs(productosCollection);
    const dataFilter = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    console.log('Productos obtenidos:', dataFilter);
    return dataFilter; // Retornar los datos
  } catch (err) {
    console.error('Error al obtener productos:', err);
    throw err;
  }
};

// Eliminar un producto (crudInventario)
export const deleteProducto = async (id) => {
  try {
    const productoDoc = doc(db, "productos", id);
    await deleteDoc(productoDoc);
    console.log('Producto eliminado correctamente:', id);
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    throw err;
  }
};

export const onSubmitProducto = async (producto = null) => {
  try {
    // Si no se proporciona producto, usar valores por defecto
    const nuevoProducto = producto || {
      nombre: 'bolsa de hielo',
      categoría: 'hielo',
      precio: 20,
      stock: 100,
    };
    
    const docRef = await addDoc(productosCollection, nuevoProducto);
    console.log('Producto agregado con ID:', docRef.id);
    return { id: docRef.id, ...nuevoProducto };
  } catch (err) {
    console.error('Error al agregar producto:', err);
    throw err;
  }
};

// Actualizar un producto existente (crudInventario)
export const updateProducto = async (id, datosActualizados = null) => {
    try {
      const productoDoc = doc(db, "productos", id);
      
      // Si no se proporcionan datos, usar valores por defecto
      const datos = datosActualizados || { 
        nombre: "hielito de cacahuete" 
      };
      
      await updateDoc(productoDoc, datos);
      console.log('Producto actualizado correctamente:', id);
      return { id, ...datos };
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      throw err;
    }
  };
