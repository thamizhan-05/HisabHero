import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

console.log('pdfParse is:', typeof pdfParse, pdfParse);
process.exit(0);
