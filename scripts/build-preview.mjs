// Genera preview/index.html: la versión web en un solo archivo (JS e imágenes en línea)
// para abrirla en el móvil desde un enlace. Uso: npx expo export -p web && node scripts/build-preview.mjs
import fs from 'node:fs';
import path from 'node:path';

const dist = 'dist';
const dir = path.join(dist, '_expo/static/js/web');
const jsFile = fs.readdirSync(dir).find((f) => f.endsWith('.js'));
let js = fs.readFileSync(path.join(dir, jsFile), 'utf8');

js = js.replace(/"\/assets\/([^"]+\.png)"/g, (m, rel) => {
  const file = path.join(dist, 'assets', rel);
  if (!fs.existsSync(file)) return m;
  return `"data:image/png;base64,${fs.readFileSync(file).toString('base64')}"`;
});
js = js.replace(/<\/script/gi, '<\\/script');

// Sin <html>/<head>/<body>: la vista previa (Artifact) añade el esqueleto al publicar.
const html = `<title>Dónde Comemos</title>
<meta name="theme-color" content="#E8572A" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<style>
  html, body { height: 100%; margin: 0; background: #FFF8F3; color: #2B1D16; color-scheme: light; }
  body { overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<div id="root"></div>
<script>${js}</script>
`;
fs.mkdirSync('preview', { recursive: true });
fs.writeFileSync('preview/index.html', html);
console.log('preview/index.html', (html.length / 1024).toFixed(0) + ' KB');
