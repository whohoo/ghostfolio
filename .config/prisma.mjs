import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

expand(config({ quiet: true }));

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL
  },
  migrations: {
    path: join(__dirname, '..', 'prisma', 'migrations'),
    seed: `node ${join(__dirname, '..', 'prisma', 'seed.mts')}`
  },
  schema: join(__dirname, '..', 'prisma', 'schema.prisma')
});
