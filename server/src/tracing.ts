/**
 * OpenTelemetry bootstrap. Loaded with `node -r ./dist/tracing.js` so HTTP, Express
 * and pg calls are traced automatically. Set OTEL_EXPORTER_OTLP_ENDPOINT to send
 * traces to a collector (Jaeger, Tempo, etc.).
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';

if (process.env.OTEL_ENABLED !== 'false') {
  const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'labtrack-api',
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation(), new PgInstrumentation()],
  });
  sdk.start();
  process.on('SIGTERM', () => { sdk.shutdown().finally(() => process.exit(0)); });
}
