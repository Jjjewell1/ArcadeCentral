import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prowlarrRoutes from './routes/prowlarr.js';
import romarrRoutes from './routes/romarr.js';
import rommRoutes from './routes/romm.js';
import qbitRoutes from './routes/qbit.js';
import sabnzbdRoutes from './routes/sabnzbd.js';
import questarrRoutes from './routes/questarr.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/prowlarr', prowlarrRoutes);
app.use('/api/romarr', romarrRoutes);
app.use('/api/romm', rommRoutes);
app.use('/api/qbit', qbitRoutes);
app.use('/api/sabnzbd', sabnzbdRoutes);
app.use('/api/questarr', questarrRoutes);

app.listen(PORT, () => {
  console.log(`Arcade Central API running on port ${PORT}`);
});
