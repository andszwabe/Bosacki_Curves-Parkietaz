const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const enginePath = path.join(rootDir, 'dist', 'engine.js');

try {
  console.log('Inlining engine...');

  let html = fs.readFileSync(indexPath, 'utf8');
  const engine = fs.readFileSync(enginePath, 'utf8').trim();

  // Strip the "use strict" tsc adds — index.html's script already has one.
  const cleanedEngine = engine.replace(/^\s*"use strict";\s*\n?/, '');

  // Replace everything between the marker comments. The pattern handles both the
  // initial placeholder and any previously-inlined engine code.
  const markerRegex = /(\/\/ ENGINE_START)[\s\S]*?(\/\/ ENGINE_END)/;
  if (!markerRegex.test(html)) {
    console.error('ENGINE_START / ENGINE_END markers not found in index.html.');
    process.exit(1);
  }

  html = html.replace(markerRegex, `$1\n${cleanedEngine}\n$2`);

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Engine inlined into index.html.');
} catch (err) {
  console.error('Error inlining engine:', err);
  process.exit(1);
}

