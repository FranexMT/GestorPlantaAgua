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



// Agregar un nuevo producto
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


