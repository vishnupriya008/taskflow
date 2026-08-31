const fs = require('fs');
const path = require('path');

const srcDir = './src/pages';
const indexCssPath = './src/index.css';

// Hex code mapping
const colorMap = {
  // Backgrounds
  '#0f172a': '#dbe4e2',
  '#1e293b': '#fbcfe8',
  // Accents
  '#6366f1': '#9d717e',
  // Borders
  '#334155': '#f9a8d4',
  // Text
  '#f8fafc': '#2d242b',
  '#94a3b8': '#5b4b54',
  '#ffffff': '#fde8e9',
  '#fff': '#fde8e9',
  'white': '#fde8e9'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace colors (case insensitive)
  Object.keys(colorMap).forEach(oldColor => {
    // Escape hash for regex
    let escapedOld = oldColor;
    if (oldColor.startsWith('#')) {
      escapedOld = '\\' + oldColor;
    }
    
    // We want to match the color either inside quotes, or plain (for css)
    // Be careful with replacing 'white' globally. Only replace 'white' when it looks like a CSS value.
    if (oldColor === 'white') {
        const regex = new RegExp(`(color|background|background-color|border)\\s*:\\s*['"]?white['"]?`, 'gi');
        content = content.replace(regex, (match, p1) => {
           // check if quotes are used
           if (match.includes('"')) return `${p1}: "#fde8e9"`;
           if (match.includes("'")) return `${p1}: '#fde8e9'`;
           return `${p1}: #fde8e9`;
        });
    } else {
        const regex = new RegExp(escapedOld, 'gi');
        content = content.replace(regex, colorMap[oldColor]);
    }
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${filePath}`);
}

// Process index.css
if (fs.existsSync(indexCssPath)) {
  processFile(indexCssPath);
}

// Process all JSX files in src/pages
if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));
  files.forEach(f => {
    processFile(path.join(srcDir, f));
  });
}
