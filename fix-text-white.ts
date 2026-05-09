import fs from 'fs';
import path from 'path';

function processDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix instances where text-slate-900 was placed on an indigo bg or other elements that need white text
      content = content.replace(/(bg-indigo-[0-9]+.*?)text-slate-900/g, '$1text-white');
      
      // Some other things like Sparkles logo which might be unreadable?
      content = content.replace(/text-slate-900/g, 'text-slate-900');

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('src');
