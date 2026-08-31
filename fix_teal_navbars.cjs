const fs = require('fs');

const indexCssPath = './src/index.css';
let content = fs.readFileSync(indexCssPath, 'utf-8');

// Update .navbar background
content = content.replace(/background: rgba\(30, 41, 59, 0\.96\);/g, 'background: #009688;');
// Update .logo and .footer-logo split
content = content.replace(/\.logo,\s*\.footer-logo {[\s\S]*?}/, `.logo,
.footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 800;
}
.logo { color: #ffffff; }
.footer-logo { color: #1e293b; }`);

// Update .nav-links a and .footer-links a split
content = content.replace(/\.nav-links a,\s*\.footer-links a {[\s\S]*?}/, `.nav-links a,
.footer-links a {
  font-size: 14px;
  font-weight: 600;
  transition: 0.2s;
}
.nav-links a { color: #ffffff; }
.footer-links a { color: #475569; }`);

// Update .sidebar background
content = content.replace(/\.sidebar {[\s\S]*?}/, `.sidebar {
  width: 250px;
  min-height: 100vh;
  background: #009688;
  border-right: 1px solid #00796b;
  padding: 25px 16px;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
}`);

// Update .dashboard-logo color
content = content.replace(/\.dashboard-logo {[\s\S]*?}/, `.dashboard-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 21px;
  font-weight: 800;
  padding: 5px 10px 35px;
  color: #ffffff;
}`);

// Update .sidebar-label color
content = content.replace(/\.sidebar-label {[\s\S]*?}/, `.sidebar-label {
  color: #b2dfdb;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  padding: 0 12px;
  margin-bottom: 10px;
}`);

// Update .sidebar-item color
content = content.replace(/\.sidebar-item {[\s\S]*?}/, `.sidebar-item {
  width: 100%;
  border: none;
  background: transparent;
  padding: 12px;
  margin-bottom: 5px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
}`);

// Update .sidebar-item:hover and .sidebar-item.active
content = content.replace(/\.sidebar-item:hover {[\s\S]*?}/, `.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fbbf24;
}`);
content = content.replace(/\.sidebar-item\.active {[\s\S]*?}/, `.sidebar-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: #fbbf24;
}`);

fs.writeFileSync(indexCssPath, content, 'utf-8');
console.log('index.css sidebar/navbar overrides applied successfully.');
