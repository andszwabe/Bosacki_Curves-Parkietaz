const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const htmlPath = path.join(rootDir, 'src', 'index.html');
const cssPath = path.join(rootDir, 'style.css');
const jsPath = path.join(rootDir, 'dist', 'app.js');
const outputPath = path.join(rootDir, 'index.html');

try {
  console.log("Inlining assets...");
  
  let html = fs.readFileSync(htmlPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');

  // Replace placeholders with tags containing styles and scripts
  html = html.replace('<!-- INLINE_CSS -->', `<style>\n${css}\n</style>`);
  html = html.replace('<!-- INLINE_JS -->', `<script>\n${js}\n</script>`);

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log("Self-contained index.html built successfully!");
} catch (err) {
  console.error("Error inlining assets:", err);
  process.exit(1);
}
