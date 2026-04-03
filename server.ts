import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

// Initialize Firebase Client SDK on the server
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
const resend = new Resend(process.env.RESEND_API_KEY);

export const app = express();
app.use(express.json());

// API Routes
app.post('/api/send-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  try {
    const docRef = await addDoc(collection(db, 'verifications'), {
      email,
      code,
      expires,
      used: false
    });

    const { data, error } = await resend.emails.send({
      from: 'AutoSpa Verification <onboarding@resend.dev>',
      to: [email],
      subject: "თქვენი ვერიფიკაციის კოდი - Luca's AutoSpa",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb;">Luca's AutoSpa</h2>
          <p>მოგესალმებით, თქვენი ჯავშნის დასასრულებლად გამოიყენეთ შემდეგი კოდი:</p>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e293b; border-radius: 8px;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">კოდი ძალაშია 10 წუთის განმავლობაში.</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    res.json({ verificationId: docRef.id });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/verify-code', async (req, res) => {
  const { verificationId, code } = req.body;
  if (!verificationId || !code) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const docRef = doc(db, 'verifications', verificationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    const data = docSnap.data();
    if (data.used) {
      return res.status(400).json({ error: 'Code already used' });
    }
    if (Date.now() > data.expires) {
      return res.status(400).json({ error: 'Code expired' });
    }
    if (data.code !== code) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    await updateDoc(docRef, { used: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/send-confirmation', async (req, res) => {
  const { email, bookingData } = req.body;
  if (!email || !bookingData) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const { data, error } = await resend.emails.send({
      from: 'AutoSpa Booking <onboarding@resend.dev>',
      to: [email],
      subject: "ჯავშანი დადასტურებულია - Luca's AutoSpa",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb;">Luca's AutoSpa</h2>
          <p>მოგესალმებით ${bookingData.customerName}, თქვენი ჯავშანი წარმატებით დადასტურდა!</p>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">ჯავშნის დეტალები:</h3>
            <p><strong>სერვისი:</strong> ${bookingData.service === 'Premium' ? 'პრემიუმ დითეილინგი' : 'სტანდარტული წმენდა'}</p>
            <p><strong>თარიღი:</strong> ${bookingData.date}</p>
            <p><strong>დრო:</strong> ${bookingData.timeSlot}</p>
            <p><strong>მისამართი:</strong> ${bookingData.location}</p>
            <p><strong>ტელეფონი:</strong> ${bookingData.phone}</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">მადლობა ნდობისთვის! ჩვენ მალე დაგიკავშირდებით.</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend confirmation error:', error);
      return res.status(500).json({ error: 'Failed to send confirmation email' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Confirmation email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/send-review-request', async (req, res) => {
  const { email, customerName } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    const { data, error } = await resend.emails.send({
      from: 'AutoSpa <onboarding@resend.dev>',
      to: [email],
      subject: "როგორ მოგეწონათ ჩვენი სერვისი? - Luca's AutoSpa",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb;">Luca's AutoSpa</h2>
          <p>მოგესალმებით ${customerName || 'მომხმარებელო'},</p>
          <p>იმედია კმაყოფილი დარჩით ჩვენი სერვისით. თქვენი აზრი ჩვენთვის ძალიან მნიშვნელოვანია!</p>
          <p>გთხოვთ, დაგვიტოვოთ შეფასება Google-ზე, რაც დაგვეხმარება სერვისის გაუმჯობესებაში:</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://g.page/r/Cc7gXgecIBlIEBM/review" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">შეფასების დატოვება</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">წინასწარ გიხდით მადლობას!</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend review request error:', error);
      return res.status(500).json({ error: 'Failed to send review request email' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Review request email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function setupApp() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
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

// Only start the server if this file is run directly (not as a module)
if (import.meta.url === `file://${fileURLToPath(import.meta.url)}`) {
  setupApp().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
} else {
  // On Vercel, we need to ensure setupApp is called
  setupApp();
}
