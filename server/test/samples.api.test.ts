import request from 'supertest';
import { createApp } from '../src/app';
import { InMemorySampleRepository } from '../src/repository/InMemorySampleRepository';

const newApp = (limit?: number) => createApp({ repo: new InMemorySampleRepository(), rateLimitPerMinute: limit });

describe('REST /api/samples', () => {
  it('registers a sample and fetches it', async () => {
    const app = newApp();
    const created = await request(app).post('/api/samples').send({ code: 'S-001', studyId: 'TOX-12', type: 'Plasma' });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('RECEIVED');
    const fetched = await request(app).get(`/api/samples/${created.body.id}`);
    expect(fetched.body.code).toBe('S-001');
  });

  it('rejects invalid input with 400', async () => {
    const res = await request(newApp()).post('/api/samples').send({ code: 'bad code!', studyId: '', type: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it('rejects duplicate codes with 409', async () => {
    const app = newApp();
    await request(app).post('/api/samples').send({ code: 'S-002', studyId: 'TOX-12', type: 'Plasma' });
    const dup = await request(app).post('/api/samples').send({ code: 'S-002', studyId: 'TOX-12', type: 'Plasma' });
    expect(dup.status).toBe(409);
  });

  it('enforces the status workflow', async () => {
    const app = newApp();
    const { body } = await request(app).post('/api/samples').send({ code: 'S-003', studyId: 'TOX-12', type: 'Serum' });
    const skip = await request(app).patch(`/api/samples/${body.id}/status`).send({ status: 'COMPLETED' });
    expect(skip.status).toBe(422);
    await request(app).patch(`/api/samples/${body.id}/status`).send({ status: 'IN_ANALYSIS' }).expect(200);
    const done = await request(app).patch(`/api/samples/${body.id}/status`).send({ status: 'COMPLETED' });
    expect(done.body.status).toBe('COMPLETED');
  });

  it('filters and paginates', async () => {
    const app = newApp();
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/samples').send({ code: `A-00${i}`, studyId: i < 3 ? 'STUDY-A' : 'STUDY-B', type: 'Blood' });
    }
    const page = await request(app).get('/api/samples').query({ studyId: 'STUDY-A', limit: 2, offset: 0 });
    expect(page.body.total).toBe(3);
    expect(page.body.items).toHaveLength(2);
  });

  it('returns 404 for an unknown sample', async () => {
    await request(newApp()).get('/api/samples/does-not-exist').expect(404);
  });

  it('rate limits the API', async () => {
    const app = newApp(2);
    await request(app).get('/api/samples').expect(200);
    await request(app).get('/api/samples').expect(200);
    await request(app).get('/api/samples').expect(429);
  });
});

describe('GraphQL /graphql', () => {
  it('queries samples and advances one through a mutation', async () => {
    const app = newApp();
    const { body } = await request(app).post('/api/samples').send({ code: 'G-001', studyId: 'PK-7', type: 'Urine' });

    const q = await request(app).post('/graphql').send({ query: '{ samples(studyId: "PK-7") { total items { code status } } }' });
    expect(q.body.data.samples.total).toBe(1);

    const m = await request(app).post('/graphql').send({
      query: 'mutation($id: ID!) { advanceSample(id: $id, status: IN_ANALYSIS) { status } }',
      variables: { id: body.id },
    });
    expect(m.body.data.advanceSample.status).toBe('IN_ANALYSIS');
  });
});

describe('observability and security', () => {
  it('exposes health and Prometheus metrics', async () => {
    const app = newApp();
    await request(app).get('/healthz').expect(200);
    const m = await request(app).get('/metrics');
    expect(m.text).toContain('http_request_duration_seconds');
  });

  it('sets secure headers', async () => {
    const res = await request(newApp()).get('/healthz');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
