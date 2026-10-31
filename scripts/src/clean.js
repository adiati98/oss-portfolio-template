const fs = require('fs');
const path = require('path');

const targets = [
  'data',
  'contributions/markdown-generated',
  'contributions/html-generated',
  '.github/workflows/demo-site.yml',
];

const cleanFolder = (dirPath, isRoot = true) => {
  if (!fs.existsSync(dirPath)) return;

  const stats = fs.statSync(dirPath);

  // Handle individual files in the targets array
  if (stats.isFile()) {
    fs.unlinkSync(dirPath);
    console.log(`🗑️ Deleted File: ${dirPath}`);
    return;
  }

  // If it's a directory, proceed with cleaning
  const items = fs.readdirSync(dirPath);

  items.forEach((item) => {
    const fullPath = path.join(dirPath, item);

    if (fs.statSync(fullPath).isDirectory()) {
      cleanFolder(fullPath, false);
      if (fs.readdirSync(fullPath).length === 0) {
        fs.rmdirSync(fullPath);
        console.log(`📂 Removed Folder: ${fullPath}`);
      }
    } else {
      if (isRoot && item === '.gitkeep') {
        return;
      }
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Deleted File: ${fullPath}`);
    }
  });
};

console.log('🧹 Deep cleaning generated folders...');
targets.forEach((target) => {
  const resolvedPath = path.resolve(target);
  cleanFolder(resolvedPath, true);
});
console.log('✨ Clean complete! Root folders and .gitkeep files preserved.');
