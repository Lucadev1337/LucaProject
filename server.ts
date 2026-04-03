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

// Load Firebase Config
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } else {
    // Try relative to __dirname
    const altPath = path.join(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(altPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(altPath, 'utf8'));
    }
  }
} catch (error) {
  console.error('CRITICAL: Failed to load firebase-applet-config.json:', error);
}

// Initialize Firebase
let db: any = null;
if (firebaseConfig) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log('Firebase Initialized Successfully');
  } catch (e) {
    console.error('CRITICAL: Firebase init error:', e);
  }
} else {
  console.error('CRITICAL: Firebase configuration missing!');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const app = express();
app.use(express.json());

// API Routes
app.post('/api/send-verification', async (req, res) => {
  console.log('POST /api/send-verification received');
  try {
    const { email } = req.body;
    if (!email) {
      console.warn('Email missing in request body');
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!db) {
      console.error('Database not initialized at route call');
      return res.status(500).json({ error: 'Database not initialized. Check server logs for config errors.' });
    }
    
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY missing in environment');
      return res.status(500).json({ error: 'Email service not configured. RESEND_API_KEY is missing.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;

    console.log(`Generating code for ${email}`);
    
    const docRef = await addDoc(collection(db, 'verifications'), {
      email,
      code,
      expires,
      used: false
    });

    console.log(`Verification stored in Firestore with ID: ${docRef.id}`);

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
      console.error('Resend API error:', error);
      return res.status(500).json({ error: 'Failed to send email via Resend', details: error });
    }

    console.log('Verification email sent successfully');
    res.json({ verificationId: docRef.id });
  } catch (error: any) {
    console.error('CRITICAL: Route /api/send-verification failed:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/api/verify-code', async (req, res) => {
  try {
    const { verificationId, code } = req.body;
    if (!verificationId || !code) return res.status(400).json({ error: 'Missing parameters' });
    if (!db) return res.status(500).json({ error: 'Database not initialized' });

    const docRef = doc(db, 'verifications', verificationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return res.status(404).json({ error: 'Verification not found' });
    
    const data = docSnap.data();
    if (data.used) return res.status(400).json({ error: 'Code already used' });
    if (Date.now() > data.expires) return res.status(400).json({ error: 'Code expired' });
    if (data.code !== code) return res.status(400).json({ error: 'Invalid code' });

    await updateDoc(docRef, { used: true });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Verify error:', error);
    res.status(500).json({ error: error.message || 'Internal error' });
  }
});

app.post('/api/send-confirmation', async (req, res) => {
  try {
    const { email, bookingData } = req.body;
    if (!email || !bookingData) return res.status(400).json({ error: 'Missing parameters' });
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'Email service not configured' });

    const { error } = await resend.emails.send({
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

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Confirmation email error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-review-request', async (req, res) => {
  try {
    const { email, customerName } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'Email service not configured' });

    const { error } = await resend.emails.send({
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

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Review request email error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function setupApp() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
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
