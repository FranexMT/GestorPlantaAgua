import { db } from '../config/firebase';
import {
  getDocs,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

const historialCollection = collection(db, "historial");

// Obtener todas las ventas
export const getHistorial = async () => {
  try {
    const data = await getDocs(historialCollection);
    const historialFormateadas = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    console.log('Historial obtenidas:', historialFormateadas);
    return historialFormateadas;
  } catch (err) {
    console.error('Error al obtener historial:', err);
    throw new Error('No se pudo cargar el historial. Intenta de nuevo.');
  }
};

//Aqui
export const createHistorial = async (historialData) => {
  try {
    const nuevoHistorial = {
      ...historialData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(historialCollection, nuevoHistorial);
    console.log('Historial creado con ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...historialData
    };
  } catch (err) {
    console.error('Error al crear historial:', err);
    throw new Error('No se pudo crear el historial. Intenta de nuevo.');
  }
};
// Eliminar un historial
export const deleteHistorial = async (historialId) => {
  try {
    const historialRef = doc(db, "historial", historialId);
    await deleteDoc(historialRef);
    console.log('Historial eliminado:', historialId);
    return historialId;
  } catch (err) {
    console.error('Error al eliminar historial:', err);
    throw new Error('No se pudo eliminar el historial. Intenta de nuevo.');
  }
};

// Actualizar un historial existente
export const updateHistorial = async (historialId, historialData) => {
  try {
    const historialRef = doc(db, "historial", historialId);
    const datosActualizados = {
      ...historialData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(historialRef, datosActualizados);
    console.log('Historial actualizado:', historialId);
    
    return {
      id: historialId,
      ...historialData
    };
  } catch (err) {
    console.error('Error al actualizar historial:', err);
    throw new Error('No se pudo actualizar el historial. Intenta de nuevo.');
  }

  
};

