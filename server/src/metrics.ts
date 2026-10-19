import { Registry, collectDefaultMetrics, Histogram, Counter } from 'prom-client';
import { RequestHandler } from 'express';

/** Prometheus metrics exposed at /metrics. */
export function createMetrics() {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });

  const httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request latency',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.3, 1, 3],
    registers: [registry],
  });

  const samplesAdvanced = new Counter({
    name: 'labtrack_samples_advanced_total',
    help: 'Sample status changes by target status',
    labelNames: ['status'],
    registers: [registry],
  });

  const middleware: RequestHandler = (req, res, next) => {
    const end = httpDuration.startTimer();
    res.on('finish', () => {
      end({ method: req.method, route: req.route?.path ?? req.path, status: String(res.statusCode) });
    });
    next();
  };

  return { registry, middleware, samplesAdvanced };
}
