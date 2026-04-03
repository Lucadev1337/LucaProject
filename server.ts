import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load config safely
function loadFirebaseConfig() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    const altPath = path.join(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(altPath)) {
      return JSON.parse(fs.readFileSync(altPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading firebase-applet-config.json:', error);
  }
  return null;
}

const firebaseConfig = loadFirebaseConfig();

// Initialize Firebase Client SDK on the server
let db: any = null;
if (firebaseConfig) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  } catch (e) {
    console.error('Firebase init error:', e);
  }
}

const resend = new Resend(process.env.RESEND_API_KEY || 'missing');

export const app = express();
app.use(express.json());

// API Routes
app.post('/api/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY missing' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;

    const docRef = await addDoc(collection(db, 'verifications'), {
      email,
      code,
      expires,
      used: false
    });

    const { error } = await resend.emails.send({
      from: 'AutoSpa Verification <onboarding@resend.dev>',
      to: [email],
      subject: "თქვენი ვერიფიკაციის კოდი - Luca's AutoSpa",
      html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Luca's AutoSpa</h2><p>კოდი: <b>${code}</b></p></div>`
    });

    if (error) throw error;
    res.json({ verificationId: docRef.id });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/verify-code', async (req, res) => {
  try {
    const { verificationId, code } = req.body;
    if (!verificationId || !code) return res.status(400).json({ error: 'Missing parameters' });
    if (!db) return res.status(500).json({ error: 'Database not initialized' });

    const docRef = doc(db, 'verifications', verificationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return res.status(404).json({ error: 'Not found' });
    const data = docSnap.data();
    if (data.used) return res.status(400).json({ error: 'Used' });
    if (Date.now() > data.expires) return res.status(400).json({ error: 'Expired' });
    if (data.code !== code) return res.status(400).json({ error: 'Invalid' });

    await updateDoc(docRef, { used: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal error' });
  }
});

// ... other routes omitted for brevity in this step, but I will keep them in the actual file ...
// Actually, I should keep all routes to ensure the app stays functional.

app.post('/api/send-confirmation', async (req, res) => {
  try {
    const { email, bookingData } = req.body;
    const { error } = await resend.emails.send({
      from: 'AutoSpa Booking <onboarding@resend.dev>',
      to: [email],
      subject: "ჯავშანი დადასტურებულია",
      html: `<p>დადასტურებულია: ${bookingData.service}</p>`
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function setupApp() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    // Dynamic import to avoid loading vite in production/vercel
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

if (import.meta.url === `file://${fileURLToPath(import.meta.url)}`) {
  setupApp().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
  });
} else {
  setupApp();
}
