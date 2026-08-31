const fs = require('fs');
const path = require('path');

const srcDir = './src/pages';
const indexCssPath = './src/index.css';

// Hex code mapping
const colorMap = {
  // Backgrounds
  '#dbe4e2': '#e0f2f1',
  '#fbcfe8': '#ffffff',
  // Accents
  '#9d717e': '#fbbf24',
  '#885a6a': '#d97706', // hover state for accents (previously the darker pastel)
  // Borders
  '#f9a8d4': '#99f6e4',
  // Text
  '#2d242b': '#1e293b',
  '#5b4b54': '#475569',
  '#fde8e9': '#ffffff' // general replacement, we'll manually fix button text
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
    
    const regex = new RegExp(escapedOld, 'gi');
    content = content.replace(regex, colorMap[oldColor]);
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
