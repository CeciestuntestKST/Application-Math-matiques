'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const vendorDir = path.join(root, 'vendor');
const targets = [
  {
    from: path.join(root, 'node_modules', 'katex', 'dist'),
    to: path.join(vendorDir, 'katex'),
    files: ['katex.min.css', 'katex.min.js', 'fonts/KaTeX_Main-Regular.woff2', 'fonts/KaTeX_Math-Italic.woff2', 'fonts/KaTeX_Math-Italic.woff2', 'fonts/KaTeX_Size1-Regular.woff2', 'fonts/KaTeX_Size2-Regular.woff2', 'fonts/KaTeX_Size3-Regular.woff2', 'fonts/KaTeX_Size4-Regular.woff2', 'fonts/KaTeX_AMS-Regular.woff2', 'fonts/KaTeX_Caligraphic-Regular.woff2', 'fonts/KaTeX_Fraktur-Regular.woff2', 'fonts/KaTeX_SansSerif-Regular.woff2', 'fonts/KaTeX_Script-Regular.woff2', 'fonts/KaTeX_Typewriter-Regular.woff2', 'fonts/KaTeX_Main-Bold.woff2', 'fonts/KaTeX_Main-Italic.woff2', 'fonts/KaTeX_Math-Regular.woff2']
  },
  {
    from: path.join(root, 'node_modules', 'pdfjs-dist', 'build'),
    to: path.join(vendorDir, 'pdfjs'),
    files: ['pdf.min.js', 'pdf.worker.min.js']
  },
  {
    from: path.join(root, 'node_modules', 'pdfjs-dist', 'web'),
    to: path.join(vendorDir, 'pdfjs'),
    files: ['pdf_viewer.css']
  }
];

fs.rmSync(vendorDir, { recursive: true, force: true });
fs.mkdirSync(vendorDir, { recursive: true });

for (const target of targets) {
  fs.mkdirSync(target.to, { recursive: true });
  for (const file of target.files) {
    const src = path.join(target.from, file);
    const dest = path.join(target.to, file);
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      console.log(`copied ${file}`);
    } else {
      console.warn(`missing vendor source: ${src}`);
    }
  }
}

console.log('vendor assets ready');
