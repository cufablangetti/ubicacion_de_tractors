// Script para generar iconos PNG desde SVG
const fs = require('fs');

// Para generar los iconos PNG necesitarás una herramienta como:
// - https://realfavicongenerator.net/ (online)
// - O usar este SVG directamente en tu navegador y tomar capturas

console.log(`
📱 GENERAR ICONOS PARA LA PWA

Opción 1 (Recomendada): Usar herramienta online
----------------------------------------------
1. Ve a: https://realfavicongenerator.net/
2. Sube el archivo: public/icon.svg
3. Descarga el paquete generado
4. Coloca los archivos en la carpeta /public/

Opción 2: Usar Photoshop/GIMP/Figma
-----------------------------------
1. Abre public/icon.svg en tu editor
2. Exporta como PNG en dos tamaños:
   - icon-192x192.png (192x192 píxeles)
   - icon-512x512.png (512x512 píxeles)
3. Guárdalos en /public/

Opción 3: Usar online converter
-------------------------------
1. Ve a: https://cloudconvert.com/svg-to-png
2. Sube public/icon.svg
3. Convierte a 192x192 y 512x512
4. Descarga y coloca en /public/

Por ahora, la app funcionará sin los PNG, pero para
una PWA completa necesitas estos iconos.
`);
