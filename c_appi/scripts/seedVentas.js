#!/usr/bin/env node
// Script para poblar Firestore con ventas pasadas (4 ventas/día durante 365 días)
// Ubicación: c_appi/scripts/seedVentas.js
// Uso: node c_appi/scripts/seedVentas.js

import { db } from '../src/config/firebase.js';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

const historialCollection = collection(db, 'historial');

const DAYS = 365;
const SALES_PER_DAY = 4;

// Inventario real de productos
const productos = [
  { productoId: 'C4fCJLcEZmNzrsqjz7ti', nombre: 'Barra de hielo', categoria: 'Hielo', precio: 30 },
  { productoId: 'M34xzUjAji1YlzRl0efa', nombre: 'Hielito de manzana', categoria: 'Hielito', precio: 10 },
  { productoId: 'OHqZVAN3cZ58pz6CKSZX', nombre: 'Agua', categoria: 'Hielo', precio: 50 },
  { productoId: 'aT3Dq8VTg9jbUgwkitnJ', nombre: 'Zuko de Fresa', categoria: 'Zuko', precio: 10 },
  { productoId: 'oTYlPdoCK5ACCvCOxKA1', nombre: 'Zuko de sandia', categoria: 'Zuko', precio: 7 },
  { productoId: 'tvv9C8sDe9V0CRAxIUNS', nombre: 'Zuko de Manzana', categoria: 'Zuko', precio: 12 },
  { productoId: 'umfRUNAjER2wsvhLhxaY', nombre: 'Hielito de mazapan', categoria: 'Hielito', precio: 22 },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sampleItems() {
  const count = randomInt(1, 4); // 1 a 4 productos por venta
  const items = [];
  const usedProducts = new Set();

  for (let i = 0; i < count; i++) {
    let producto;
    // Evitar productos duplicados en la misma venta
    do {
      producto = productos[randomInt(0, productos.length - 1)];
    } while (usedProducts.has(producto.productoId) && usedProducts.size < productos.length);
    
    usedProducts.add(producto.productoId);
    
    const cantidad = randomInt(1, 5);
    const subtotal = Number((producto.precio * cantidad).toFixed(2));
    
    items.push({
      productoId: producto.productoId,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad,
      subtotal
    });
  }
  
  return items;
}

function itemsTotal(items) {
  return Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateVentaId(timestamp) {
  return `VTA-${timestamp}`;
}

function generateCambio(total) {
  // Generar un monto recibido que sea mayor o igual al total
  // Simular billetes comunes mexicanos: 20, 50, 100, 200, 500
  const billetes = [20, 50, 100, 200, 500];
  
  // Encontrar el billete más cercano al total
  let billete = billetes.find(b => b >= total);
  
  // Si el total es mayor que 500, redondear al múltiplo de 100 más cercano
  if (!billete) {
    billete = Math.ceil(total / 100) * 100;
  }
  
  // 30% de probabilidad de dar cambio exacto
  if (Math.random() < 0.3) {
    return total;
  }
  
  // 20% de probabilidad de usar el siguiente billete mayor
  if (Math.random() < 0.2 && billete < 500) {
    const siguienteIndex = billetes.indexOf(billete) + 1;
    if (siguienteIndex < billetes.length) {
      billete = billetes[siguienteIndex];
    }
  }
  
  return billete;
}

(async () => {
  try {
    const now = new Date();
    let createdCount = 0;
    const totalVentas = DAYS * SALES_PER_DAY;

    console.log('Iniciando creacion de ventas historicas...');
    console.log(`Periodo: ${DAYS} dias`);
    console.log(`Ventas por dia: ${SALES_PER_DAY}`);
    console.log(`Total esperado: ${totalVentas} ventas`);
    console.log('');

    for (let dayOffset = 0; dayOffset < DAYS; dayOffset++) {
      const day = new Date(now);
      day.setDate(now.getDate() - dayOffset);
      day.setHours(0, 0, 0, 0);

      for (let s = 0; s < SALES_PER_DAY; s++) {
        // Distribuir ventas durante el día (8:00 - 20:00)
        // Picos de venta: mañana (9-11), mediodía (13-15), tarde (17-19)
        let hour;
        const rand = Math.random();
        if (rand < 0.4) {
          hour = randomInt(9, 11); // 40% en la mañana
        } else if (rand < 0.7) {
          hour = randomInt(13, 15); // 30% al mediodía
        } else if (rand < 0.95) {
          hour = randomInt(17, 19); // 25% en la tarde
        } else {
          hour = randomInt(8, 20); // 5% resto del día
        }
        
        const minute = randomInt(0, 59);
        const second = randomInt(0, 59);

        const date = new Date(day);
        date.setHours(hour, minute, second, 0);

        const items = sampleItems();
        const total = itemsTotal(items);
        const montoRecibido = generateCambio(total);
        const cambio = Number((montoRecibido - total).toFixed(2));
        
        const timestamp = date.getTime();
        const ventaId = generateVentaId(timestamp);

        const historial = {
          cambio,
          createdAt: Timestamp.fromDate(date),
          date: formatDate(date),
          id: ventaId,
          items,
          montoRecibido,
          origen: 'venta',
          status: 'Pagada',
          total,
          updatedAt: Timestamp.fromDate(date),
          ventaId: `${randomInt(100000, 999999)}${timestamp.toString().slice(-8)}`
        };

        await addDoc(historialCollection, historial);

        createdCount++;
        
        if (createdCount % 100 === 0) {
          console.log(`${createdCount}/${totalVentas} ventas creadas`);
        }
      }
    }

    console.log('');
    console.log('Proceso completado exitosamente');
    console.log(`Total de ventas creadas: ${createdCount}`);
    console.log(`Fecha inicial: ${formatDate(new Date(now.getTime() - DAYS * 24 * 60 * 60 * 1000))}`);
    console.log(`Fecha final: ${formatDate(now)}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error al poblar ventas:', err);
    console.error('Detalles del error:', err.message);
    process.exit(1);
  }
})();