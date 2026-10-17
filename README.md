# 🏓 Ping Pong — Reto de campeones

Juego de ping-pong arcade para navegador: juega contra la CPU, mueve tu paleta con el dedo o el ratón y llega primero a 7 puntos. Diseño adaptable para móvil, soporte para teclado, PWA instalable y modo offline.

## Probar localmente

Necesitas servir los archivos por HTTP (el service worker no funciona en `file://`). Por ejemplo:

```bash
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Instalar en iPhone

1. Publica el proyecto en un sitio con HTTPS.
2. Abre el enlace en **Safari**.
3. Toca **Compartir** → **Añadir a pantalla de inicio** → **Añadir**.

No se requieren permisos especiales. Una vez cargado, el juego también puede funcionar sin conexión.

## Publicación con GitHub Pages

En el repositorio, abre **Settings → Pages**, elige la rama `main` y la carpeta `/ (root)`, y guarda. Cuando termine la publicación, GitHub mostrará el enlace HTTPS del juego. Para instalarlo en iPhone, el repositorio debe ser público o tener Pages habilitado por el plan/configuración de la cuenta. No hace falta conceder permisos al teléfono; la instalación se confirma desde el menú Compartir de Safari.

## Archivos

- `index.html` — estructura y metadatos
- `styles.css` — interfaz adaptable
- `game.js` — juego, controles y CPU
- `manifest.webmanifest` — metadatos PWA
- `sw.js` — caché para modo offline
- `icon.svg` — icono del juego

Sin dependencias de ejecución. La tipografía remota es opcional; el juego usa fuentes de sistema si no hay conexión.
