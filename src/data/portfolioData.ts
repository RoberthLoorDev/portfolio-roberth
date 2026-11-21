// Knowledge base for the portfolio chat. This is the ONLY place the chat reads from.
//
// After editing, run `npm run embed` (the build fails if you forget).
//
// Guidelines:
// - Spanish, third person ("Roberth..."), plain text (no Markdown): the model quotes it.
// - One topic per chunk, ~400-900 characters. Small chunks keep answers precise and the
//   prompt short (Groq's free tier allows only 8K tokens per minute).
// - Dates, titles and contact data must match the site (src/sections/*.astro and
//   src/i18n/translations.ts). The project pages (src/content/projects/*.md) hold the detail.
import type { KnowledgeChunk } from '../lib/chunkText'

export const portfolioData: KnowledgeChunk[] = [
     {
          category: 'summary',
          title: 'Perfil profesional',
          content: `Roberth Loor es Ingeniero en Tecnologías de la Información, de Manta, Ecuador, enfocado en desarrollo de software y soluciones tecnológicas de alto rendimiento. Trabaja en frontend, backend, aplicaciones móviles e IoT, con React, Angular, Vue.js, Astro, Node.js y React Native. Desde diciembre 2025 es Software & Mobile Developer en Jakay, una empresa fintech de Ambato, y forma parte de su Comité de Desarrollo Estratégico. Antes trabajó en Vagadamia (plataforma ERP), como freelance en Upwork y Fiverr, y en la Empresa Pública de Agua Potable de Manta (EPAM). Habla español nativo e inglés profesional. Quiere seguir creciendo en frontend y backend con React y Node y hacer contribuciones significativas al desarrollo web. Está disponible para nuevos proyectos y oportunidades.`,
     },
     {
          category: 'contact',
          title: 'Contacto y disponibilidad',
          content: `Se puede contactar a Roberth por correo en dayvidlife@gmail.com, por WhatsApp al +593 99 819 6406 o por LinkedIn (linkedin.com/in/roberth-loor-837744227). Su código está en GitHub: github.com/RoberthLoorDev. Su portafolio está en portfolio-roberth.vercel.app, que incluye un formulario de contacto y un botón para descargar su CV. Está disponible para nuevos proyectos y oportunidades. Vive en Manta, Ecuador; Jakay, su empleador actual, tiene sede en Ambato.`,
     },
     {
          category: 'experience',
          title: 'Jakay: rol actual (dic 2025 – presente)',
          content: `Desde diciembre 2025 Roberth trabaja como Software & Mobile Developer en Jakay (Ambato, Ecuador), una empresa fintech y de software a medida que crea soluciones financieras digitales, integraciones de API y plataformas de pago. Ha liderado iniciativas frontend y full-stack de su producto principal, Riku, un marketplace de vehículos con crédito. Forma parte del Comité Estratégico de Desarrollo Frontend, donde define la hoja de ruta, la elección de frameworks, la arquitectura de infraestructura y los requisitos técnicos. Introdujo y capacita al equipo en flujos de trabajo con asistentes de IA (Cursor, Claude y Copilot) para acelerar la entrega diaria. También se encarga de compilar y desplegar servicios en servidores de producción con Docker y Linux. Tecnologías: Angular, Astro, React, Vue.js, TypeScript, Tailwind CSS, Express, Nginx, Docker y Linux.`,
     },
     {
          category: 'project',
          title: 'Riku: marketplace de vehículos y fintech (Jakay)',
          content: `Riku es un marketplace automotriz web y móvil en Ecuador que digitaliza todo el proceso de compra y venta de vehículos, desde la publicación hasta la aprobación del crédito y la documentación. Aportes de Roberth: primero, un rescate arquitectónico, reestructurando lógica transaccional crítica en Express y Angular para resolver fallas graves de flujo en producción sin reescribir todo el sistema y protegiendo transacciones de alto valor. Segundo, una migración progresiva de Angular a Astro con enrutamiento inteligente en Nginx, página por página y sin tiempo de inactividad. Tercero, integraciones con bancos ecuatorianos y con el buró de crédito Avalburó para automatizar perfiles de riesgo y elegibilidad crediticia. Cuarto, un modelo de precio base congelado que mantiene inmutables los datos de pago una vez iniciado un crédito o una transacción. Quinto, despliegue en servidores Linux con contenedores Docker. Stack: Angular, Astro, TypeScript, Tailwind CSS, Express, Nginx, Linux y Docker.`,
     },
     {
          category: 'leadership',
          title: 'Liderazgo, mentoría y trabajo en equipo (leadership)',
          content: `Roberth tiene experiencia de liderazgo técnico y de trabajo en equipo; su portafolio no menciona un cargo de gerencia de personas. En Jakay integra el Comité Estratégico de Desarrollo Frontend (decide frameworks, arquitectura e infraestructura), mentorea a desarrolladores en el uso de asistentes de IA (Cursor, Claude y Copilot) y asumió el rescate de Riku bajo presión; la ficha del proyecto lo describe como preparación para un rol de Tech Lead. En EPAM lideró el desarrollo del sistema IoT de monitoreo ambiental y el desarrollo frontend del sistema de gestión del laboratorio, con reuniones semanales con ejecutivos y representantes del cliente. Como freelance gestionó proyectos de principio a fin directamente con clientes. Estudió gestión y liderazgo de proyectos y levantamiento de requerimientos. Sus habilidades blandas incluyen comunicación efectiva, resolución de problemas, adaptabilidad, trabajo en equipo y creatividad.`,
     },
     {
          category: 'experience',
          title: 'Vagadamia: plataforma ERP de órdenes de compra e inventario (feb – nov 2025)',
          content: `De febrero a noviembre 2025 Roberth trabajó como Software Engineer / ERP Developer en VAGADAMIA, un proveedor de hardware a nivel nacional. Diseñó una plataforma integral para órdenes de compra, facturación, órdenes de servicio, inventario por número de serie y mantenimiento de equipos, que reemplazó un frágil sistema heredado en PHP. Automatizó las transiciones de estado de pedidos y mantenimiento, reconstruyó un módulo de mantenimiento que estaba inactivo (con planificación y notificaciones) e implementó roles y permisos, paneles de control y generación masiva de PDF con un clic (actas de entrega, garantías, cronogramas de mantenimiento y certificados), lo que redujo en 40% el esfuerzo de generación de documentos. Construyó además un monitor de compras públicas con web scraping que detecta en tiempo real nuevos pedidos del gobierno. Stack: React, TypeScript, Express, Sequelize, Tailwind CSS, shadcn/ui y web scraping.`,
     },
     {
          category: 'experience',
          title: 'Freelance en Upwork y Fiverr (dic 2024 – feb 2025)',
          content: `Como Freelance Software Engineer en Upwork y Fiverr (período indicado: diciembre 2024 – febrero 2025), Roberth entregó soluciones web de alto rendimiento, dashboards personalizados y backends serverless para clientes internacionales, trabajando de forma remota con Astro, React, Vue.js, Tailwind CSS, JavaScript y Supabase. Mantuvo una tasa de entrega puntual del 100%, con foco en optimización SEO, tiempos de carga inferiores a un segundo y una arquitectura de interfaz limpia. Gestionó cada proyecto de principio a fin con plazos ajustados, interfaces mobile-first adaptadas al branding de cada cliente y Supabase para autenticación, almacenamiento de datos y procesos de backend.`,
     },
     {
          category: 'project',
          title: 'Proyectos freelance: landing de codecolibri y sistema de cartas coleccionables',
          content: `Landing page corporativa para codecolibri (Fiverr, enero 2024): sitio para una empresa de software recién creada en Ecuador, hecho con Astro, TypeScript y Tailwind CSS, formulario de contacto con EmailJS y despliegue en Vercel; diseño responsivo, buen rendimiento y SEO, con varias reuniones de revisión y alta satisfacción del cliente. Sistema de colección de cartas coleccionables para el streamer d0oppa (Upwork, marzo – abril 2024): interfaz frontend con React, Next.js, TypeScript y Tailwind CSS sobre el backend existente del streamer, con visualización de cartas, colecciones por usuario y un ranking de los mejores coleccionistas; revitalizó la participación de la comunidad. Quedan pendientes problemas del backend del cliente, que no respondió a los intentos de comunicación.`,
     },
     {
          category: 'experience',
          title: 'EPAM: sistema IoT de monitoreo ambiental (sep 2023 – ene 2024)',
          content: `De septiembre 2023 a enero 2024, como Software Developer en la Empresa Pública de Agua Potable de Manta (EPAM), Roberth lideró el desarrollo de un sistema IoT de bajo costo para monitorear en tiempo real la temperatura y la humedad en tres laboratorios (Reactivos, General y Microbiología), con alertas personalizables. Automatizó el monitoreo, redujo costos y mejoró indirectamente el servicio para las 258.000 personas que dependen de EPAM. Trabajó con la metodología Extreme Programming (XP) y reuniones semanales con ejecutivos. Incluyó un dashboard con visualización de datos y reportes automatizados, autenticación segura y control de acceso por roles, límites de alerta configurables, consultas históricas por rango horario y un diseño escalable para nuevas salas.`,
     },
     {
          category: 'skills',
          title: 'Desarrollo móvil, React Native e IoT',
          content: `Roberth tiene experiencia en desarrollo móvil con React Native, documentada sobre todo en el sistema IoT de EPAM, donde construyó la aplicación móvil con gráficos y resúmenes del estado de cada sala (promedios, máximos y mínimos), registro de alertas, notificaciones visuales, alertas críticas en tiempo real mediante Firebase Cloud Messaging (FCM) y consultas históricas por rangos de horas. Ese sistema integró hardware y software: sensores DHT22 conectados a microcontroladores ESP32 (con Arduino) enviaban datos por Wi-Fi a un backend Express, guardados en MongoDB Atlas, y se mostraban en una aplicación web con React, en la app móvil con React Native y en pantallas LED en los laboratorios. En Jakay su cargo es Software & Mobile Developer y Riku es una plataforma web y móvil. Su formación incluyó desarrollo de software web y móvil.`,
     },
     {
          category: 'project',
          title: 'EPAM: sistema de gestión del laboratorio de agua (nov 2022 – feb 2023)',
          content: `De noviembre 2022 a febrero 2023, como Software Developer en EPAM, Roberth lideró el desarrollo frontend de un sistema de gestión integral para el Laboratorio Especializado en Tratamiento de Agua. Reemplazó las hojas de Excel y el uso excesivo de papel con una plataforma centralizada de usuarios (con roles y permisos), inventario de suministros químicos con alertas de nivel crítico, clientes y servicios, gestión de documentos con respaldo, y costos y activos. Siguió la metodología Scrum, con entregas continuas y reuniones semanales con representantes del laboratorio. Aplicó buenas prácticas de organización de código y depuración, y colaboró en todo el ciclo: análisis de requerimientos, desarrollo y despliegue. Stack: React, TypeScript, Express, PostgreSQL y Bootstrap.`,
     },
     {
          category: 'education',
          title: 'Educación',
          content: `Roberth es Ingeniero en Tecnologías de la Información por la Universidad Laica Eloy Alfaro de Manabí (estudios 2019 – 2024, título obtenido en marzo de 2024). Se especializó en desarrollo de software y su ciclo de vida, metodologías ágiles como Scrum, ingeniería de software, redes y comunicación de datos, administración y gestión de bases de datos, desarrollo web y móvil, y gestión y liderazgo de proyectos, incluido el levantamiento de requerimientos. Antes cursó el bachillerato en Ciencias de la Computación (2015 – 2019).`,
     },
     {
          category: 'skills',
          title: 'Habilidades frontend',
          content: `Habilidades frontend de Roberth: React.js para interfaces interactivas y componentes reutilizables, Angular (en Riku, en Jakay), Vue.js, Next.js con SSR y SSG, Astro para sitios ultrarrápidos y migraciones progresivas, React Native para móvil, JavaScript y TypeScript, HTML5 y CSS3, Tailwind CSS, Bootstrap y shadcn/ui. Tiene experiencia en diseño responsivo y mobile-first, principios de UI/UX, optimización de rendimiento y SEO, y visualización de datos con gráficos y dashboards.`,
     },
     {
          category: 'skills',
          title: 'Habilidades backend y bases de datos',
          content: `Habilidades backend de Roberth: Express.js para APIs RESTful, Nest.js para aplicaciones Node.js escalables con arquitectura modular, Sequelize como ORM y Supabase como BaaS (autenticación y base de datos). Bases de datos relacionales con MySQL y PostgreSQL, y NoSQL con MongoDB y MongoDB Atlas. Tiene experiencia integrando servicios de terceros (bancos y el buró de crédito Avalburó, EmailJS, Firebase Cloud Messaging), web scraping, generación automática de documentos PDF, autenticación segura y control de acceso por roles.`,
     },
     {
          category: 'skills',
          title: 'DevOps, infraestructura y herramientas',
          content: `Roberth usa Docker y Linux para compilar y desplegar servicios en servidores de producción (en Jakay), Nginx como proxy inverso y enrutamiento para migraciones progresivas, Vercel para desplegar sitios y Git para el control de versiones. Sus herramientas habituales son Git, Figma, VS Code, Trello y Notion. Trabaja con asistentes de IA para programar (Cursor, Claude y Copilot) y capacita a su equipo en ello.`,
     },
     {
          category: 'skills',
          title: 'Metodologías y forma de trabajo',
          content: `Roberth trabaja con Scrum (sistema del laboratorio de EPAM, y parte de su formación) y con Extreme Programming o XP (sistema IoT), con iteraciones rápidas y entregas continuas. Mantiene reuniones semanales con ejecutivos y representantes del cliente para alinear objetivos y requisitos, y varias reuniones de revisión con clientes freelance. Sus proyectos parten de un problema de negocio concreto, como eliminar Excel y papel, reemplazar un sistema PHP frágil o automatizar documentos, y priorizan flujos automatizados que reducen errores manuales, interfaces intuitivas y diseños escalables para necesidades futuras. Ha colaborado de forma remota con clientes internacionales y en equipos multidisciplinarios.`,
     },
     {
          category: 'skills',
          title: 'Idiomas y habilidades blandas',
          content: `Roberth habla español como lengua nativa e inglés con nivel profesional de trabajo. Sus habilidades blandas incluyen comunicación efectiva para colaborar con equipos y clientes, resolución de problemas para abordar desafíos técnicos, adaptabilidad a nuevas tecnologías y metodologías, trabajo en equipo en proyectos multidisciplinarios y creatividad para proponer soluciones innovadoras.`,
     },
     {
          category: 'interests',
          title: 'Objetivos e intereses profesionales',
          content: `El objetivo de Roberth es seguir creciendo en desarrollo frontend y backend con tecnologías como React y Node, y hacer contribuciones significativas al desarrollo web. Se interesa por la arquitectura frontend y la optimización de rendimiento, por explorar nuevos frameworks y herramientas de JavaScript y por los principios de diseño UI/UX. También busca asumir más responsabilidad técnica, con mentoría y decisiones de arquitectura en Jakay y una preparación hacia un rol de Tech Lead. Fuera del trabajo mantiene un estilo de vida equilibrado, con ejercicio físico regular.`,
     },
     {
          category: 'summary',
          title: 'Tecnologías por proyecto',
          content: `Tecnologías de Roberth por proyecto. Riku (Jakay): Angular, Astro, TypeScript, Tailwind CSS, Express, Nginx, Linux y Docker. Vagadamia (ERP): React, TypeScript, Express, Sequelize, Tailwind CSS, shadcn/ui y web scraping. Freelance en Upwork y Fiverr: Astro, React, Vue.js, Tailwind CSS, JavaScript y Supabase; landing de codecolibri: Astro, TypeScript, Tailwind CSS, EmailJS y Vercel; cartas coleccionables: React, Next.js, TypeScript, Tailwind CSS y Vercel. Sistema IoT de EPAM: React Native, React, Vue.js, Express, MongoDB Atlas, Arduino, ESP32, sensores DHT22 y Firebase Cloud Messaging. Sistema del laboratorio de EPAM: React, TypeScript, Express, PostgreSQL, Bootstrap y Scrum.`,
     },
     {
          category: 'achievements',
          title: 'Logros y resultados destacados',
          content: `Resultados destacados de Roberth: migración progresiva de Riku de Angular a Astro sin tiempo de inactividad; rescate de flujos transaccionales críticos en producción sin reescritura completa; automatización de perfiles de riesgo con bancos y el buró Avalburó; reducción del 40% del esfuerzo de generación de documentos en Vagadamia y reemplazo de un sistema PHP heredado; monitor de compras públicas en tiempo real; tasa de entrega puntual del 100% como freelance; sistema IoT en tres laboratorios con impacto indirecto en 258.000 personas; eliminación de Excel y papel en el laboratorio de EPAM; y mentoría del equipo de Jakay en el uso de IA.`,
     },
     {
          category: 'meta',
          title: 'Sobre este portafolio y su chat',
          content: `Este portafolio está hecho con Astro, React y Tailwind CSS, desplegado en Vercel y disponible en inglés y español. El chat busca de forma semántica en la información de Roberth usando embeddings de Google Gemini y redacta las respuestas con un modelo de lenguaje de Groq, con Gemini como respaldo, mostrando la respuesta en tiempo real mientras se genera.`,
     },
]
