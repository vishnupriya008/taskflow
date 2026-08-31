const fs = require('fs');

const landingPath = './src/pages/Landing.jsx';
let content = fs.readFileSync(landingPath, 'utf-8');

// Update navbar background
content = content.replace(/rgba\(15, 23, 42, 0\.8\)/g, 'rgba(0, 150, 136, 0.95)');

// Update button text to dark slate
content = content.replace(/background: "#fbbf24", color: "#ffffff"/g, 'background: "#fbbf24", color: "#1e293b"');
content = content.replace(/backgroundColor: "#fbbf24", color: "#ffffff"/g, 'backgroundColor: "#fbbf24", color: "#1e293b"');

// Update dark sections
content = content.replace(/#0b1120/g, '#e0f2f1');

fs.writeFileSync(landingPath, content, 'utf-8');
console.log('Landing.jsx fixed');
