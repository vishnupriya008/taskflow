import fs from 'fs';
import path from 'path';

const SRC_DIR = './src/pages';
const CSS_FILE = './src/index.css';

// We want to skip Landing.jsx as it is already dark theme
const EXCLUDE_FILES = ['Landing.jsx'];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Backgrounds
  content = content.replace(/(background(?:-color)?)\s*:\s*['"]?(?:#f8fafc|#f1f5f9)['"]?/gi, '$1: "#0f172a"');
  content = content.replace(/(background(?:-color)?)\s*:\s*['"]?(?:#ffffff|#fff|white)['"]?/gi, '$1: "#1e293b"');
  content = content.replace(/(background(?:-color)?)\s*:\s*['"]?rgba?\(255,\s*255,\s*255,\s*[^)]+\)['"]?/gi, '$1: "rgba(30, 41, 59, 0.96)"');
  content = content.replace(/(background(?:-color)?)\s*:\s*['"]?#f1f5f9['"]?/gi, '$1: "#334155"'); // Hover states usually

  // Typography
  // Headers & Main text
  content = content.replace(/(color)\s*:\s*['"]?(?:#000000|#000|#0f172a|#172033|#1e293b|#334155)['"]?/gi, '$1: "#f8fafc"');
  // Muted text
  content = content.replace(/(color)\s*:\s*['"]?(?:#64748b|#475569|#71717a)['"]?/gi, '$1: "#94a3b8"');

  // Borders
  content = content.replace(/(border(?:-color|-bottom|-top|-left|-right)?)\s*:\s*['"]?([^'"]*)(?:#e2e8f0|#e7ebf2|#cbd5e1|#ddd|#f1f5f9)['"]?/gi, '$1: "$2#334155"');

  // Accents (Electric Indigo)
  content = content.replace(/(?:#4f46e5|#5b4bdb|#4338ca)/gi, '#6366f1');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

function replaceInCSS(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Backgrounds
  content = content.replace(/(background(?:-color)?)\s*:\s*(?:#f8fafc|#f1f5f9);/gi, '$1: #0f172a;');
  content = content.replace(/(background(?:-color)?)\s*:\s*(?:#ffffff|#fff|white);/gi, '$1: #1e293b;');
  content = content.replace(/(background(?:-color)?)\s*:\s*rgba?\(255,\s*255,\s*255,\s*[^)]+\);/gi, '$1: rgba(30, 41, 59, 0.96);');
  content = content.replace(/(background(?:-color)?)\s*:\s*#f1f5f9;/gi, '$1: #334155;'); 

  // Typography
  content = content.replace(/(color)\s*:\s*(?:#000000|#000|#0f172a|#172033|#1e293b|#334155);/gi, '$1: #f8fafc;');
  content = content.replace(/(color)\s*:\s*(?:#64748b|#475569|#71717a);/gi, '$1: #94a3b8;');

  // Borders
  content = content.replace(/(border(?:-color|-bottom|-top|-left|-right)?)\s*:\s*([^;]+?)(?:#e2e8f0|#e7ebf2|#cbd5e1|#ddd|#f1f5f9);/gi, '$1: $2#334155;');

  // Accents
  content = content.replace(/(?:#4f46e5|#5b4bdb|#4338ca)/gi, '#6366f1');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated CSS ${filePath}`);
  }
}

// Process React files
fs.readdirSync(SRC_DIR).forEach(file => {
  if (file.endsWith('.jsx') && !EXCLUDE_FILES.includes(file)) {
    replaceInFile(path.join(SRC_DIR, file));
  }
});

// Process CSS
if (fs.existsSync(CSS_FILE)) {
  replaceInCSS(CSS_FILE);
}
