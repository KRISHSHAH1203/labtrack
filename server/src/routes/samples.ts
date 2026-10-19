import { Router } from 'express';
import { SampleService } from '../service';
import { advanceSchema, createSampleSchema, listQuerySchema } from '../validation';

export function sampleRoutes(service: SampleService, onAdvance: (status: string) => void): Router {
  const router = Router();

  router.post('/', async (req, res, next) => {
    try {
      const sample = await service.register(createSampleSchema.parse(req.body));
      res.status(201).json(sample);
    } catch (e) { next(e); }
  });

  router.get('/', async (req, res, next) => {
    try {
      res.json(await service.list(listQuerySchema.parse(req.query)));
    } catch (e) { next(e); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      res.json(await service.get(req.params.id));
    } catch (e) { next(e); }
  });

  router.patch('/:id/status', async (req, res, next) => {
    try {
      const { status } = advanceSchema.parse(req.body);
      const sample = await service.advance(req.params.id, status);
      onAdvance(status);
      res.json(sample);
    } catch (e) { next(e); }
  });

  return router;
}
