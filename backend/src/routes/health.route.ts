import { Router, type Request, type Response } from 'express';
import { getSimpleHealth, getHealthReport } from '../recovery/health-check';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const health = await getSimpleHealth();
  const env = process.env.NODE_ENV || 'development';
  res.json({
    status: health.status,
    timestamp: health.timestamp,
    environment: env,
    database: health.database,
  });
});

router.get('/detailed', async (_req: Request, res: Response) => {
  const report = await getHealthReport();
  const statusCode = report.status === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json(report);
});

router.get('/sources', async (_req: Request, res: Response) => {
  const report = await getHealthReport();
  const sources = report.components.filter(c =>
    ['Google Maps', 'JustDial', 'IndiaMART', 'Clutch', 'Website Enrichment'].includes(c.name)
  );
  res.json({ success: true, data: sources });
});

router.get('/workers', async (_req: Request, res: Response) => {
  const report = await getHealthReport();
  const workers = report.components.find(c => c.name === 'Workers');
  res.json({ success: true, data: workers });
});

export default router;
