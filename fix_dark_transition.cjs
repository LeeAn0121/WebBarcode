const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

if (!css.includes('transition-colors duration-500')) {
  css += `\n
html, body, #root {
  @apply transition-colors duration-500;
}
`;
  fs.writeFileSync('src/index.css', css);
  console.log('Smooth dark mode transition added!');
} else {
  console.log('Already added');
}
