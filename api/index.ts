import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import * as ics from 'ics';

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
      from: "Luca's AutoSpa <hello@lucasautospa.ge>",
      to: [email],
      subject: "თქვენი ვერიფიკაციის კოდი - Luca's AutoSpa",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc;">
          <div style="background-color: #ffffff; border-radius: 24px; padding: 48px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; text-align: center;">
            <div style="margin-bottom: 32px;">
              <img src="https://iili.io/BOm6Gaf.jpg" alt="Luca's AutoSpa Logo" style="width: 80px; height: 80px; border-radius: 20px; margin-bottom: 16px; object-fit: cover; border: 2px solid #f1f5f9;" />
              <div style="height: 4px; width: 60px; background-color: #2563eb; margin: 16px auto; border-radius: 2px;"></div>
            </div>
            
            <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">ვერიფიკაციის კოდი</h2>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">მოგესალმებით, თქვენი ჯავშნის დასასრულებლად გამოიყენეთ შემდეგი კოდი:</p>
            
            <div style="background-color: #f1f5f9; border-radius: 16px; padding: 32px; margin-bottom: 24px; text-align: center;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 48px; font-weight: 800; letter-spacing: 8px; color: #2563eb;">${code}</span>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0;">კოდი ძალაშია 10 წუთის განმავლობაში.</p>
            
            <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #f1f5f9;">
              <p style="color: #1e293b; font-weight: 700; margin-bottom: 4px; font-size: 15px;">საუკეთესო სურვილებით,</p>
              <p style="color: #2563eb; font-weight: 600; margin-top: 0; font-size: 16px;">Luca's AutoSpa-ს გუნდი</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Luca's AutoSpa. ყველა უფლება დაცულია.</p>
            <p style="color: #cbd5e1; font-size: 11px; margin-top: 8px;">ეს არის ავტომატური შეტყობინება, გთხოვთ ნუ უპასუხებთ.</p>
          </div>
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
    const { email, bookingData, price, bookingId, promoCode } = req.body;
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
    
    const { error } = await resend.emails.send({
      from: "Luca's AutoSpa <hello@lucasautospa.ge>",
      to: [email],
      subject: "ჯავშანი დადასტურებულია - Luca's AutoSpa",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc;">
          <div style="background-color: #ffffff; border-radius: 24px; padding: 48px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://iili.io/BOm6Gaf.jpg" alt="Luca's AutoSpa Logo" style="width: 80px; height: 80px; border-radius: 20px; margin-bottom: 16px; object-fit: cover; border: 2px solid #f1f5f9;" />
              <div style="height: 4px; width: 60px; background-color: #2563eb; margin: 16px auto; border-radius: 2px;"></div>
              <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">ჯავშანი დადასტურებულია!</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">გმადლობთ, რომ აირჩიეთ ჩვენი სერვისი. თქვენი ჯავშნის დეტალები მოცენულია ქვემოთ:</p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 20px; padding: 32px; margin-bottom: 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; width: 35%; border-bottom: 1px solid #f1f5f9;">სერვისი</td>
                  <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9;">ფასი</td>
                  <td style="padding: 12px 0; color: #0f172a; font-size: 18px; font-weight: 800; border-bottom: 1px solid #f1f5f9;">${price}₾ ${promoCode ? `<span style="font-size: 12px; color: #10b981; font-weight: 600;">(პრომო: ${promoCode})</span>` : ''}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9;">თარიღი</td>
                  <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${bookingData.date}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9;">დრო</td>
                  <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${bookingData.timeSlot} PM</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9;">მისამართი</td>
                  <td style="padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f1f5f9; line-height: 1.4;">${bookingData.location}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9;">სახელი</td>
                  <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${bookingData.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">ტელეფონი</td>
                  <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${bookingData.phone}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; padding: 24px; background-color: #f1f5f9; border-radius: 16px;">
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
                თუ გსურთ ჯავშნის შეცვლა ან გაუქმება, გთხოვთ დაგვიკავშირდეთ ნომერზე: 
                <br />
                <a href="tel:+995591952473" style="color: #2563eb; text-decoration: none; font-weight: 700; font-size: 16px;">+995 591 952 473</a>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Luca's AutoSpa. ყველა უფლება დაცულია.</p>
            <p style="color: #cbd5e1; font-size: 11px; margin-top: 8px;">ეს არის ავტომატური შეტყობინება, გთხოვთ ნუ უპასუხებთ.</p>
          </div>
        </div>
      `
    });

    // Send WhatsApp Notification to Admin
    if (db) {
      try {
        const pricingSnap = await getDoc(doc(db, 'settings', 'pricing'));
        if (pricingSnap.exists()) {
          const pricing = pricingSnap.data();
          if (pricing.isWhatsappEnabled && pricing.whatsappNumber && pricing.whatsappApiKey) {
            const promoInfo = promoCode ? `\n🎟 პრომო: ${promoCode}` : '';
            const message = `🚗 *ახალი ჯავშანი!* \n\n👤 კლიენტი: ${bookingData.customerName}\n📞 ტელ: ${bookingData.phone}\n🛠 სერვისი: ${serviceName}\n📅 თარიღი: ${bookingData.date}\n⏰ დრო: ${bookingData.timeSlot}\n📍 მისამართი: ${bookingData.location}\n💰 ფასი: ${price}₾${promoInfo}`;
            
            const whatsappUrl = `https://api.callmebot.com/whatsapp.php?phone=${pricing.whatsappNumber.replace('+', '')}&text=${encodeURIComponent(message)}&apikey=${pricing.whatsappApiKey}`;
            
            await fetch(whatsappUrl);
            console.log('WhatsApp notification sent');
          }
        }
      } catch (e) {
        console.error('Failed to send WhatsApp notification', e);
      }
    }

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
      from: "Luca's AutoSpa <hello@lucasautospa.ge>",
      to: [email],
      subject: "როგორ მოგეწონათ ჩვენი სერვისი? - Luca's AutoSpa",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc;">
          <div style="background-color: #ffffff; border-radius: 24px; padding: 48px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; text-align: center;">
            <div style="margin-bottom: 32px;">
              <img src="https://iili.io/BOm6Gaf.jpg" alt="Luca's AutoSpa Logo" style="width: 80px; height: 80px; border-radius: 20px; margin-bottom: 16px; object-fit: cover; border: 2px solid #f1f5f9;" />
              <div style="height: 4px; width: 60px; background-color: #2563eb; margin: 16px auto; border-radius: 2px;"></div>
            </div>
            
            <h2 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 20px;">დიდი მადლობა, ${customerName}!</h2>

              <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">თქვენი აზრი ჩვენთვის ძალიან მნიშვნელოვანია!</p>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                თქვენი გამოხმაურება გვეხმარება გავხდეთ უკეთესები და შევთავაზოთ საუკეთესო სერვისი ჩვენს მომხმარებლებს.
              </p>
            
            <div style="margin-bottom: 40px;">
              <a href="https://g.page/r/Cc7gXgecIBlIEBM/review" style="background-color: #2563eb; color: #ffffff; padding: 18px 36px; border-radius: 14px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">დაგვიტოვეთ შეფასება</a>
            </div>
            
            <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="color: #1e293b; font-weight: 700; margin-bottom: 4px; font-size: 15px;">საუკეთესო სურვილებით,</p>
              <p style="color: #2563eb; font-weight: 600; margin-top: 0; font-size: 16px;">Luca's AutoSpa-ს გუნდი</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Luca's AutoSpa. ყველა უფლება დაცულია.</p>
            <p style="color: #cbd5e1; font-size: 11px; margin-top: 8px;">ეს არის ავტომატური შეტყობინება, გთხოვთ ნუ უპასუხებთ.</p>
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

app.post('/api/send-cancellation', async (req, res) => {
  try {
    const { email, bookingData } = req.body;
    const serviceName = bookingData.service === 'Premium' ? 'პრემიუმ დითეილინგი' : 'სტანდარტული წმენდა';
    
    const { error } = await resend.emails.send({
      from: "Luca's AutoSpa <hello@lucasautospa.ge>",
      to: [email],
      subject: "ჯავშანი გაუქმებულია - Luca's AutoSpa",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc;">
          <div style="background-color: #ffffff; border-radius: 24px; padding: 48px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://iili.io/BOm6Gaf.jpg" alt="Luca's AutoSpa Logo" style="width: 80px; height: 80px; border-radius: 20px; margin-bottom: 16px; object-fit: cover; border: 2px solid #f1f5f9;" />
              <h1 style="color: #ef4444; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">Luca's <span style="color: #1e293b;">AutoSpa</span></h1>
              <div style="height: 4px; width: 60px; background-color: #ef4444; margin: 16px auto; border-radius: 2px;"></div>
              <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">თქვენი ჯავშანი გაუქმებულია</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">გაცნობებთ, რომ თქვენი ჯავშანი გაუქმდა. დეტალები მოცემულია ქვემოთ:</p>
            </div>

            <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 20px; padding: 32px; margin-bottom: 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; width: 35%; border-bottom: 1px solid #fee2e2;">სერვისი</td>
                  <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 1px solid #fee2e2;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #fee2e2;">თარიღი</td>
                  <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 1px solid #fee2e2;">${bookingData.date}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">დრო</td>
                  <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${bookingData.timeSlot} PM</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; padding: 24px; background-color: #f1f5f9; border-radius: 16px;">
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
                თუ ჯავშანი შეცდომით გაუქმდა ან გაქვთ კითხვები, გთხოვთ დაგვიკავშირდეთ ნომერზე: 
                <br />
                <a href="tel:+995591952473" style="color: #2563eb; text-decoration: none; font-weight: 700; font-size: 16px;">+995 591 952 473</a>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Luca's AutoSpa. ყველა უფლება დაცულია.</p>
            <p style="color: #cbd5e1; font-size: 11px; margin-top: 8px;">ეს არის ავტომატური შეტყობინება, გთხოვთ ნუ უპასუხებთ.</p>
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
        description: `Customer: ${data.customerName}\nPhone: ${data.phone}\nEmail: ${data.email}\nService: ${serviceName}\nLocation: ${data.location}`,
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
