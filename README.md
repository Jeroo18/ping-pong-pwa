# 🕹️ Mini Arcade — Juega y diviértete

Colección de 15 juegos gratuitos, adaptados a teléfonos y computadoras. Incluye menú, orientación vertical/horizontal y una guía sencilla antes de cada partida.

## Juegos

**En 3D real (Three.js, incluido localmente para jugar sin conexión):**

- Ping-pong 3D contra la CPU
- Futbolín 3D: mesa con barras y muñecos que patean
- Naves de futbolín 3D: equipos espaciales protegen su portería y tratan de marcar
- Starfighter 3D: pilota, dispara y esquiva asteroides
- Air Hockey 3D

Si el dispositivo no tiene WebGL, estos juegos se dibujan en 2D automáticamente.

**En 2D:**

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

Para el pipeline de modelo 3D real, consulta [`3d-workflow.md`](3d-workflow.md). Prompt de generación en español: [`3d-prompt-es.txt`](3d-prompt-es.txt). Las naves y mesas actuales están construidas con geometría de Three.js; un modelo GLB generado por IA puede sustituirlas más adelante.

Prueba automática de los 15 juegos: `node test-3d.js` (y `NO3D=1 node test-3d.js` para el modo 2D de respaldo).

## Prueba local

Sirve la carpeta por HTTP, por ejemplo `python3 -m http.server 8000`, y abre `http://localhost:8000`.

GitHub Pages se despliega desde la rama `main`, carpeta raíz `/`. La caché offline usa una nueva versión para borrar la anterior al actualizar.

En iPhone, abre el sitio HTTPS en Safari y usa **Compartir → Añadir a pantalla de inicio**. El cambio vertical/horizontal está en la pantalla de cada juego; el bloqueo de orientación física depende del navegador/dispositivo.
