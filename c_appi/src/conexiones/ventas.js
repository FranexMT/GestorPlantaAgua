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

const ventasCollection = collection(db, "ventas");

// Obtener todas las ventas
export const getVentas = async () => {
  try {
    const data = await getDocs(ventasCollection);
    const ventasFormateadas = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    console.log('Ventas obtenidas:', ventasFormateadas);
    return ventasFormateadas;
  } catch (err) {
    console.error('Error al obtener ventas:', err);
    throw new Error('No se pudieron cargar las ventas. Intenta de nuevo.');
  }
};

//Aqui
export const createVenta = async (ventaData) => {
  try {
    const nuevaVenta = {
      ...ventaData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(ventasCollection, nuevaVenta);
    console.log('Venta creada con ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...ventaData
    };
  } catch (err) {
    console.error('Error al crear venta:', err);
    throw new Error('No se pudo crear la venta. Intenta de nuevo.');
  }
};
// Eliminar una venta
export const deleteVenta = async (ventaId) => {
  try {
    const ventaRef = doc(db, "ventas", ventaId);
    await deleteDoc(ventaRef);
    console.log('Venta eliminada:', ventaId);
    return ventaId;
  } catch (err) {
    console.error('Error al eliminar venta:', err);
    throw new Error('No se pudo eliminar la venta. Intenta de nuevo.');
  }
};

// Actualizar una venta existente
export const updateVenta = async (ventaId, ventaData) => {
  try {
    const ventaRef = doc(db, "ventas", ventaId);
    const datosActualizados = {
      ...ventaData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(ventaRef, datosActualizados);
    console.log('Venta actualizada:', ventaId);
    
    return {
      id: ventaId,
      ...ventaData
    };
  } catch (err) {
    console.error('Error al actualizar venta:', err);
    throw new Error('No se pudo actualizar la venta. Intenta de nuevo.');
  }

  
};

