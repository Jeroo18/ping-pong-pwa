# Guía para una nave 3D real

El Starfighter incluido hoy es una escena 2D pintada en canvas con perspectiva simulada. Para convertirlo en 3D auténtico se necesita un modelo 3D (GLB/glTF) y un renderizador WebGL.

## Herramientas recomendadas

- **Meshy** (https://www.meshy.ai/): crear un modelo de nave a partir de texto/imagen; exportar como GLB; el plugin oficial de Blender permite importar activos.
- **Blender** (https://www.blender.org/): limpiar topología, escala, pivote, materiales y optimizar el modelo. Blender es el editor 3D, no el modelo de IA.
- **Three.js** (https://threejs.org/): cargar GLB con GLTFLoader y renderizarlo en el juego web. glTF/GLB es el formato abierto común.
- Alternativa de generación: Tripo (https://www.tripo3d.ai/).

## Prompt inicial sugerido para Meshy

“Small original arcade starfighter spaceship for a retro sci-fi space shooter, clear symmetrical silhouette, pointed nose facing forward, twin engine nacelles, compact wings, cockpit canopy, clean low-poly game-ready topology, optimized under 20k triangles, baked PBR textures, no background, centered pivot at ship center, front view facing negative Z, exportable GLB.”

## Pipeline

1. Genera algunas variaciones en Meshy. Comprueba los créditos, privacidad y licencia de exportación en tu cuenta antes de confirmar una generación. No introducir credenciales aquí.
2. Exporta GLB y ábrelo en Blender; revisa la orientación y elimina caras/materiales innecesarios. Objetivo móvil: modelo ligero (<20k triángulos, textura 1K o menos).
3. Copia el GLB optimizado a `assets/starfighter.glb` y confirma los derechos de uso.
4. Añade Three.js y GLTFLoader como dependencias versionadas/locales, no como una importación CDN sin pin.
5. Renderiza una prueba de nave estática; luego añade controles, disparos, colisiones y LOD. Limita devicePixelRatio (máximo 1.5), usa geometrías reutilizadas y pausa el bucle al ocultar la página.
6. Prueba iPhone/Android reales, consumo de batería, memoria y recuperación al volver a la pestaña; solo entonces sustituye la escena placeholder.

La automatización de este paso requiere que se proporcione el archivo GLB con derechos de uso o se complete un servicio generador con una cuenta propia y se descargue/exporte el modelo. No se instaló Meshy/Blender ni se generó o descargó un activo externo en esta actualización.
