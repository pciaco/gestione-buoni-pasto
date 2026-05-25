import { readFileSync } from 'node:fs';
import { PDFParse } from 'pdf-parse';

const path = process.argv[2];
if (!path) {
	console.error('Uso: node scripts/test-parse.mjs <file.pdf>');
	process.exit(1);
}

const buffer = readFileSync(path);
const parser = new PDFParse({ data: buffer });
const result = await parser.getText();
await parser.destroy();

const codes = [];
const codeRe = /CODICE\s*\n(\d{14})/g;
let m;
while ((m = codeRe.exec(result.text)) !== null) codes.push(m[1]);

console.log('Buoni trovati:', codes.length);
codes.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
