const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

const dirPath = path.join(__dirname, 'sample-files');
const filePath = path.join(dirPath, 'sample.txt');
const content = 'Hello, async world!';

// Setup programmatically
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}
fs.writeFileSync(filePath, content, 'utf8');

/*
 * Callback Hell Example:
 * fs.readFile('file1.txt', (err, d1) => {
 *   fs.readFile('file2.txt', (err, d2) => {
 *     fs.readFile('file3.txt', (err, d3) => {
 *       console.log(d1, d2, d3);
 *     });
 *   });
 * });
 */

// 1. Callback Style
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) return console.error(err);
  console.log(`Callback: ${data}`);

  // 2. Promise Style
  fsPromises
    .readFile(filePath, 'utf8')
    .then((data) => {
      console.log(`Promise: ${data}`);
      return runAsyncAwait();
    })
    .catch((err) => console.error(err));
});

// 3. Async/Await Style
async function runAsyncAwait() {
  try {
    const data = await fsPromises.readFile(filePath, 'utf8');
    console.log(`Async/Await: ${data}`);
  } catch (err) {
    console.error(err);
  }
}
