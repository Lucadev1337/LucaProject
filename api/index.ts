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
    // Try relative to __dirname (which is /api/ on Vercel)
    const altPath = path.join(__dirname, '..', 'firebase-applet-config.json');
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
}

const resend = new Resend(process.env.RESEND_API_KEY);

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

app.post('/api/send-confirmation', async (req, res) => {
  try {
    const { email, bookingData } = req.body;
    const serviceName = bookingData.service === 'Premium' ? 'პრემიუმ დითეილინგი' : 'სტანდარტული წმენდა';
    
    const { error } = await resend.emails.send({
      from: "Luca's AutoSpa <onboarding@resend.dev>",
      to: [email],
      subject: "ჯავშანი დადასტურებულია - Luca's AutoSpa",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc;">
          <div style="background-color: #ffffff; border-radius: 24px; padding: 40px; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Luca's <span style="color: #1e293b;">AutoSpa</span></h1>
              <div style="height: 4px; width: 40px; background-color: #2563eb; margin: 16px auto; border-radius: 2px;"></div>
              <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0;">ჯავშანი დადასტურებულია!</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.5;">გმადლობთ, რომ აირჩიეთ ჩვენი სერვისი. თქვენი ჯავშნის დეტალები მოცემულია ქვემოთ:</p>
            </div>

            <div style="background-color: #f1f5f9; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 40%;">სერვისი</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">თარიღი</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${bookingData.date}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">დრო</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${bookingData.timeSlot} PM</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">მისამართი</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${bookingData.location}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">სახელი</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${bookingData.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">ტელეფონი</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${bookingData.phone}</td>
                </tr>
              </table>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">თუ გსურთ ჯავშნის შეცვლა ან გაუქმება, გთხოვთ დაგვიკავშირდეთ ნომერზე: <a href="tel:+995591952473" style="color: #2563eb; text-decoration: none; font-weight: 600;">+995 591 952 473</a></p>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Luca's AutoSpa. ყველა უფლება დაცულია.</p>
          </div>
        </div>
      `
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-review-request', async (req, res) => {
  try {
    const { email, customerName } = req.body;
    const { error } = await resend.emails.send({
      from: "Luca's AutoSpa <onboarding@resend.dev>",
      to: [email],
      subject: "როგორ მოგეწონათ ჩვენი სერვისი? - Luca's AutoSpa",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc;">
          <div style="background-color: #ffffff; border-radius: 24px; padding: 40px; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; text-align: center;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Luca's <span style="color: #1e293b;">AutoSpa</span></h1>
            <div style="height: 4px; width: 40px; background-color: #2563eb; margin: 16px auto; border-radius: 2px;"></div>
            
            <h2 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">დიდი მადლობა, ${customerName}!</h2>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
              იმედი გვაქვს, კმაყოფილი დარჩით ჩვენი სერვისით და თქვენი ავტომობილი ისევ ისე ბზინავს, როგორც ახალი. 
              თქვენი აზრი ჩვენთვის ძალიან მნიშვნელოვანია.
            </p>

            <div style="margin-bottom: 40px;">
              <a href="https://g.page/r/Cc7gXgecIBlIEBM/review" style="background-color: #2563eb; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 16px; transition: background-color 0.2s;">დაგვიტოვეთ შეფასება</a>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              თქვენი გამოხმაურება გვეხმარება გავხდეთ უკეთესები და შევთავაზოთ საუკეთესო სერვისი ჩვენს მომხმარებლებს.
            </p>
            
            <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #f1f5f9;">
              <p style="color: #1e293b; font-weight: 700; margin-bottom: 4px;">საუკეთესო სურვილებით,</p>
              <p style="color: #2563eb; font-weight: 600; margin-top: 0;">Luca's AutoSpa-ს გუნდი</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Luca's AutoSpa. ყველა უფლება დაცულია.</p>
          </div>
        </div>
      `
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SPA Fallback
const setupSpa = async () => {
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
};

setupSpa();

export default app;
