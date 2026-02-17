<div align="center">
  <img src="./public/assets/gaviotylogo.png" alt="GAViOTY Logo" width="150"/>
  <h1><strong>Sistema de Gestión de Pedidos GAViOTY</strong></h1>
  <p>Una plataforma administrativa moderna, segura y eficiente para el control total de operaciones comerciales.</p>
</div>

---

## 📖 Descripción General

El **Sistema de Gestión de Pedidos GAViOTY** es una solución integral diseñada para optimizar los procesos de venta, producción e inventario. Construido con las tecnologías web más avanzadas, ofrece una interfaz intuitiva, un rendimiento excepcional y una seguridad robusta para que puedas centrarte en hacer crecer tu negocio.

---

## ✨ Características Principales

### 📊 Dashboard Inteligente
Visualización en tiempo real de métricas clave, gráficos de ventas y estados de pedidos para una toma de decisiones informada.

### 📦 Gestión de Pedidos (Órdenes)
Ciclo de vida completo de pedidos:
- Creación y edición intuitiva.
- Seguimiento de estados (Pendiente, En Proceso, Completado).
- Generación de documentos y comprobantes.

### 👥 CRM de Clientes
Base de datos centralizada de clientes con historial de compras, información de contacto y segmentación.

### 🛠️ Control de Materiales e Inventario
Gestión detallada de insumos y materiales necesarios para la producción:
- Control de stock.
- Categorización de materiales.
- Vinculación con procesos de fabricación.

### 🛍️ Catálogo de Productos
Administración dinámica de productos, incluyendo variantes, precios y descripciones detalladas.

### 💰 Módulo de Ventas y Finanzas
Análisis detallado de transacciones, reportes de ingresos y seguimiento de facturación para administradores.

---

## 🛠️ Stack Tecnológico

La aplicación utiliza un stack de vanguardia para garantizar escalabilidad y mantenibilidad:

- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router) - Server Components para máximo rendimiento.
- **Backend & Base de Datos:** [Supabase](https://supabase.io/) (PostgreSQL) - Gestión de datos en tiempo real.
- **Autenticación:** Google OAuth a través de Supabase Auth.
- **Estilo:** [Tailwind CSS V4](https://tailwindcss.com/) - Diseño responsivo y moderno.
- **Componentes UI:** [Shadcn/ui](https://ui.shadcn.com/) - Basado en Radix UI.
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) - Tipado estricto para reducir errores en producción.
- **Gráficos:** [Recharts](https://recharts.org/) - Visualización interactiva de datos.
- **Documentación:** [React-PDF](https://react-pdf.org/) - Generación de documentos en el lado del cliente.

---

## 🏗️ Arquitectura y Seguridad

### 🔐 Seguridad de Nivel Empresarial
- **Autenticación Exclusiva:** Acceso seguro mediante Google OAuth, eliminando la necesidad de gestionar contraseñas locales.
- **RLS (Row Level Security):** Protección de datos a nivel de base de datos en Supabase, garantizando que cada usuario solo acceda a lo que le corresponde.
- **Control de Acceso (RBAC):** Sistema de roles (Admin, Solicitante, etc.) que define el acceso a módulos específicos (ej. Ventas solo accesible para Admins).

### 🚀 Infraestructura
- **Middleware de Seguridad:** Verificación de sesión en cada petición hacia rutas protegidas (`/dashboard/*`).
- **Clientes Tipados:** Integración profunda con `DATABASE_TYPES` para garantizar integridad de datos en todo el flujo.

---


<div align="center">
  <p>Desarrollado con ❤️ para <strong>GAViOTY Solutions</strong></p>
</div>
