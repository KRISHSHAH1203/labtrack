import express, { ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { ZodError } from 'zod';
import { ConflictError, InvalidTransitionError, NotFoundError } from './domain/sample';
import { SampleRepository } from './repository/SampleRepository';
import { SampleService } from './service';
import { sampleRoutes } from './routes/samples';
import { graphqlHandler } from './graphql';
import { createMetrics } from './metrics';

export interface AppOptions {
  repo: SampleRepository;
  staticDir?: string;
  rateLimitPerMinute?: number;
}

export function createApp({ repo, staticDir, rateLimitPerMinute = 300 }: AppOptions) {
  const app = express();
  const service = new SampleService(repo);
  const metrics = createMetrics();

  // Security: secure headers, body size cap, and rate limiting on the API.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: '100kb' }));
  app.use(metrics.middleware);
  app.use('/api', rateLimit({ windowMs: 60_000, limit: rateLimitPerMinute, standardHeaders: true, legacyHeaders: false }));

  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', metrics.registry.contentType);
    res.send(await metrics.registry.metrics());
  });

  app.use('/api/samples', sampleRoutes(service, (s) => metrics.samplesAdvanced.inc({ status: s })));
  app.all('/graphql', graphqlHandler(service));

  if (staticDir) {
    app.use(express.static(staticDir));
    app.get('*', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }

  // One place that maps domain errors to HTTP status codes.
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) return res.status(400).json({ error: 'ValidationError', details: err.issues });
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    if (err instanceof ConflictError) return res.status(409).json({ error: err.message });
    if (err instanceof InvalidTransitionError) return res.status(422).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  };
  app.use(errorHandler);

  return app;
}
