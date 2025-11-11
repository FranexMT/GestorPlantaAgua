// import emailjs from '@emailjs/browser';
// import { toast } from 'react-toastify';

// // --- CONFIGURACIÓN DE EMAILJS (Reemplaza con tus datos) ---
// // Puedes encontrar estos valores en tu cuenta de EmailJS:
// // - SERVICE_ID: Email Services -> Tu servicio
// // - TEMPLATE_ID: Email Templates -> Tu plantilla
// // - PUBLIC_KEY: Account -> API Keys
// const SERVICE_ID = 'service_44cmup3';    // Ejemplo de tu Service ID
// const TEMPLATE_ID = 'template_88vz12l';  // Ejemplo de tu Template ID
// const PUBLIC_KEY = 'qJA17X9kRGbYpvWc9';    // Ejemplo de tu Public Key

// //dependencias: npm install @emailjs/browser
// /**
//  * Envía una notificación por correo sobre el stock bajo de un producto.
//  * @param {object} data - Los datos para la plantilla del correo.
//  *   - `nombre`: Nombre del producto.
//  *   - `stock`: El nivel de stock actual.
//  */
// export const enviarNotificacionStockBajo = async (data) => {
//   // --- CONFIGURACIÓN DE CORREOS ---
//   // Correo que RECIBIRÁ la notificación. ¡Reemplázalo por tu correo!
//   const CORREO_DESTINO = 'anuarmartinez0110@gmail.com';
//   // Nombre que aparecerá como REMITENTE del correo.
//   const NOMBRE_REMITENTE = 'Alertas de Planta de Agua';
//   // Correo para responder (Reply-To).
//   const CORREO_REMITENTE = 'soporte@miplanta.com';

//   const templateParams = {
//     ...data,
//     to_email: CORREO_DESTINO, // Quién recibe
//     from_name: NOMBRE_REMITENTE,               // Quién envía (nombre)
//     reply_to: CORREO_REMITENTE,                // A quién responder
//   };

//   try {
//     await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
//     console.log(`Correo de stock bajo para "${templateParams.nombre}" enviado a ${templateParams.to_email}.`);
//   } catch (error) {
//     console.error('Error al enviar el correo de notificación:', error);
//     toast.error('No se pudo enviar la notificación de stock bajo.', { position: "bottom-center" });
//   }
// };
import emailjs from '@emailjs/browser';
import { toast } from 'react-toastify';

/**
 * Archivo lista para usar: contiene funciones para enviar correos
 * - enviarNotificacionStockBajo(data)
 * - enviarNotificacionOferta(data)
 *
 * Reemplaza los valores de SERVICE_ID, TEMPLATE_ID_* y PUBLIC_KEY por los tuyos
 * o pásalos en data.templateId al llamar a la función.
 */

// Configura aquí tus ids (reemplaza por los reales)
const SERVICE_ID = 'service_44cmup3';
const TEMPLATE_ID_STOCK = 'template_88vz12l';   // plantilla por defecto para stock bajo
const TEMPLATE_ID_OFFER = 'template_f6ynkhr';   // plantilla por defecto para ofertas
const PUBLIC_KEY = 'qJA17X9kRGbYpvWc9';

/**
 * Envío genérico usando emailjs
 */
const sendEmail = async (templateId, templateParams) => {
  try {
    await emailjs.send(SERVICE_ID, templateId, templateParams, PUBLIC_KEY);
    return { ok: true };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { ok: false, error };
  }
};

/**
 * enviarNotificacionStockBajo({
 *   nombre, stock, to_email, from_name, reply_to, templateId, extra
 * })
 */
export const enviarNotificacionStockBajo = async (data = {}) => {
  const templateId = data.templateId || TEMPLATE_ID_STOCK;
  const params = {
    nombre: data.nombre || 'Producto',
    stock: data.stock ?? 'desconocido',
    to_email: data.to_email || 'anuarmartinez0110@gmail.com',
    from_name: data.from_name || 'Alertas - Planta de Agua',
    reply_to: data.reply_to || 'soporte@miplanta.com',
    ...data.extra
  };

  const res = await sendEmail(templateId, params);
  if (res.ok) {
    toast.success('Notificación de stock enviada.', { position: 'bottom-right' });
  } else {
    toast.error('No se pudo enviar notificación de stock.', { position: 'bottom-center' });
  }
  return res;
};

/**
 * enviarNotificacionOferta({
 *   subject, message, to_email, from_name, reply_to, templateId, extra
 * })
 */
export const enviarNotificacionOferta = async (data = {}) => {
  const templateId = data.templateId || TEMPLATE_ID_OFFER;
  const params = {
    subject: data.subject || '¡Hoy es día de oferta!',
    message: data.message || '¡Hoy es miércoles! Tenemos ofertas especiales.',
    to_email: data.to_email || 'anuarmartinez0110@gmail.com',
    from_name: data.from_name || 'Ofertas - Planta de Agua',
    reply_to: data.reply_to || 'soporte@miplanta.com',
    ...data.extra
  };

  const res = await sendEmail(templateId, params);
  if (res.ok) {
    toast.success('Notificación de oferta enviada.', { position: 'bottom-right' });
  } else {
    toast.error('No se pudo enviar notificación de oferta.', { position: 'bottom-center' });
  }
  return res;
};

/**
 * Ejemplo de uso:
 * import { enviarNotificacionOferta } from './Services/enviarNotificacionStockBajo';
 * enviarNotificacionOferta({ to_email: 'cliente@ejemplo.com', subject: 'Miércoles de Oferta', message: '50% hoy' });
 */