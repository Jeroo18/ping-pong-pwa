# 🕹️ Mini Arcade — Juega y diviértete

Colección de 15 juegos gratuitos, adaptados a teléfonos y computadoras. Incluye menú, orientación vertical/horizontal y una guía sencilla antes de cada partida.

## Juegos

- Ping-pong contra la CPU
- Naves de futbolín: equipos espaciales protegen su portería y tratan de marcar
- Starfighter: escena arcade con perspectiva, planetas y drones, todavía simulada en 2D
- Serpiente
- Rompebloques
- Esquiva meteoritos
- Memoria (parejas)
- Simón dice
- Reto matemático
- Secuencia numérica
- Reflejos
- Toques rápidos
- Luces (acertijo)

Para el pipeline de modelo 3D real, consulta [`3d-workflow.md`](3d-workflow.md). El modelo GLB real aún debe generarse y suministrarse; no se instaló software ni se consumieron créditos de un generador.

## Prueba local

Sirve la carpeta por HTTP, por ejemplo `python3 -m http.server 8000`, y abre `http://localhost:8000`.

GitHub Pages se despliega desde la rama `main`, carpeta raíz `/`. La caché offline usa una nueva versión para borrar la anterior al actualizar.

En iPhone, abre el sitio HTTPS en Safari y usa **Compartir → Añadir a pantalla de inicio**. El cambio vertical/horizontal está en la pantalla de cada juego; el bloqueo de orientación física depende del navegador/dispositivo.
