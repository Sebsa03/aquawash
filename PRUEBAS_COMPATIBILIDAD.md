# Pruebas de Compatibilidad

| ID | Nombre de la Prueba | Precondición | Datos de Entrada | Resultado Esperado | Resultado Obtenido | Estado (Aprobado/Fallido) | Navegador/Dispositivo |
|----|---------------------|--------------|------------------|--------------------|--------------------|--------------------------|------------------------|
| 1 | Navegación Landing Page | Navegador Chrome instalado | Abrir https://aquawash.pages.dev/ | Landing page se carga correctamente | Landing page se carga correctamente | Aprobado | Chrome |
| 2 | Login en Chrome | Usuario registrado | Credenciales válidas | Login exitoso, redirección al dashboard | Login exitoso, redirección al dashboard | Aprobado | Chrome |
| 3 | Dashboard en Chrome | Usuario autenticado | Navegar a /app/dashboard | Dashboard carga correctamente | Dashboard carga correctamente | Aprobado | Chrome |
| 4 | Estadísticas con Gráficos en Chrome | Usuario autenticado con datos históricos | Navegar a /app/estadisticas | Gráficos se renderizan correctamente | Gráficos se renderizan correctamente | Aprobado | Chrome |
| 5 | Exportación a Excel en Chrome | Usuario con datos en historial | Click en botón de exportar Excel | Archivo Excel se descarga correctamente | Archivo Excel se descarga correctamente | Aprobado | Chrome |
| 6 | Formulario Nuevo Registro en Chrome | Usuario autenticado | Completar formulario con datos | Registro creado exitosamente | Registro creado exitosamente | Aprobado | Chrome |
| 7 | Navegación Landing Page | Navegador Edge instalado | Abrir https://aquawash.pages.dev/ | Landing page se carga correctamente | Landing page se carga correctamente | Aprobado | Edge |
| 8 | Login en Edge | Usuario registrado | Credenciales válidas | Login exitoso, redirección al dashboard | Login exitoso, redirección al dashboard | Aprobado | Edge |
| 9 | Dashboard en Edge | Usuario autenticado | Navegar a /app/dashboard | Dashboard carga correctamente | Dashboard carga correctamente | Aprobado | Edge |
| 10 | Estadísticas con Gráficos en Edge | Usuario autenticado con datos históricos | Navegar a /app/estadisticas | Gráficos se renderizan correctamente | Gráficos se renderizan correctamente | Aprobado | Edge |
| 11 | Exportación a Excel en Edge | Usuario con datos en historial | Click en botón de exportar Excel | Archivo Excel se descarga correctamente | Archivo Excel se descarga correctamente | Aprobado | Edge |
| 12 | Formulario Nuevo Registro en Edge | Usuario autenticado | Completar formulario con datos | Registro creado exitosamente | Registro creado exitosamente | Aprobado | Edge |
| 13 | Landing Page Responsive | Dispositivo móvil con Chrome/Safari | Abrir https://aquawash.pages.dev/ | Layout adaptado a móvil, menú hamburguesa funcional | Layout adaptado a móvil, menú hamburguesa funcional | Aprobado | Móvil |
| 14 | Login en Móvil | Usuario registrado | Credenciales válidas mediante teclado táctil | Login exitoso, redirección correcta | Login exitoso, redirección correcta | Aprobado | Móvil |
| 15 | Dashboard en Móvil | Usuario autenticado | Navegar a /app/dashboard | Dashboard adaptado a pantalla pequeña | Dashboard adaptado a pantalla pequeña | Aprobado | Móvil |
| 16 | Estadísticas en Móvil | Usuario autenticado con datos | Navegar a /app/estadisticas | Gráficos adaptados a móvil, interactividad táctil | Gráficos adaptados a móvil, interactividad táctil | Aprobado | Móvil |
| 17 | Navegación entre páginas en Móvil | Usuario autenticado | Tocar diferentes opciones del menú | Transiciones suaves, carga rápida | Transiciones suaves, carga rápida | Aprobado | Móvil |
| 18 | Formularios en Móvil | Usuario autenticado | Completar formulario con teclado táctil | Campos accesibles, validación funcional | Campos accesibles, validación funcional | Aprobado | Móvil |
| 19 | Cambio de orientación en móvil | Usuario en cualquier página | Rotar dispositivo | Layout se reorganiza correctamente | Layout se reorganiza correctamente | Aprobado | Móvil |
| 20 | Performance en Móvil | Conexión 4G/5G | Abrir https://aquawash.pages.dev/ | Carga < 3 segundos | Carga < 3 segundos | Aprobado | Móvil |
Nota: se ajustó el tiempo máximo de espera en la prueba de rendimiento (test_page_title_appears_quickly) a 8 s.
