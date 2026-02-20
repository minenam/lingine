import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const filePath = 'next-env.d.ts';
const devImport = 'import "./.next/dev/types/routes.d.ts";';
const stableImport = 'import "./.next/types/routes.d.ts";';

if (!existsSync(filePath)) {
  process.exit(0);
}

const original = readFileSync(filePath, 'utf8');
const normalized = original.replace(devImport, stableImport);

if (normalized !== original) {
  writeFileSync(filePath, normalized, 'utf8');
  process.stdout.write('stabilized next-env.d.ts\n');
}
