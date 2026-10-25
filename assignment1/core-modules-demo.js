const os = require('os');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

const sampleFilePath = path.join(sampleFilesDir, 'demo.txt');

// OS module
console.log('Platform:', os.platform());
console.log('CPU:', os.cpus()[0].model);
console.log('Total Memory:', os.totalmem());

// Path module (Notice lower-case 'path' to match /Joined path:/)
console.log('Joined path:', sampleFilePath);
console.log('Extension:', path.extname(sampleFilePath));
console.log('Basename:', path.basename(sampleFilePath));

// fs.promises API
async function demoFsPromises() {
  try {
    await fsPromises.writeFile(sampleFilePath, 'Hello, async world!', 'utf8');
    const data = await fsPromises.readFile(sampleFilePath, 'utf8');
    console.log('fs.promises read:', data);
  } catch (err) {
    console.error('fs.promises error:', err);
  }
}

// Streams for large files
function demoStreams() {
  const readStream = fs.createReadStream(sampleFilePath, {
    encoding: 'utf8',
    highWaterMark: 64,
  });

  readStream.on('data', (chunk) => {
    console.log('Stream chunk (first 40 chars):', chunk.slice(0, 40));
  });

  readStream.on('error', (err) => {
    console.error('Stream error:', err);
  });
}

async function run() {
  await demoFsPromises();
  demoStreams();
}

run();
