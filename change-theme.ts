import fs from 'fs';
import path from 'path';

const replacements = [
  { p: /bg-\[#080809\]/g, r: 'bg-slate-50' },
  { p: /bg-\[#0c0c0e\]/g, r: 'bg-white' },
  { p: /bg-\[#121214\]/g, r: 'bg-white' },
  { p: /bg-\[#0a0a0c\]/g, r: 'bg-white' },
  { p: /text-white/g, r: 'text-slate-900' },
  { p: /text-slate-200/g, r: 'text-slate-700' },
  { p: /text-slate-300/g, r: 'text-slate-600' },
  { p: /text-slate-400/g, r: 'text-slate-500' },
  { p: /border-white\/5/g, r: 'border-slate-200' },
  { p: /border-white\/10/g, r: 'border-slate-200' },
  { p: /border-white\/20/g, r: 'border-slate-300' },
  { p: /hover:bg-white\/5/g, r: 'hover:bg-slate-100' },
  { p: /hover:bg-white\/10/g, r: 'hover:bg-slate-200' },
  { p: /hover:bg-white\/\[0\.02\]/g, r: 'hover:bg-slate-50' },
  { p: /hover:text-white/g, r: 'hover:text-slate-900' },
  { p: /bg-white\/5/g, r: 'bg-slate-100' },
  { p: /bg-white\/10/g, r: 'bg-slate-200' },
  { p: /bg-black\/20/g, r: 'bg-slate-100' },
  { p: /bg-black\/30/g, r: 'bg-slate-50' },
  { p: /bg-black\/60/g, r: 'bg-slate-900/40' },
  { p: /bg-black\/80/g, r: 'bg-slate-900/40' },
  { p: /border-transparent hover:border-white\/5/g, r: 'border-transparent hover:border-slate-200' }
];

function processDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Additional replacements for things we want to make sure it looks fine
      content = content.replace(/shadow-xl/g, 'shadow-md');
      content = content.replace(/shadow-2xl/g, 'shadow-lg');
      content = content.replace(/color-scheme: dark;/g, 'color-scheme: light;');

      replacements.forEach(({p, r}) => {
        content = content.replace(p, r);
      });
      fs.writeFileSync(fullPath, content);
      console.log('Processed', fullPath);
    }
  }
}

processDir('src');
