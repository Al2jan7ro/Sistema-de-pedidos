import { redirect } from 'next/navigation';

// Este es un Server Component.
// La función principal de la página raíz es mandar al usuario a la página de inicio.
// El middleware gestionará si debe ir a /login o a /dashboard.
export default function HomePage() {
  // Redirigimos siempre a la ruta de entrada del sistema.
  // El middleware se encargará de determinar si el usuario debe ir a /login o a /dashboard.
  redirect('/dashboard');
}
