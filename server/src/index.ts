import path from 'node:path';
import { Pool } from 'pg';
import { createApp } from './app';
import { InMemorySampleRepository } from './repository/InMemorySampleRepository';
import { PostgresSampleRepository } from './repository/PostgresSampleRepository';
import { SampleRepository } from './repository/SampleRepository';

async function main() {
  let repo: SampleRepository;
  if (process.env.DATABASE_URL) {
    const pg = new PostgresSampleRepository(new Pool({ connectionString: process.env.DATABASE_URL }));
    await pg.migrate();
    repo = pg;
  } else {
    repo = new InMemorySampleRepository();
    console.warn('DATABASE_URL not set: using in-memory storage');
  }
  const staticDir = process.env.STATIC_DIR ?? path.resolve(__dirname, '../../web/dist');
  const port = Number(process.env.PORT ?? 3000);
  createApp({ repo, staticDir }).listen(port, () => console.log(`LabTrack listening on :${port}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
