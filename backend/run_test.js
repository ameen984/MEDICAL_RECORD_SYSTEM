const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('set NODE_ENV=test&& npx jest src/routes/__tests__/pdfExport.test.ts --forceExit');
  fs.writeFileSync('jest_log.txt', out.toString());
} catch(e) {
  fs.writeFileSync('jest_log.txt', "STDOUT:\n" + (e.stdout ? e.stdout.toString() : '') + "\nSTDERR:\n" + (e.stderr ? e.stderr.toString() : ''));
}
