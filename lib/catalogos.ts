export const DEPARTAMENTOS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare",
  "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Distrito Capital de Bogotá", "Guainía", "Guaviare",
  "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío",
  "Risaralda", "San Andrés, Providencia y Santa Catalina", "Santander", "Sucre", "Tolima", "Valle del Cauca",
  "Vaupés", "Vichada",
];

export const TIPOS_CONTRATO = [
  "Prestación de servicios", "Suministros", "Compraventa", "Obra", "Decreto 092 de 2017", "Consultoría",
  "Interventoría", "Seguros", "Arrendamiento de inmuebles", "Arrendamiento de muebles", "Servicios financieros", "Otro",
];

export const MODALIDADES = [
  "Contratación régimen especial", "Mínima cuantía", "Selección Abreviada de Menor Cuantía",
  "Selección abreviada subasta inversa", "Licitación pública", "Licitación pública Obra Publica",
  "Concurso de méritos abierto", "Contratación Directa (con ofertas)", "Contratación régimen especial (con ofertas)",
  "Solicitud de información a los Proveedores",
];

export const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export const PLANES = [
  {
    id: "basico", nombre: "Básico", mensual: 39000, anual: 390000,
    puntos: ["1 alerta personalizada", "Resumen diario a las 7:00 a.m.", "Filtros por departamento, tipo y monto", "Hasta 40 procesos por correo"],
  },
  {
    id: "pro", nombre: "Pro", mensual: 79000, anual: 790000, destacado: true,
    puntos: ["Hasta 5 alertas (una por línea de negocio)", "Palabras clave y exclusiones ilimitadas", "Filtro por municipio y modalidad", "Soporte prioritario por correo"],
  },
];
