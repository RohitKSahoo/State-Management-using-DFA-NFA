import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);
app.use('/', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'statelint-api' });
});

async function ensureSeedData() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const { seedDatabase } = await import('./seedData.js');
    const prisma = new PrismaClient();
    await seedDatabase(prisma);
    await prisma.$disconnect();
  } catch (err) {
    console.error('Failed to auto-seed database:', err);
  }
}

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, async () => {
    console.log(`StateLint API running on port ${PORT}`);
    await ensureSeedData();
  });
}

export default app;
