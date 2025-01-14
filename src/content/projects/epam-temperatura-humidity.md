---
title: 'IoT Temperature Monitoring System'
date: 'Sep 2023 - Jan 2024'
company: 'Public Water Company of the City of Manta'
description: 'I developed modules to manage users, inventory, assets and costs. I improved the user experience with friendly and robust interfaces.'
tags:
  - name: 'Express'
    color: '#336791'
  - name: 'PostgreSQL'
    color: '#336791'
image: '/src/assets/details/epam-building.jpg'
buttonText: 'Probar demo'
buttonLink: 'https://google.com'
achievements:
  - 'Impacto social significativo: Además de beneficiar directamente a los laboratorios, el sistema mejoró indirectamente la calidad del servicio para las 258,000 personas que dependen de EPAM.'
  - 'Reducción de costos: Implementación de un sistema económico que automatizó el monitoreo en tres laboratorios clave (Reactivos, General y Microbiología).'
  - 'Interfaz avanzada: Se maquetaron gráficos en la aplicación móvil, ofreciendo resúmenes detallados del estado de las salas, datos promedio, máximos, mínimos y registros de alertas.'
  - 'Alertas y personalización: Configuración de límites de alerta personalizables, notificaciones visuales en la app y pantallas LED, y alertas críticas en tiempo real.'
  - 'Consultas avanzadas: Funcionalidades para consultar datos históricos en rangos de horas específicos, con acceso a resúmenes diarios y el estado de las salas.'
  - 'Escalabilidad garantizada: El sistema fue diseñado para admitir nuevos laboratorios o salas, asegurando su viabilidad para futuros requerimientos.'
conclusion: 'Este proyecto no solo demostró su eficacia técnica, sino también su capacidad para ofrecer soluciones escalables y sostenibles a problemas reales, destacándose como una herramienta esencial para el monitoreo ambiental en la EPAM.'
body: |
  El proyecto consistió en el diseño e implementación de un sistema IoT para el monitoreo en tiempo real de temperatura y humedad en los laboratorios de la Empresa Pública de Agua de Manta (EPAM). <br/> <br/> La iniciativa fue desarrollada bajo la metodología Extreme Programming (XP), seleccionada por su capacidad para adaptarse a equipos pequeños y fomentar iteraciones rápidas. 
  
  Durante el desarrollo, se mantuvieron reuniones semanales con directivos, asegurando una alineación constante con los objetivos y requisitos del cliente.
  <br/><br/>
  El sistema integró hardware y software, utilizando sensores DHT22 conectados a microcontroladores ESP32 para la captura de datos ambientales, los cuales se transmitían a través de un backend en Express y se almacenaban en MongoDB Atlas. Los datos eran presentados en una aplicación web desarrollada con React, una app móvil en React Native y pantallas LED en los laboratorios para la visualización local en tiempo real. Además, se implementaron notificaciones mediante Firebase Cloud Messaging (FCM) para alertas críticas, optimizando el control de las condiciones ambientales.
footerImage: '/src/assets/details/screen-sensor.jpg'
footerCaption: 'Circuito de hardware propuesto (el mas grande) frente al sensor ya existente en los laboratorios.'
---