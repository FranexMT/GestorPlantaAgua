// Lista simple de correos con rol administrador.
// Edita este arreglo para añadir o quitar administradores.
export const ADMIN_EMAILS = [
  'admin@example.com'
];

export function isAdmin(email) {
  const e = (email || '').toLowerCase().trim();
  // Admin si el correo está listado explícitamente o si comienza con 'admin'
  return e.startsWith('admin') || ADMIN_EMAILS.includes(e);
}
