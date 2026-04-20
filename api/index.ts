import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import * as ics from 'ics';
import { Resend } from 'resend';
import { serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';

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

const CALENDAR_SECRET = "7f8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z";

export const app = express();
app.use(express.json());

// API Routes
app.post('/api/send-verification-email', async (req, res) => {
  try {
    const { email, lang } = req.body;
    if (!db) throw new Error('Database not initialized');

    const pricingSnap = await getDoc(doc(db, 'settings', 'pricing'));
    if (!pricingSnap.exists()) throw new Error('Pricing settings not found');
    const pricing = pricingSnap.data();

    if (!pricing.resendApiKey) throw new Error('Resend API key not configured');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const resend = new Resend(pricing.resendApiKey);

    // Save code to Firestore (expiring in 10 mins)
    await setDoc(doc(db, 'verification_codes', email), {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    const subject = lang === 'GE' ? 'ვერიფიკაციის კოდი - Luca\'s AutoSpa' : 'Verification Code - Luca\'s AutoSpa';
    const text = lang === 'GE' 
      ? `თქვენი ვერიფიკაციის კოდია: ${code}` 
      : `Your verification code is: ${code}`;

    await resend.emails.send({
      from: pricing.resendSenderEmail || 'onboarding@resend.dev',
      to: email,
      subject: subject,
      text: text,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Send verification email error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/verify-email-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!db) throw new Error('Database not initialized');

    const docRef = doc(db, 'verification_codes', email);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Verification code expired or not found');
    }

    const data = docSnap.data();
    if (data.expiresAt < Date.now()) {
      await deleteDoc(docRef);
      throw new Error('Verification code expired');
    }

    if (data.code !== code) {
      throw new Error('Invalid verification code');
    }

    // Success - delete the code
    await deleteDoc(docRef);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/send-otp', async (req, res) => {
  try {
    const { phone, lang, method, email } = req.body;
    if (!db) throw new Error('Database not initialized');

    const pricingSnap = await getDoc(doc(db, 'settings', 'pricing'));
    if (!pricingSnap.exists()) throw new Error('Pricing settings not found');
    const pricing = pricingSnap.data();

    // Verification Logic for different methods
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationKey = method === 'email' ? email : phone;
    
    // Save code to Firestore (expiring in 10 mins)
    await setDoc(doc(db, 'verification_codes', verificationKey), {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    const message = lang === 'GE' 
      ? `თქვენი ვერიფიკაციის კოდია: ${code}` 
      : `Your verification code is: ${code}`;

    if (method === 'email') {
      if (!pricing.resendApiKey) throw new Error('Email verification not configured');
      const resend = new Resend(pricing.resendApiKey);
      await resend.emails.send({
        from: pricing.resendSenderEmail || 'onboarding@resend.dev',
        to: email,
        subject: lang === 'GE' ? 'ვერიფიკაციის კოდი' : 'Verification Code',
        text: message,
      });
    } else if (method === 'viber' || method === 'whatsapp') {
      const vResponse = await sendMultiChannelHelper(pricing, phone, message, method);
      const vData = vResponse.ok ? {} : await (vResponse as Response).json().catch(() => ({}));
      if (!vResponse.ok) {
        console.error('Provider error:', vData);
        throw new Error('Failed to reach verification provider');
      }
    } else {
      throw new Error('Invalid verification method');
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Send SMS OTP error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const { key, code } = req.body;
    if (!db) throw new Error('Database not initialized');

    const docRef = doc(db, 'verification_codes', key);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Verification code expired or not found');
    }

    const data = docSnap.data();
    if (data.expiresAt < Date.now()) {
      await deleteDoc(docRef);
      throw new Error('Verification code expired');
    }

    if (data.code !== code) {
      throw new Error('Invalid verification code');
    }

    // Success
    await deleteDoc(docRef);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/send-email', async (req, res) => {
  try {
    const { email, subject, message } = req.body;
    if (!db) throw new Error('Database not initialized');

    const pricingSnap = await getDoc(doc(db, 'settings', 'pricing'));
    if (!pricingSnap.exists()) throw new Error('Pricing settings not found');
    const pricing = pricingSnap.data();

    if (!pricing.resendApiKey) throw new Error('Resend API key not configured');

    const resend = new Resend(pricing.resendApiKey);

    await resend.emails.send({
      from: pricing.resendSenderEmail || 'onboarding@resend.dev',
      to: email,
      subject: subject,
      text: message,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Send email error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notify-booking', async (req, res) => {
  try {
    const { bookingData, price, bookingId, promoCode } = req.body;
    const serviceName = bookingData.service === 'Premium' ? 'პრემიუმ დითეილინგი' : 'სტანდარტული წმენდა';
    
    // Add the system secret to the booking so it's visible to the calendar feed
    if (bookingId && db) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          calendarSecret: CALENDAR_SECRET
        });
      } catch (e) {
        console.error('Failed to add calendar secret to booking', e);
      }
    }
    
    // Send WhatsApp Notification to Admin
    if (db) {
      try {
        const pricingSnap = await getDoc(doc(db, 'settings', 'pricing'));
        if (pricingSnap.exists()) {
          const pricing = pricingSnap.data();
          if (pricing.isWhatsappEnabled && pricing.whatsappNumber && pricing.whatsappApiKey) {
            const promoInfo = promoCode ? `\n🎟 პრომო: ${promoCode}` : '';
            const carInfo = bookingData.carModel ? `\n🚗 მანქანა: ${bookingData.carModel}` : '';
            const contactInfo = bookingData.phone ? `📞 ტელ: ${bookingData.phone}` : `📧 Email: ${bookingData.email}`;
            const message = `🚗 *ახალი ჯავშანი!* \n\n👤 კლიენტი: ${bookingData.customerName}${carInfo}\n${contactInfo}\n🛠 სერვისი: ${serviceName}\n📅 თარიღი: ${bookingData.date}\n⏰ დრო: ${bookingData.timeSlot}\n📍 მისამართი: ${bookingData.location}\n💰 ფასი: ${price}₾${promoInfo}`;
            
            const whatsappUrl = `https://api.callmebot.com/whatsapp.php?phone=${pricing.whatsappNumber.replace('+', '')}&text=${encodeURIComponent(message)}&apikey=${pricing.whatsappApiKey}`;
            
            await fetch(whatsappUrl);
            console.log('WhatsApp notification sent');
          }
        }
      } catch (e) {
        console.error('Failed to send WhatsApp notification', e);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/calendar.ics', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });

    // Fetch all pending and completed bookings using the system secret to bypass admin rules
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('status', 'in', ['pending', 'completed']),
      where('calendarSecret', '==', CALENDAR_SECRET),
      orderBy('date', 'desc'),
      limit(1000)
    );
    const bookingsSnap = await getDocs(bookingsQuery);
    
    const events: ics.EventAttributes[] = bookingsSnap.docs.map(doc => {
      const data = doc.data();
      const [year, month, day] = data.date.split('-').map(Number);
      const [hour, minute] = data.timeSlot.split(':').map(Number);
      
      const serviceName = data.service === 'Premium' ? 'ინტერიერის პრემიუმ დითეილინგი' : 'ინტერიერის წმენდა';
      
      return {
        start: [year, month, day, hour, minute],
        duration: { hours: 3 },
        title: `${serviceName} - ${data.customerName}`,
        description: `Customer: ${data.customerName}\nPhone: ${data.phone}\nService: ${serviceName}\nLocation: ${data.location}`,
        location: data.location,
        status: data.status === 'pending' ? 'TENTATIVE' : 'CONFIRMED',
        categories: ['AutoSpa', 'Booking'],
        organizer: { name: "Luca's AutoSpa", email: 'hello@lucasautospa.ge' }
      };
    });

    if (events.length === 0) {
      // Return an empty calendar if no events
      const { error, value } = ics.createEvents([{
        start: [2024, 1, 1, 0, 0],
        duration: { hours: 0 },
        title: 'No Bookings Yet',
        description: 'Your calendar is empty.'
      }]);
      if (error) throw error;
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
      return res.send(value);
    }

    const { error, value } = ics.createEvents(events);
    if (error) throw error;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
    res.send(value);
  } catch (error: any) {
    console.error('Calendar Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const sendMultiChannelHelper = async (pricing: any, phone: string, message: string, method: string) => {
  const provider = pricing.smsProvider || 'smsto'; // Default to international SMS.to
  const senderId = pricing.smsSender || 'AutoSpa';

  if (method === 'email') return { ok: true }; // Handled separately

  if (method === 'whatsapp') {
    // Priority 1: SMS.to (International)
    if (provider === 'smsto' && pricing.smsApiKey) {
      return fetch(`https://api.sms.to/whatsapp/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${pricing.smsApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, to: phone, sender_id: senderId })
      });
    }

    // Priority 2: Twilio
    if (provider === 'twilio' && pricing.twilioSid && pricing.twilioToken) {
       const auth = Buffer.from(`${pricing.twilioSid}:${pricing.twilioToken}`).toString('base64');
       const params = new URLSearchParams();
       params.append('To', `whatsapp:${phone}`);
       params.append('From', `whatsapp:${pricing.twilioFrom}`);
       params.append('Body', message);
       return fetch(`https://api.twilio.com/2010-04-01/Accounts/${pricing.twilioSid}/Messages.json`, {
         method: 'POST',
         headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
         body: params
       });
    }
  }

  if (method === 'viber') {
    // SMS.to implementation for Viber
    if (provider === 'smsto' && pricing.smsApiKey) {
       return fetch(`https://api.sms.to/viber/send`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${pricing.smsApiKey}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ message, to: phone, sender_id: senderId })
       });
    }
    
    // Vonage
    if (provider === 'vonage' && pricing.vonageApiKey && pricing.vonageApiSecret) {
       // Vonage Messages API for Viber
       const auth = Buffer.from(`${pricing.vonageApiKey}:${pricing.vonageApiSecret}`).toString('base64');
       return fetch(`https://api.nexmo.com/v1/messages`, {
         method: 'POST',
         headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({
           from: { type: 'viber', number: senderId },
           to: { type: 'viber', number: phone.replace('+', '') },
           message: { content: { type: 'text', text: message } }
         })
       });
    }
  }

  throw new Error('No international provider configured for this method (Viber/WhatsApp)');
};

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
