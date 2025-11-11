import { enviarNotificacionOferta } from './emailServices';

const MS_IN_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Calcula la fecha del próximo miércoles a la hora especificada
 * @param {number} hour - Hora en formato 24h (0-23)
 * @param {number} minute - Minutos (0-59)
 * @param {number} second - Segundos (0-59)
 * @returns {Date} Fecha del próximo miércoles a la hora indicada
 */
const getNextWednesday = (hour = 9, minute = 0, second = 0) => {
  const now = new Date();
  const today = now.getDay(); // 0..6 (0 = domingo, 3 = miércoles)
  const target = new Date(now);
  const targetDay = 3; // miércoles
  let daysUntil = (targetDay - today + 7) % 7;
  
  target.setHours(hour, minute, second, 0);
  
  // Si hoy es miércoles pero ya pasó la hora, programar para la próxima semana
  if (daysUntil === 0 && now >= target) {
    daysUntil = 7;
  }
  
  target.setDate(now.getDate() + daysUntil);
  return target;
};

/**
 * Calcula la próxima ejecución para HOY (o mañana si ya pasó la hora)
 * @param {number} hour - Hora en formato 24h (0-23)
 * @param {number} minute - Minutos (0-59)
 * @param {number} second - Segundos (0-59)
 * @returns {Date} Fecha de la próxima ejecución
 */
const getNextRunToday = (hour = 9, minute = 0, second = 0) => {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, second, 0);
  
  // Si ya pasó la hora de hoy, programar para mañana
  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }
  
  return target;
};

/**
 * Inicializa el envío semanal de notificaciones de oferta cada miércoles
 * @param {Object} options - Configuración del scheduler
 * @param {number} options.hour - Hora del envío (0-23)
 * @param {number} options.minute - Minuto del envío (0-59)
 * @param {number} options.second - Segundo del envío (0-59)
 * @param {Object} options.templateData - Datos para la plantilla de email
 * @param {boolean} options.testMode - Si es true, programa para HOY a la hora indicada (para pruebas)
 * @returns {Function} Función de cleanup para cancelar el scheduler
 */
export const initWeeklyOfferNotification = (options = {}) => {
  const { hour = 9, minute = 0, second = 0, templateData = {}, testMode = false } = options;
  
  // En modo prueba, programar para hoy/mañana; en producción, para miércoles
  const firstRun = testMode 
    ? getNextRunToday(hour, minute, second)
    : getNextWednesday(hour, minute, second);
    
  const msUntilFirst = Math.max(firstRun - new Date(), 0);

  console.log(`📧 Notificación de oferta programada para: ${firstRun.toString()}`);
  console.log(`⏱️  Tiempo hasta el primer envío: ${Math.floor(msUntilFirst / 1000 / 60)} minutos (${Math.floor(msUntilFirst / 1000)} segundos)`);
  console.log(`🧪 Modo prueba: ${testMode ? 'SÍ (cualquier día)' : 'NO (solo miércoles)'}`);

  const send = () => {
    console.log('📬 Enviando notificación de oferta semanal...');
    enviarNotificacionOferta(templateData);
  };

  // Programar el primer envío
  const timeoutId = setTimeout(() => {
    send();
    // Después del primer envío, programar envíos semanales
    const intervalId = setInterval(send, MS_IN_WEEK);
    // Guardar el ID del intervalo para posible limpieza
    if (window._weeklyOffer) {
      window._weeklyOffer.intervalId = intervalId;
    }
  }, msUntilFirst);

  // Guardar los IDs para posible limpieza
  window._weeklyOffer = { timeoutId };

  // Retornar función de cleanup
  return () => {
    if (window._weeklyOffer?.timeoutId) {
      clearTimeout(window._weeklyOffer.timeoutId);
      console.log('🛑 Scheduler de ofertas cancelado (timeout)');
    }
    if (window._weeklyOffer?.intervalId) {
      clearInterval(window._weeklyOffer.intervalId);
      console.log('🛑 Scheduler de ofertas cancelado (interval)');
    }
  };
};
