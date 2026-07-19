console.log('STEP 1: start.js began executing');
console.log('__dirname is:', __dirname);

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.join(__dirname, 'backend');
console.log('STEP 2: backendDir resolved to:', backendDir);
console.log('STEP 3: does backendDir exist?', fs.existsSync(backendDir));

if (fs.existsSync(backendDir)) {
  console.log('STEP 4: contents of backendDir:', fs.readdirSync(backendDir));
}

const serverPath = path.join(backendDir, 'server.js');
console.log('STEP 5: serverPath resolved to:', serverPath);
console.log('STEP 6: does server.js exist?', fs.existsSync(serverPath));

try {
  console.log('STEP 7: running npm install...');
  execSync('npm install', { cwd: backendDir, stdio: 'inherit' });
  console.log('STEP 8: npm install finished successfully');
} catch (err) {
  console.error('STEP 7 FAILED: npm install threw an error:', err.message);
  process.exit(1);
}

console.log('STEP 9: about to require server.js');
require(serverPath);
