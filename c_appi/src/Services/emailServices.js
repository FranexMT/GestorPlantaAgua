import emailjs from '@emailjs/browser';
import { toast } from 'react-toastify';

// --- CONFIGURACIÓN DE EMAILJS (Reemplaza con tus datos) ---
// Puedes encontrar estos valores en tu cuenta de EmailJS:
// - SERVICE_ID: Email Services -> Tu servicio
// - TEMPLATE_ID: Email Templates -> Tu plantilla
// - PUBLIC_KEY: Account -> API Keys
const SERVICE_ID = 'service_44cmup3';    // Ejemplo de tu Service ID
const TEMPLATE_ID = 'template_88vz12l';  // Ejemplo de tu Template ID
const PUBLIC_KEY = 'qJA17X9kRGbYpvWc9';    // Ejemplo de tu Public Key

//dependencias: npm install @emailjs/browser
/**
 * Envía una notificación por correo sobre el stock bajo de un producto.
 * @param {object} data - Los datos para la plantilla del correo.
 *   - `nombre`: Nombre del producto.
 *   - `stock`: El nivel de stock actual.
 */
export const enviarNotificacionStockBajo = async (data) => {
  // --- CONFIGURACIÓN DE CORREOS ---
  // Correo que RECIBIRÁ la notificación. ¡Reemplázalo por tu correo!
  const CORREO_DESTINO = 'anuarmartinez0110@gmail.com';
  // Nombre que aparecerá como REMITENTE del correo.
  const NOMBRE_REMITENTE = 'Alertas de Planta de Agua';
  // Correo para responder (Reply-To).
  const CORREO_REMITENTE = 'soporte@miplanta.com';

  const templateParams = {
    ...data,
    to_email: CORREO_DESTINO, // Quién recibe
    from_name: NOMBRE_REMITENTE,               // Quién envía (nombre)
    reply_to: CORREO_REMITENTE,                // A quién responder
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log(`Correo de stock bajo para "${templateParams.nombre}" enviado a ${templateParams.to_email}.`);
  } catch (error) {
    console.error('Error al enviar el correo de notificación:', error);
    toast.error('No se pudo enviar la notificación de stock bajo.', { position: "bottom-center" });
  }
};
