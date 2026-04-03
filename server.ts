import { fileURLToPath } from 'url';
import app from './api/index.js';

if (import.meta.url === `file://${fileURLToPath(import.meta.url)}`) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
