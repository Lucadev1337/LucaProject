import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
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

export const app = express();
app.use(express.json());

// API Routes
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

    const messageText = lang === 'GE' 
      ? `${code} არის თქვენი ვერიფიკაციის კოდი.` 
      : lang === 'RU'
        ? `${code} — ваш код верификации.`
        : `${code} is your verification code.`;

    if (method === 'email') {
      if (!pricing.resendApiKey) throw new Error('Email verification not configured');
      const resend = new Resend(pricing.resendApiKey);
      
      const otpContent = `
        <div style="text-align: center;">
          <p style="font-size: 16px; color: #475569; margin-bottom: 8px;">${lang === 'GE' ? 'თქვენი ვერიფიკაციის კოდია:' : lang === 'RU' ? 'Ваш код верификации:' : 'Your verification code is:'}</p>
          <h1 style="font-size: 48px; letter-spacing: 4px; color: #1e293b; margin: 0;">${code}</h1>
          <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
            ${lang === 'GE' ? 'ეს კოდი ვალიდურია 10 წუთის განმავლობაში.' : lang === 'RU' ? 'Этот код действителен в течение 10 минут.' : 'This code is valid for 10 minutes.'}
          </p>
        </div>
      `;
      const subtitle = lang === 'GE' ? 'ვერიფიკაცია' : lang === 'RU' ? 'Верификация' : 'Verification';
      const html = getEmailWrapper(otpContent, subtitle, lang);

      await resend.emails.send({
        from: `Luca's AutoSpa <${pricing.resendSenderEmail || 'onboarding@resend.dev'}>`,
        to: email,
        subject: lang === 'GE' ? 'ვერიფიკაციის კოდი' : lang === 'RU' ? 'Код верификации' : 'Verification Code',
        text: messageText,
        html: html
      });
    } else if (method === 'whatsapp') {
      const vResponse = await sendMultiChannelHelper(pricing, phone, messageText, method);
      if (!vResponse.ok) {
        const response = vResponse as Response;
        const errorText = await response.text().catch(() => 'No body');
        console.error('Provider error status:', response.status);
        console.error('Provider error body:', errorText);
        throw new Error(`Failed to reach verification provider: ${response.status} ${errorText}`);
      }
    } else {
      throw new Error('Invalid verification method');
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Send OTP error:', error);
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

    console.log('Verifying OTP:', { key, codeProvided: code, expectedCode: data.code });
    if (data.code.toString().trim() !== code.toString().trim()) {
      throw new Error('Invalid verification code');
    }

    // Success
    await deleteDoc(docRef);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- Helper: Email Template Wrapper ---
const getEmailWrapper = (content: string, subtitle: string, lang: string = 'GE') => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 24px; background-color: #ffffff;">
    <div style="text-align: center; padding-bottom: 24px;">
      <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 900;">Luca's AutoSpa</h1>
      <p style="color: #64748b; margin-top: 8px; font-size: 14px;">${subtitle}</p>
    </div>

    <div style="background-color: #f8fafc; padding: 32px; border-radius: 20px; border: 1px solid #e2e8f0; line-height: 1.6; color: #1e293b;">
      ${content}
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">${lang === 'GE' ? 'გმადლობთ Luca\'s AutoSpa-ს არჩევისთვის!' : lang === 'RU' ? 'Спасибо, что выбрали Luca\'s AutoSpa!' : 'Thank you for choosing Luca\'s AutoSpa!'}</p>
      <div style="font-size: 12px; color: #94a3b8;">
        © ${new Date().getFullYear()} Luca's AutoSpa. ${lang === 'GE' ? 'ყველა უფლება დაცულია.' : lang === 'RU' ? 'Все права защищены.' : 'All rights reserved.'}
      </div>
    </div>
  </div>
`;

app.post('/api/send-email', async (req, res) => {
  try {
    const { email, subject, message, lang = 'GE' } = req.body;
    if (!db) throw new Error('Database not initialized');

    const pricingSnap = await getDoc(doc(db, 'settings', 'pricing'));
    if (!pricingSnap.exists()) throw new Error('Pricing settings not found');
    const pricing = pricingSnap.data();

    if (!pricing.resendApiKey) throw new Error('Resend API key not configured');

    const resend = new Resend(pricing.resendApiKey);

    const formattedContent = message.split('\n').filter((line: string) => line.trim()).map((line: string) => `<p style="margin: 0 0 12px 0;">${line}</p>`).join('');

    await resend.emails.send({
      from: `Luca's AutoSpa <${pricing.resendSenderEmail || 'onboarding@resend.dev'}>`,
      to: email,
      subject: subject,
      html: getEmailWrapper(formattedContent, subject, lang),
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Send email error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!db) throw new Error('Database not initialized');

    const pricingSnap = await getDoc(doc(db, 'settings', 'pricing'));
    if (!pricingSnap.exists()) throw new Error('Pricing settings not found');
    const pricing = pricingSnap.data();

    const response = await sendMultiChannelHelper(pricing, phone, message, 'whatsapp');
    
    if (!response.ok) {
        const errorText = await (response as any).text?.() || 'No body';
        throw new Error(`WhatsApp provider error: ${response.status} ${errorText}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notify-booking', async (req, res) => {
  try {
    const { bookingData, addons, price, bookingId, promoCode, customerMethod, customerEmail, lang } = req.body;
    const serviceName = bookingData.service === 'Premium' 
      ? (lang === 'GE' ? 'პრემიუმ დითეილინგი' : lang === 'RU' ? 'Премиум детейлинг' : 'Premium Detailing') 
      : (lang === 'GE' ? 'სტანდარტული წმენდა' : lang === 'RU' ? 'Стандартная чистка' : 'Standard Cleaning');
    
    // Addon string for WhatsApp
    const addonText = addons && addons.length > 0 
      ? (lang === 'GE' 
          ? `\n➕ დამატებითი: ${addons.map((a: any) => a.nameGE).join(', ')}` 
          : lang === 'RU'
            ? `\n➕ Доп. услуги: ${addons.map((a: any) => a.nameRU || a.nameEN).join(', ')}`
            : `\n➕ Add-ons: ${addons.map((a: any) => a.nameEN).join(', ')}`)
      : '';
    
    // 1. Send Admin Notification (WhatsApp)
    if (db) {
      try {
        const pricingSnap = await getDoc(doc(db, 'settings', 'pricing'));
        if (pricingSnap.exists()) {
          const pricing = pricingSnap.data();
          
          // ADMIN NOTIFICATION
          if (pricing.isWhatsappEnabled && pricing.whatsappNumber) {
            const promoInfo = promoCode ? `\n🎟 პრომო: ${promoCode}` : '';
            const carInfo = bookingData.carModel ? `\n🚗 მანქანა: ${bookingData.carModel}` : '';
            const contactInfo = bookingData.phone ? `📞 ტელ: ${bookingData.phone}` : '';
            const adminMessage = `🚗 *ახალი ჯავშანი!* \n\n👤 კლიენტი: ${bookingData.customerName}${carInfo}\n${contactInfo}${customerEmail ? `\n📧 Email: ${customerEmail}` : ''}\n🛠 სერვისი: ${serviceName}${addonText}\n📅 თარიღი: ${bookingData.date}\n⏰ დრო: ${bookingData.timeSlot}\n📍 მისამართი: ${bookingData.location}\n💰 ფასი: ${price}₾${promoInfo}`;
            
            await sendMultiChannelHelper(pricing, pricing.whatsappNumber, adminMessage, 'whatsapp');
          }

          // 2. CUSTOMER CONFIRMATION
          const promoLine = promoCode ? (lang === 'GE' ? `\n🎟 პრომო კოდი: ${promoCode}` : lang === 'RU' ? `\n🎟 Промокод: ${promoCode}` : `\n🎟 Promo Code: ${promoCode}`) : '';
          const customerMessage = lang === 'GE'
            ? `✅ ჯავშანი დადასტურებულია!\n\n👤 კლიენტი: ${bookingData.customerName}\n🚗 მანქანა: ${bookingData.carModel || '-'}\n🛠 სერვისი: ${serviceName}${addonText}\n📅 თარიღი: ${bookingData.date}\n⏰ დრო: ${bookingData.timeSlot}\n📍 მისამართი: ${bookingData.location}\n💰 გადასახდელი თანხა: ${price}₾${promoLine}\n\nგმადლობთ, რომ გვირჩევთ!`
            : lang === 'RU'
              ? `✅ Бронирование подтверждено!\n\n👤 Клиент: ${bookingData.customerName}\n🚗 Авто: ${bookingData.carModel || '-'}\n🛠 Услуга: ${serviceName}${addonText}\n📅 Дата: ${bookingData.date}\n⏰ Время: ${bookingData.timeSlot}\n📍 Адрес: ${bookingData.location}\n💰 Итоговая цена: ${price}₾${promoLine}\n\nСпасибо, что выбрали нас!`
              : `✅ Booking Confirmed!\n\n👤 Client: ${bookingData.customerName}\n🚗 Car: ${bookingData.carModel || '-'}\n🛠 Service: ${serviceName}${addonText}\n📅 Date: ${bookingData.date}\n⏰ Time: ${bookingData.timeSlot}\n📍 Address: ${bookingData.location}\n💰 Total Price: ${price}₾${promoLine}\n\nThank you for choosing us!`;

          if (customerMethod === 'whatsapp' && bookingData.phone) {
            await sendMultiChannelHelper(pricing, bookingData.phone, customerMessage, 'whatsapp');
          } else if (customerMethod === 'email' && customerEmail) {
            if (pricing.resendApiKey) {
              const resend = new Resend(pricing.resendApiKey);
              const detailContent = `
                <div style="margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px;">
                  <span style="display: block; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 4px;">${lang === 'GE' ? 'კლიენტი' : lang === 'RU' ? 'Клиент' : 'Client'}</span>
                  <span style="font-size: 18px; color: #1e293b; font-weight: 600;">${bookingData.customerName}</span>
                </div>

                <div style="margin-bottom: 20px;">
                  <span style="display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">${lang === 'GE' ? 'თარიღი და დრო' : lang === 'RU' ? 'Дата и время' : 'Date & Time'}</span>
                  <span style="font-size: 15px; color: #1e293b; font-weight: 500;">${bookingData.date} | ${bookingData.timeSlot}</span>
                </div>

                <div style="margin-bottom: 20px;">
                  <span style="display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">${lang === 'GE' ? 'ავტომობილი' : lang === 'RU' ? 'Автомобиль' : 'Vehicle'}</span>
                  <span style="font-size: 15px; color: #1e293b; font-weight: 500;">${bookingData.carModel || '-'}</span>
                </div>

                <div style="margin-bottom: 20px;">
                  <span style="display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">${lang === 'GE' ? 'მომსახურება' : lang === 'RU' ? 'Услуга' : 'Service'}</span>
                  <span style="font-size: 15px; color: #1e293b; font-weight: 500;">${serviceName}</span>
                </div>

                ${addons && addons.length > 0 ? `
                <div style="margin-bottom: 20px;">
                  <span style="display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">${lang === 'GE' ? 'დამატებითი სერვისები' : lang === 'RU' ? 'Доп. услуги' : 'Add-ons'}</span>
                  <span style="font-size: 14px; color: #1e293b; font-weight: 500;">
                    ${addons.map((a: any) => lang === 'GE' ? a.nameGE : lang === 'RU' ? a.nameRU || a.nameEN : a.nameEN).join(', ')}
                  </span>
                </div>
                ` : ''}

                <div style="margin-bottom: 20px;">
                  <span style="display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">${lang === 'GE' ? 'მდებარეობა' : lang === 'RU' ? 'Местоположение' : 'Location'}</span>
                  <span style="font-size: 15px; color: #1e293b; font-weight: 500;">${bookingData.location}</span>
                </div>

                <div style="margin-top: 24px; padding-top: 24px; border-top: 2px dashed #e2e8f0;">
                   <div style="display: flex; justify-content: space-between; align-items: center;">
                     <div>
                       <span style="display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">${lang === 'GE' ? 'სრული საფასური' : lang === 'RU' ? 'Итого' : 'Total Amount'}</span>
                       <span style="font-size: 24px; color: #4f46e5; font-weight: 900;">${price}₾</span>
                     </div>
                     ${promoCode ? `<span style="background-color: #ecfdf5; color: #059669; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; border: 1px solid #10b98120;">${promoCode} Applied</span>` : ''}
                   </div>
                </div>
              `;

              const subtitle = lang === 'GE' ? 'ჯავშანი წარმატებით დადასტურდა' : lang === 'RU' ? 'Ваше бронирование подтверждено' : 'Your booking has been confirmed';
              const html = getEmailWrapper(detailContent, subtitle, lang);
              await resend.emails.send({
                from: `Luca's AutoSpa <${pricing.resendSenderEmail || 'onboarding@resend.dev'}>`,
                to: customerEmail,
                subject: lang === 'GE' ? 'ჯავშნის დადასტურება - Luca\'s AutoSpa' : lang === 'RU' ? 'Подтверждение бронирования - Luca\'s AutoSpa' : 'Booking Confirmation - Luca\'s AutoSpa',
                text: customerMessage,
                html: html
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to process notifications', e);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/finish-booking-notification', async (req, res) => {
  try {
    const { bookingId, lang } = req.body;
    if (!db) throw new Error('Database not initialized');

    const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
    if (!bookingSnap.exists()) throw new Error('Booking not found');
    const booking = bookingSnap.data();

    const pricingSnap = await getDoc(doc(db, 'settings', 'pricing'));
    const pricing = pricingSnap.exists() ? pricingSnap.data() : {};
    
    const reviewLink = pricing.reviewLink || 'https://g.page/r/YOUR_REVIEW_LINK';
    const method = booking.verificationMethod || 'whatsapp';
    
    const messageText = lang === 'GE'
      ? `🙏 გმადლობთ, რომ ისარგებლეთ ჩვენი სერვისით! იმედია კმაყოფილი დარჩით.\n\nგთხოვთ, დაგვიტოვოთ შეფასება Google-ზე: ${reviewLink}`
      : lang === 'RU'
        ? `🙏 Спасибо, что воспользовались нашим сервисом! Надеемся, вы остались довольны.\n\nПожалуйста, оставьте отзыв в Google: ${reviewLink}`
        : `🙏 Thank you for using our service! We hope you're satisfied.\n\nPlease leave us a review on Google: ${reviewLink}`;

    if (method === 'whatsapp' && booking.phone) {
      await sendMultiChannelHelper(pricing, booking.phone, messageText, 'whatsapp');
    } else if (method === 'email' && booking.customerEmail) {
      if (pricing.resendApiKey) {
        const resend = new Resend(pricing.resendApiKey);
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5;">Luca's AutoSpa</h2>
            <p style="font-size: 16px; color: #1e293b;">${lang === 'GE' ? 'გმადლობთ, რომ გვირჩევთ!' : lang === 'RU' ? 'Спасибо, что выбрали нас!' : 'Thank you for choosing us!'}</p>
            <p style="color: #64748b;">${lang === 'GE' ? 'თქვენი აზრი ჩვენთვის მნიშვნელოვანია.' : lang === 'RU' ? 'Ваше мнение важно для нас.' : 'Your opinion matters to us.'}</p>
            <a href="${reviewLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
              ${lang === 'GE' ? 'დაგვიწერეთ შეფასება' : lang === 'RU' ? 'Оставить отзыв' : 'Write a Review'}
            </a>
          </div>
        `;
        await resend.emails.send({
          from: `Luca's AutoSpa <${pricing.resendSenderEmail || 'onboarding@resend.dev'}>`,
          to: booking.customerEmail,
          subject: lang === 'GE' ? 'გმადლობთ! - Luca\'s AutoSpa' : lang === 'RU' ? 'Спасибо! - Luca\'s AutoSpa' : 'Thank you! - Luca\'s AutoSpa',
          text: messageText,
          html: html
        });
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Finish notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

const sendMultiChannelHelper = async (pricing: any, phone: string, message: string, method: 'whatsapp' | 'sms') => {
  const senderId = pricing.smsSender || 'AutoSpa';
  const cleanPhone = phone.replace(/\D/g, ''); // Remove all non-digits for provider APIs

  if (method === 'whatsapp') {
    // WASender (wasenderapi.com)
    if (pricing.waSenderApiKey) {
      const payload: any = { 
        to: cleanPhone, 
        text: message 
      };
      if (pricing.waSenderInstanceId) {
        payload.instance_id = pricing.waSenderInstanceId;
      }

      return fetch(`https://www.wasenderapi.com/api/send-message`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${pricing.waSenderApiKey}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
    }

    // CallMeBot (Fallback)
    if (pricing.whatsappApiKey) {
      const whatsappUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${pricing.whatsappApiKey}`;
      return fetch(whatsappUrl);
    }
    
    // SMS.to (WhatsApp)
    if (pricing.smsApiKey) {
      return fetch(`https://api.sms.to/whatsapp/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${pricing.smsApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, to: cleanPhone, sender_id: senderId })
      });
    }
  }

  // Fallback to SMS if method is sms or everything else fails
  if (pricing.smsApiKey) {
    return fetch(`https://api.sms.to/sms/send`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${pricing.smsApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, to: cleanPhone, sender_id: senderId })
    });
  }

  return { ok: false, status: 400, text: async () => 'No provider configured' };
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
