import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'statelint-api' });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`StateLint API running on port ${PORT}`);
  });
}

export default app;
