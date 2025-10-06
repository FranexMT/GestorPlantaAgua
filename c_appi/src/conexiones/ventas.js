import { db } from '../config/firebase';
import {
  getDocs,
  collection,
  //addDoc,
  //deleteDoc,
  //updateDoc,
  //doc,
  //serverTimestamp
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


