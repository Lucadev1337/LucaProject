import React, { useState, useEffect, Component } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  orderBy, 
  serverTimestamp,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { db, auth } from './firebase';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User as UserIcon, 
  CheckCircle, 
  XCircle, 
  Menu, 
  X, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  ShieldAlert,
  Zap, 
  Tag,
  ArrowRight,
  LogOut,
  Settings,
  LayoutDashboard,
  Plus,
  Trash2,
  Power,
  MessageCircle,
  Instagram,
  ArrowLeft,
  HelpCircle,
  ChevronLeft,
  Check,
  Users,
  Smartphone,
  ChevronDown
} from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, parseISO } from 'date-fns';
import { ka } from 'date-fns/locale';
import { cn } from './lib/utils';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { track } from '@vercel/analytics';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const logo = "https://iili.io/BOm6Gaf.jpg";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Types ---
type Language = 'GE' | 'EN';

const translations = {
  GE: {
    socialMedia: "სოციალური ქსელები",
    heroBadge: "მოძრავი სერვისი - ჩვენ მოვალთ თქვენთან!",
    heroTitle: "ჩვენ ვაწკრიალებთ, ",
    heroTitleSpan: "შენ ზოგავ დროს",
    heroDesc: "დეტალური ინტერიერის ქიმწმენდა შენს მისამართზე. პროფესიონალური ხსნარებით, მისაღებ ფასად.",
    bookNow: "დაჯავშნე ახლავე",
    viewServices: "სერვისების ნახვა",
    lastResult: "ბოლო შედეგი",
    premiumDetailing: "პრემიუმ დითეილინგი",
    features: [
      { title: "სისწრაფე", desc: "სამუშაო სრულდება მაქსიმუმ 3 საათში თქვენს ლოკაციაზე." },
      { title: "პროფესიონალიზმი", desc: "ვიყენებთ პრემიუმ ქიმიკატებს და ორთქლის ტექნოლოგიას." },
      { title: "მოქნილობა", desc: "ჩვენ მოვალთ თქვენს ლოკაციაზე. ნებისმიერ ადგილას, ნებისმიერ დროს." }
    ],
    pricingTitle: "მისაღები ფასები",
    pricingDesc: "აირჩიეთ თქვენთვის სასურველი პაკეტი.",
    standardClean: "ინტერიერის წმენდა",
    premiumDeepClean: "ინტერიერის პრემიუმ დითეილინგი",
    perService: "/ სერვისი ადგილზე",
    sale: "ფასდაკლება",
    mostPopular: "ყველაზე პოპულარული",
    selectStandard: "აირჩიეთ სტანდარტული",
    selectPremium: "აირჩიეთ პრემიუმი",
    readyForNew: "მზად ხართ ",
    readyForNewSpan: "სიახლისთვის?",
    ctaDesc: "ენდეთ Luca's AutoSpa-ს და დაუბრუნეთ თქვენს ავტომობილს პირვანდელი სახე.",
    fiveStar: "5-ვარსკვლავიანი",
    googleReviews: "მომხმარებლების შეფასებები",
    mobile: "მოძრავი",
    footerDesc: "ინტერიერის პრემიუმ დითეილინგი, სასურველ მისამართზე. თქვენ ზოგავთ დროს და ენერგიას, ჩვენ მოვდივართ თქვენს მისამართზე და ვუბრუნებთ ავტომობილს პირვანდელი იერსახეს.",
    serviceArea: "მომსახურების არეალი",
    serviceAreaDesc: "გამოძახება თბილისის მასშტაბით.",
    contact: "კონტაქტი",
    rights: "ყველა უფლება დაცულია.",
    adminPanel: "ადმინ პანელი",
    viewSite: "საიტის ნახვა",
    details: "დეტალები",
    chooseDate: "აირჩიეთ დრო",
    availableTimes: "ხელმისაწვდომი დროები",
    location: "მომსახურების ადგილი",
    address: "მისამართი",
    name: "სახელი",
    phone: "ტელეფონი",
    enterCode: "შეიყვანეთ 6-ნიშნა კოდი",
    codeSent: "კოდი გაიგზავნა თქვენს ტელეფონზე SMS-ის სახით.",
    changeEmail: "ნომრის შეცვლა",
    total: "ჯამი",
    confirmBooking: "ჯავშნის დადასტურება",
    verifyingBtn: "ვერიფიკაცია და დაჯავშნა",
    bookingConfirmed: "ჯავშანი დადასტურებულია!",
    successDesc: "გმადლობთ, რომ აირჩიეთ Luca's AutoSpa. ჩვენ მივიღეთ თქვენი მოთხოვნა და მალე დაგიკავშირდებით დეტალების დასადასტურებლად.",
    backToHome: "მთავარ გვერდზე დაბრუნება",
    searchAddress: "ჩაწერეთ მისამართი...",
    search: "ძებნა",
    clickMap: "დააკლიკეთ რუკაზე ზუსტი ადგილის ასარჩევად",
    sendCode: "კოდის გაგზავნა",
    verification: "ვერიფიკაცია",
    sendingCode: "კოდი იგზავნება...",
    verifying: "მოწმდება...",
    processing: "მუშავდება...",
    noTimes: "ამ დღისთვის ხელმისაწვდომი დროები არ არის.",
    namePlaceholder: "თქვენი სახელი",
    detailsLink: "დეტალები",
    chooseService: "აირჩიეთ სერვისი",
    invalidCode: "არასწორი ან ვადაგასული კოდი",
    verificationError: "შეცდომა ვერიფიკაციისას",
    sendCodeError: "ვერიფიკაციის კოდის გაგზავნა ვერ მოხერხდა",
    generalError: "შეცდომა კოდის გაგზავნისას",
    fillAllFields: "გთხოვთ შეავსოთ ყველა სავალდებულო ველი",
    termsOfService: "წესები და პირობები",
    agreeToTerms: "ვეთანხმები წესებსა და პირობებს",
    readTerms: "წაიკითხეთ წესები და პირობები",
    acceptAndConfirm: "დათანხმება და დადასტურება",
    carModel: "ავტომობილის მოდელი",
    carModelPlaceholder: "მაგ: Toyota Camry",
    errorService: "გთხოვთ აირჩიოთ სერვისი",
    errorDateTime: "გთხოვთ აირჩიოთ თარიღი და დრო",
    errorLocation: "გთხოვთ მიუთითოთ მომსახურების მისამართი",
    errorPersonalInfo: "გთხოვთ შეავსოთ საკონტაქტო ინფორმაცია",
    errorTerms: "გთხოვთ დაეთანხმოთ წესებსა და პირობებს",
    cancel: "გაუქმება",
    termsTitle: "წესები და პირობები",
    bestValue: "საუკეთესო ფასი",
    secure: "უსაფრთხო",
    fast: "სწრაფი",
    premium: "მაღალი ხარისხი",
    standardDetails: [
      "სრული სალონის მტვერსასრუტით წმენდა",
      "მტვრის მოცილება და ტილოთი წმენდა",
      "მინების წმენდა (გარედან და შიგნიდან)",
      "ხალიჩების ქიმწმენდა",
      "ჰაერის არომატიზაცია"
    ],
    premiumDetails: [
      "სრული სტანდარტული პაკეტი",
      "პროფესიონალური საშუალებებით და ფუნჯით ღრმა ქიმწმენდა",
      "ჭერზე ლაქების მოცილება",
      "სავარძლების ღრმა წმენდა",
      "ყველა დეტალის სიღრმისეული დამუშავება",
      "ანტიწვიმა ყველა მინაზე"
    ],
    howItWorks: "როგორ ვმუშაობთ",
    steps: [
      { title: "დაჯავშნა", desc: "აირჩიეთ სასურველი სერვისი და დრო ონლაინ." },
      { title: "მოვდივართ თქვენთან", desc: "ჩვენი გუნდი მოვა თქვენს მისამართზე საჭირო აღჭურვილობით." },
      { title: "ისიამოვნეთ შედეგით", desc: "მიიღეთ იდეალურად სუფთა ავტომობილი სახლიდან გაუსვლელად." }
    ]
  },
  EN: {
    socialMedia: "Social Media",
    heroBadge: "Mobile Service - We come to you!",
    heroTitle: "We clean at your location, ",
    heroTitleSpan: "you save precious time",
    heroDesc: "Detailed interior cleaning at your doorstep. At an affordable price.",
    bookNow: "Book Now",
    viewServices: "View Services",
    lastResult: "Last Result",
    premiumDetailing: "Premium Detailing",
    features: [
      { title: "Speed", desc: "Work is completed in maximum 2 hours at your location." },
      { title: "Professionalism", desc: "We use premium chemicals and steam technology." },
      { title: "Flexibility", desc: "We come to your location. Anywhere, anytime." }
    ],
    pricingTitle: "Affordable Pricing",
    pricingDesc: "Choose the package that suits you.",
    standardClean: "Standard Clean",
    premiumDeepClean: "Premium Deep Clean",
    perService: "/ on-site service",
    sale: "Sale",
    mostPopular: "Most Popular",
    selectStandard: "Select Standard",
    selectPremium: "Select Premium",
    readyForNew: "Ready for ",
    readyForNewSpan: "something new?",
    ctaDesc: "Trust Luca's AutoSpa and give your car its original look back.",
    fiveStar: "5-Star",
    googleReviews: "Google Reviews",
    mobile: "Mobile",
    footerDesc: "Premium interior cleaning at your desired address. You save time and energy, we come to your address and restore your car's original look.",
    serviceArea: "Service Area",
    serviceAreaDesc: "Tbilisi. Mobile service at your door.",
    contact: "Contact",
    rights: "All rights reserved.",
    adminPanel: "Admin Panel",
    viewSite: "View Site",
    details: "Details",
    chooseDate: "Choose Date & Time",
    availableTimes: "Available Times",
    location: "Service Location",
    address: "Address",
    name: "Name",
    phone: "Phone",
    enterCode: "Enter 6-digit code",
    codeSent: "Code sent to your phone via SMS.",
    changeEmail: "Change Number",
    total: "Total",
    confirmBooking: "Confirm Booking",
    verifyingBtn: "Verify & Book",
    bookingConfirmed: "Booking Confirmed!",
    successDesc: "Thank you for choosing Luca's AutoSpa. We received your request and will contact you soon to confirm details.",
    backToHome: "Back to Home",
    searchAddress: "Enter address...",
    search: "Search",
    clickMap: "Click on the map to select exact location",
    sendCode: "Send Code",
    verification: "Verification",
    sendingCode: "Sending code...",
    verifying: "Verifying...",
    processing: "Processing...",
    noTimes: "No available times for this day.",
    namePlaceholder: "Your Name",
    detailsLink: "Details",
    chooseService: "Choose Service",
    invalidCode: "Invalid or expired code",
    verificationError: "Verification error",
    sendCodeError: "Failed to send verification code",
    generalError: "Error sending code",
    fillAllFields: "Please fill all required fields",
    termsOfService: "Terms of Service",
    agreeToTerms: "I agree to the Terms of Service",
    readTerms: "Read Terms of Service",
    acceptAndConfirm: "Accept and Confirm",
    carModel: "Car Model",
    carModelPlaceholder: "e.g., Toyota Camry",
    errorService: "Please select a service",
    errorDateTime: "Please select a date and time",
    errorLocation: "Please specify the service address",
    errorPersonalInfo: "Please fill in your contact information",
    errorTerms: "Please agree to the terms and conditions",
    cancel: "Cancel",
    termsTitle: "Terms & Conditions",
    bestValue: "Best Value",
    secure: "Secure",
    fast: "Fast",
    premium: "Premium",
    standardDetails: [
      "Full interior vacuum cleaning",
      "Dust removal and wiping",
      "Glass cleaning (inside and out)",
      "Mat cleaning",
      "Air freshening"
    ],
    premiumDetails: [
      "Full standard package",
      "Professional brush and foam cleaning",
      "Ceiling stain removal",
      "Deep seat cleaning",
      "Thorough cleaning of all details",
      "Rain repellent on all windows"
    ],
    howItWorks: "How it works",
    steps: [
      { title: "Booking", desc: "Choose your desired service and time online." },
      { title: "We come to you", desc: "Our team will come to your address with the necessary equipment." },
      { title: "Enjoy the result", desc: "Get a perfectly clean car without leaving your home." }
    ]
  }
};

interface Booking {
  id: string;
  customerName: string;
  carModel: string;
  phone: string;
  email?: string;
  service: 'Basic' | 'Premium';
  date: string;
  timeSlot: string;
  location: string;
  lat?: number;
  lng?: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
}

interface Availability {
  date: string;
  slots: string[];
}

interface HeroReview {
  imageUrl: string;
  link: string;
}

interface PromoCode {
  id: string;
  code: string;
  discount: number;
  active: boolean;
  createdAt: any;
}

interface PricingSettings {
  basicPrice: number;
  premiumPrice: number;
  basicSalePercentage?: number;
  premiumSalePercentage?: number;
  salePercentage: number;
  isSaleActive: boolean;
  heroReviews?: HeroReview[];
  whatsappNumber?: string;
  whatsappApiKey?: string;
  isWhatsappEnabled?: boolean;
  smsApiKey?: string;
  isSmsEnabled?: boolean;
  reviewLink?: string;
  verificationMethod?: 'sms' | 'email';
  resendApiKey?: string;
  resendSenderEmail?: string;
}

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Map Config ---
const TBILISI_CENTER: [number, number] = [41.6934, 44.8015];

function MapEvents({ onClick }: { onClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({
    click: onClick,
  });
  return null;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [center, zoom, map]);
  return null;
}

function MapPicker({ onLocationSelect, initialLocation, initialLat, initialLng, t }: { onLocationSelect: (address: string, lat?: number, lng?: number) => void, initialLocation?: string, initialLat?: number, initialLng?: number, t: any }) {
  const [marker, setMarker] = useState<[number, number] | null>(initialLat && initialLng ? [initialLat, initialLng] : null);
  const [address, setAddress] = useState(initialLocation || '');
  const [searchQuery, setSearchQuery] = useState(initialLocation || '');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialLat && initialLng ? [initialLat, initialLng] : TBILISI_CENTER);
  const [zoom, setZoom] = useState(initialLat && initialLng ? 16 : 13);

  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    setMarker([lat, lng]);
    setMapCenter([lat, lng]);
    
    // Reverse geocode using Nominatim
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data && data.display_name) {
        const formattedAddress = data.display_name;
        setAddress(formattedAddress);
        setSearchQuery(formattedAddress);
        onLocationSelect(formattedAddress, lat, lng);
        // Track location selection
        track('Location Selected', { address: formattedAddress });
      }
    } catch (error) {
      console.error('Reverse geocoding failed', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);
        setMarker([newLat, newLon]);
        setMapCenter([newLat, newLon]);
        setZoom(17);
        setAddress(display_name);
        onLocationSelect(display_name, newLat, newLon);
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder={t.searchAddress}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:border-blue-600 outline-none transition-colors text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <Button 
            onClick={handleSearch} 
            disabled={isSearching}
            className="rounded-2xl px-4"
          >
            {isSearching ? '...' : t.search}
          </Button>
        </div>
      </div>
      <div className="h-[300px] w-full rounded-3xl overflow-hidden relative z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <ChangeView center={mapCenter} zoom={zoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapEvents onClick={handleMapClick} />
          {marker && <Marker position={marker} />}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 italic">{t.clickMap}</p>
    </div>
  );
}

// --- Components ---

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("animate-pulse bg-slate-800 rounded-lg", className)} {...props} />
);

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
      secondary: 'bg-slate-900 text-blue-400 hover:bg-slate-800 border border-slate-800 shadow-sm',
      outline: 'bg-transparent border-2 border-blue-600 text-blue-500 hover:bg-blue-600/10',
      ghost: 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
    };
    const sizes = {
      sm: 'px-2.5 py-1 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base font-semibold'
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

const Card = ({ children, className, ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div className={cn('bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-5 text-slate-100', className)} {...props}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'public' | 'admin' | 'booking' | 'terms'>('public');
  const [selectedPlan, setSelectedPlan] = useState<'Basic' | 'Premium' | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lang, setLang] = useState<Language>('GE');
  const t = translations[lang];
  const [isPricingLoading, setIsPricingLoading] = useState(true);
  const [pricing, setPricing] = useState<PricingSettings>({
    basicPrice: 59,
    premiumPrice: 119,
    salePercentage: 20,
    isSaleActive: false,
    isSmsEnabled: true,
    isWhatsappEnabled: true,
    verificationMethod: 'sms'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email?.toLowerCase() === 'luca.mergell@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    // Fetch pricing
    const unsubPricing = onSnapshot(doc(db, 'settings', 'pricing'), (doc) => {
      if (doc.exists()) {
        setPricing(doc.data() as PricingSettings);
        setIsPricingLoading(false);
      } else {
        setIsPricingLoading(false);
      }
    }, () => {
      setIsPricingLoading(false);
    });

    // Simple routing for /dash
    if (window.location.pathname === '/dash') {
      setView('admin');
    }

    return () => {
      unsubscribe();
      unsubPricing();
    };
  }, []);

  // Scroll to top when view changes (e.g., to booking or terms)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [view]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Track login event
      track('Admin Login');
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setView('public');
  };

  return (
    <div className={cn(
        "min-h-screen font-sans transition-colors duration-300 bg-slate-950 text-slate-100",
        lang === 'GE' && "lang-ge"
      )}>
        {/* Navigation - Hidden on booking page */}
        {view !== 'booking' && (
          <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('public')}>
                  <span className="text-xl font-bold tracking-tight font-orbitron uppercase bg-gradient-to-r from-white to-[#30c3fc] bg-clip-text text-transparent">
                    LUCA'S AUTOSPA
                  </span>
                </div>
                
                  <div className="flex items-center gap-4">
                    {/* Language Switcher */}
                    <button 
                      onClick={() => setLang(lang === 'GE' ? 'EN' : 'GE')}
                      className="p-2 hover:bg-slate-800 rounded-xl transition-all active:scale-90 border border-slate-800"
                      title={lang === 'GE' ? 'Switch to English' : 'გადართვა ქართულზე'}
                    >
                      {lang === 'GE' ? (
                        <img src="https://flagcdn.com/w40/gb.png" alt="UK Flag" className="w-6 h-4 object-cover rounded-sm" />
                      ) : (
                        <img src="https://flagcdn.com/w40/ge.png" alt="Georgia Flag" className="w-6 h-4 object-cover rounded-sm" />
                      )}
                    </button>

                    {isAdmin && (
                      <>
                        {view !== 'admin' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setView('admin')}
                            className="flex gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>{t.adminPanel}</span>
                          </Button>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="hidden md:inline text-xs text-slate-400">{user?.email}</span>
                          <Button variant="ghost" size="sm" onClick={logout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800">
                            <LogOut className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}

                    {!isAdmin && view === 'admin' && (
                      <div className="flex items-center gap-3">
                        {!user ? (
                          <Button variant="primary" size="sm" onClick={login} className="gap-2">
                            <ShieldCheck className="w-4 h-4" /> ადმინ შესვლა
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={logout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800">
                            <LogOut className="w-4 h-4" /> {lang === 'GE' ? 'გამოსვლა' : 'Logout'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
              </div>
            </div>
          </nav>
        )}

        <main>
          <AnimatePresence mode="wait">
            {view === 'public' ? (
              <PublicSite 
                key="public" 
                onBookNow={(plan) => {
                  setSelectedPlan(plan);
                  setView('booking');
                }} 
                pricing={pricing} 
                t={t} 
                lang={lang} 
                isLoading={isPricingLoading}
              />
            ) : view === 'booking' ? (
              <BookingPage 
                key="booking" 
                onBack={() => setView('public')} 
                pricing={pricing} 
                t={t} 
                lang={lang} 
                initialPlan={selectedPlan}
                onViewTerms={() => setView('terms')}
              />
            ) : view === 'terms' ? (
              <TermsOfService key="terms" onBack={() => setView('public')} t={t} />
            ) : isAdmin ? (
              <AdminDashboard key="admin" onBack={() => setView('public')} pricing={pricing} />
            ) : (
              <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
                <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-slate-400 mb-6">You do not have permission to access the admin panel.</p>
                <Button onClick={() => setView('public')}>Back to Home</Button>
              </div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer - Hidden on booking page */}
        {view !== 'booking' && (
          <footer className="bg-slate-900 text-slate-400 py-8 px-4 border-t border-slate-800">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <img 
                    src="https://iili.io/BOpU56G.png" 
                    alt="Luca's Autospa Logo" 
                    className="h-12 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-xs leading-relaxed">
                  {t.footerDesc}
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">{t.serviceArea}</h4>
                <p className="text-xs">{t.serviceAreaDesc}</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">{t.contact}</h4>
                <div className="flex flex-col gap-2 text-xs">
                  <a href="tel:+995591952473" className="flex items-center gap-2 hover:text-blue-400">
                    <Phone className="w-3 h-3" /> +995 591 952 473
                  </a>
                  <a href="mailto:hello@lucasautospa.ge" className="flex items-center gap-2 hover:text-blue-400">
                    <Mail className="w-3 h-3" /> hello@lucasautospa.ge
                  </a>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">{t.socialMedia}</h4>
                <div className="flex gap-4">
                  <a href="https://www.instagram.com/lucasautospa.ge/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="https://www.tiktok.com/@lucasautospa" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13 3.1-.12 6.2-.13 9.3 0 1.29-.27 2.61-.9 3.74-.85 1.54-2.43 2.59-4.16 2.89-2.12.37-4.44-.19-6.01-1.7-1.73-1.66-2.32-4.32-1.47-6.57.73-1.92 2.61-3.41 4.65-3.64.13-.02.26-.03.39-.03v4.02c-.8.1-1.6.46-2.14 1.06-.63.7-.83 1.73-.51 2.58.3.8.99 1.48 1.84 1.67 1.13.23 2.43-.1 3.09-1.03.44-.6.54-1.36.54-2.1V4.59c0-1.52 0-3.05-.01-4.57z"/>
                    </svg>
                  </a>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">{t.termsOfService}</h4>
                <button 
                  onClick={() => {
                    setView('terms');
                    window.scrollTo(0, 0);
                  }} 
                  className="text-xs hover:text-blue-400 transition-colors"
                >
                  {t.readTerms}
                </button>
              </div>
            </div>
            <div className="max-w-7xl mx-auto border-t border-slate-800 mt-8 pt-6 text-center text-[10px]">
              &copy; {new Date().getFullYear()} LUCA'S AUTOSPA. {t.rights}
            </div>
          </footer>
        )}

        {/* Floating Action Button - Hidden on booking page */}
        {view !== 'booking' && (
          <a 
            href="https://wa.me/995591952473" 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed bottom-4 right-4 z-50 bg-green-600 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-90"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
        )}
      </div>
  );
}

// --- Public Site ---

function PublicSite({ onBookNow, pricing, t, lang, isLoading }: { onBookNow: (plan?: 'Basic' | 'Premium') => void, pricing: PricingSettings, t: any, lang: Language, isLoading?: boolean, key?: string }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroImages = [
    "https://iili.io/BgUTxQ1.jpg",
    "https://iili.io/BgUTnTB.jpg",
    "https://iili.io/BgUTohP.jpg",
    
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);

  const scrollToBooking = (plan?: 'Basic' | 'Premium' | any) => {
    if (typeof plan === 'string' && (plan === 'Basic' || plan === 'Premium')) {
      onBookNow(plan);
    } else {
      onBookNow(undefined);
    }
  };

  const getPrice = (base: number, type: 'Basic' | 'Premium') => {
    if (pricing.isSaleActive) {
      const discount = type === 'Basic' ? (pricing.basicSalePercentage || 0) : (pricing.premiumSalePercentage || 0);
      return Math.round(base * (1 - discount / 100));
    }
    return base;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
    >
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        {/* Parallax Background */}
        <motion.div 
          style={{ y }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-slate-950/80 z-10" /> {/* Dim overlay */}
          <img 
            src="https://gleamworksceramic.ca/wp-content/uploads/2023/08/washing-with-foam-with-a-brush-of-the-interior-le-2023-02-10-10-24-14-utc-1.jpg" 
            alt="Car Detailing Background" 
            className="w-full h-[120%] object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-20">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full text-[10px] font-black mb-4 border border-blue-500/20">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t.heroBadge}</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-black tracking-tight text-white mb-6 leading-[1.1]">
              {t.heroTitle}
              <br />
              <span className="text-blue-400">{t.heroTitleSpan}</span>
            </h1>
            <p className="text-base lg:text-lg text-slate-400 mb-6 leading-relaxed max-w-lg">
              {t.heroDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="rounded-2xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black px-8 h-14 text-base shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all hover:-translate-y-1 active:scale-95" 
                onClick={() => scrollToBooking()}
              >
                {t.bookNow} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/20 px-8 h-14 text-base transition-all hover:-translate-y-1 active:scale-95" 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t.viewServices}
              </Button>
            </div>
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <Skeleton key={i} className="w-10 h-10 rounded-full border-2 border-slate-900" />
                  ))
                ) : pricing.heroReviews && pricing.heroReviews.length > 0 ? (
                  pricing.heroReviews.map((review, i) => (
                    <a 
                      key={i} 
                      href={review.link || '#'} 
                      target={review.link ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className="transition-transform hover:scale-110 hover:z-10"
                    >
                      <img 
                        src={review.imageUrl || `https://picsum.photos/seed/user${i}/100/100`} 
                        className="w-10 h-10 rounded-full border-2 border-slate-900 shadow-sm object-cover" 
                        referrerPolicy="no-referrer"
                        alt="Happy Customer"
                      />
                    </a>
                  ))
                ) : null}
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="text-sm">
                <div className="flex text-yellow-500 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                </div>
                <a 
                  href="https://maps.app.goo.gl/2anQdgTUnWonpiY77" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-slate-400 font-medium hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  {t.googleReviews}
                  <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative group"
          >
            {/* Floating Frame Effect */}
            <div className="absolute -inset-4 bg-blue-600/20 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/40 aspect-[4/3] border border-white/10 bg-slate-900/40 backdrop-blur-sm p-2">
              <div className="relative h-full w-full rounded-[2rem] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentSlide}
                    src={heroImages[currentSlide]} 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.6 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 50) prevSlide();
                      else if (info.offset.x < -50) nextSlide();
                    }}
                    className="w-full h-full object-cover opacity-90 cursor-grab active:cursor-grabbing" 
                    referrerPolicy="no-referrer"
                    alt="Car Interior Detailing"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                
                {/* Navigation Arrows */}
                <button 
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white backdrop-blur-xl border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:scale-110 active:scale-95 z-20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white backdrop-blur-xl border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:scale-110 active:scale-95 z-20"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Indicators */}
                <div className="absolute bottom-6 right-6 flex gap-2 z-20">
                  {heroImages.map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        currentSlide === i ? "bg-blue-500 w-6" : "bg-white/30 hover:bg-white/50"
                      )}
                    />
                  ))}
                </div>

                <div className="absolute bottom-6 left-6 text-white pointer-events-none z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/40">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-90">{t.lastResult}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(122,220,255,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">{t.pricingTitle}</h2>
            <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">{t.pricingDesc}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Basic Package */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="flex flex-col h-full bg-slate-900/40 backdrop-blur-xl border-white/5 hover:border-blue-400/50 transition-all duration-500 group overflow-hidden rounded-[2rem]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-6 relative z-10">
                  <div className="mb-6">
                    <h3 className="text-xl font-black mb-3 text-white">{t.standardClean}</h3>
                    <div className="flex items-baseline gap-2">
                      {isLoading ? (
                        <Skeleton className="h-10 w-24" />
                      ) : (
                        <>
                          {pricing.isSaleActive ? (
                            <>
                              <span className="text-3xl font-black text-white">{getPrice(pricing.basicPrice, 'Basic')}₾</span>
                              <span className="text-lg text-slate-500 line-through">{pricing.basicPrice}₾</span>
                            </>
                          ) : (
                            <span className="text-3xl font-black text-white">{pricing.basicPrice}₾</span>
                          )}
                        </>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.perService}</span>
                    </div>
                    {pricing.isSaleActive && (pricing.basicSalePercentage || 0) > 0 && (
                      <div className="mt-3 inline-block bg-green-500/20 text-green-400 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider border border-green-500/20">
                        -{pricing.basicSalePercentage}% {t.sale}
                      </div>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {t.standardDetails.map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-slate-400/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-3 h-3 text-slate-400" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full py-5 rounded-xl border-white/5 text-white hover:bg-white/5 transition-all text-sm font-black" onClick={() => scrollToBooking('Basic')}>
                    {t.selectStandard}
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Premium Package */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="flex flex-col h-full bg-slate-900/60 backdrop-blur-xl border-blue-400/30 ring-1 ring-blue-400/10 relative overflow-hidden group rounded-[2rem]">
                <div className="absolute top-0 right-0 bg-blue-400 text-slate-950 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {t.mostPopular}
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-50" />
                <div className="p-6 relative z-10">
                  <div className="mb-6">
                    <h3 className="text-xl font-black mb-3 text-white">{t.premiumDeepClean}</h3>
                    <div className="flex items-baseline gap-2">
                      {isLoading ? (
                        <Skeleton className="h-10 w-24" />
                      ) : (
                        <>
                          {pricing.isSaleActive ? (
                            <>
                              <span className="text-3xl font-black text-white">{getPrice(pricing.premiumPrice, 'Premium')}₾</span>
                              <span className="text-lg text-slate-500 line-through">{pricing.premiumPrice}₾</span>
                            </>
                          ) : (
                            <span className="text-3xl font-black text-white">{pricing.premiumPrice}₾</span>
                          )}
                        </>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.perService}</span>
                    </div>
                    {pricing.isSaleActive && (pricing.premiumSalePercentage || 0) > 0 && (
                      <div className="mt-3 inline-block bg-green-500/20 text-green-400 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider border border-green-500/20">
                        -{pricing.premiumSalePercentage}% {t.sale}
                      </div>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {t.premiumDetails.map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-[#30c3fc]/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-3 h-3 text-[#30c3fc]" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full py-5 rounded-xl shadow-2xl shadow-blue-400/20 bg-blue-400 hover:bg-blue-300 text-slate-950 transition-all font-black text-sm" onClick={() => scrollToBooking('Premium')}>
                    {t.selectPremium}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-16 px-4 bg-slate-900/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">{t.howItWorks}</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent -translate-y-1/2 -z-0" />
            
            {t.steps.map((step: any, i: number) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:border-blue-400/50 transition-all duration-500 relative z-10">
                  <span className="text-2xl font-black text-blue-400">{i + 1}</span>
                  <div className="absolute -inset-2 bg-blue-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.features.map((f: any, i: number) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col gap-4 p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-500 group"
            >
              <div className="w-12 h-12 bg-blue-400/10 text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-400 group-hover:text-slate-950 transition-all duration-500 shadow-lg">
                {i === 0 ? <Zap className="w-6 h-6" /> : i === 1 ? <ShieldCheck className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-black text-white">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Booking CTA Section */}
      <section className="py-12 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-950 rounded-[2rem] p-8 md:p-12 text-center relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 blur-[100px] -z-0" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/5 blur-[100px] -z-0" />
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">{t.readyForNew}<span className="text-blue-400">{t.readyForNewSpan}</span></h2>
              <p className="text-slate-400 text-sm mb-8 max-w-xl mx-auto">
                {t.ctaDesc}
              </p>
              <Button size="lg" className="rounded-xl shadow-2xl shadow-blue-400/20 bg-blue-400 hover:bg-blue-300 text-slate-950 h-12 text-sm font-black" onClick={() => scrollToBooking()}>
                {t.bookNow}
              </Button>
              <div className="mt-8 flex flex-wrap justify-center gap-6 opacity-40">
                <div className="flex items-center gap-2 text-white">
                  <Star className="w-3.5 h-3.5" />
                  <span className="font-black uppercase tracking-widest text-[9px]">{t.fiveStar}</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="font-black uppercase tracking-widest text-[9px]">{t.mobile}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </motion.div>
  );
}

// --- Booking Page ---

function BookingPage({ onBack, pricing, t, lang, initialPlan, onViewTerms }: { onBack: () => void, pricing: PricingSettings, t: any, lang: Language, initialPlan?: 'Basic' | 'Premium', onViewTerms?: () => void, key?: string }) {
  const [step, setStep] = useState(1);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);
  const [bookingData, setBookingData] = useState<Partial<Booking>>({
    service: initialPlan,
    status: 'pending',
    date: format(startOfToday(), 'yyyy-MM-dd')
  });

  const getPrice = (service: 'Basic' | 'Premium') => {
    const base = service === 'Basic' ? pricing.basicPrice : pricing.premiumPrice;
    let finalPrice = base;
    
    if (pricing.isSaleActive) {
      const discount = service === 'Basic' ? (pricing.basicSalePercentage || 0) : (pricing.premiumSalePercentage || 0);
      finalPrice = Math.round(base * (1 - discount / 100));
    }

    if (appliedPromo && appliedPromo.active) {
      finalPrice = Math.round(finalPrice * (1 - appliedPromo.discount / 100));
    }

    return finalPrice;
  };

  const applyPromoCode = async () => {
    if (!promoCodeInput) return;
    setIsApplyingPromo(true);
    setPromoError(null);
    try {
      const codeId = promoCodeInput.toUpperCase().trim();
      const docRef = doc(db, 'promo_codes', codeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const promo = { id: docSnap.id, ...docSnap.data() } as PromoCode;
        if (promo.active) {
          setAppliedPromo(promo);
          track('Promo Code Applied', { code: codeId, discount: promo.discount });
        } else {
          setPromoError(lang === 'GE' ? 'პრომო კოდი არააქტიურია' : 'Promo code is inactive');
        }
      } else {
        setPromoError(lang === 'GE' ? 'პრომო კოდი არასწორია' : 'Invalid promo code');
      }
    } catch (error) {
      console.error('Error applying promo:', error);
      setPromoError(lang === 'GE' ? 'შეცდომა კოდის შემოწმებისას' : 'Error validating code');
    } finally {
      setIsApplyingPromo(false);
    }
  };
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Verification states
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [userCode, setUserCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [expandedService, setExpandedService] = useState<string | 'all' | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [sessionVerificationMethod, setSessionVerificationMethod] = useState<'sms' | 'email' | null>(null);
  
  const currentMethod = sessionVerificationMethod || pricing.verificationMethod || 'sms';

  useEffect(() => {
    // Only initialize reCAPTCHA when we are on the final step, using SMS, and not yet in verification input view
    if (currentMethod === 'sms' && step === 5 && !showVerification) {
      const initRecaptcha = async () => {
        try {
          const container = document.getElementById('recaptcha-container');
          if (!container) return;

          // Ensure full cleanup of any stale instances
          if (window.recaptchaVerifier) {
            try { 
              window.recaptchaVerifier.clear(); 
            } catch (e) {}
            window.recaptchaVerifier = null;
          }
          
          container.innerHTML = '';
          setIsCaptchaVerified(false); // Reset on re-init
          
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'normal',
            'callback': () => {
              console.log('reCAPTCHA solved');
              setIsCaptchaVerified(true);
            },
            'expired-callback': () => {
               console.warn('reCAPTCHA expired');
               setIsCaptchaVerified(false);
               if (window.recaptchaVerifier) {
                 try { window.recaptchaVerifier.clear(); } catch(e){}
                 window.recaptchaVerifier = null;
               }
            }
          });
          
          await window.recaptchaVerifier.render();
          console.log('reCAPTCHA initialized');
        } catch (e) {
          console.error('reCAPTCHA init error:', e);
        }
      };
      
      const timer = setTimeout(initRecaptcha, 400); 
      return () => {
        clearTimeout(timer);
        if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); } catch (e) {}
          window.recaptchaVerifier = null;
        }
        setIsCaptchaVerified(false);
      };
    } else {
      // Cleanup if we leave step 5 or show verification UI
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
      // Note: we don't necessarily want to reset isCaptchaVerified here 
      // because we might have just solved it and are now sending the code.
    }
  }, [currentMethod, step, showVerification]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const steps = [
    { id: 1, label: t.chooseService, icon: Zap, completed: !!bookingData.service },
    { id: 2, label: t.chooseDate, icon: Calendar, completed: !!(bookingData.date && bookingData.timeSlot) },
    { id: 3, label: t.location, icon: MapPin, completed: !!bookingData.location },
    { id: 4, label: lang === 'GE' ? 'საკონტაქტო ინფორმაცია' : 'Contact Info', icon: Users, completed: !!(bookingData.customerName && bookingData.carModel && (currentMethod === 'email' ? !!bookingData.email : !!bookingData.phone)) }
  ];

  const currentStep = steps.find(s => !s.completed)?.id || 1;

  useEffect(() => {
    const findSoonestAvailable = async () => {
      const today = startOfToday();
      const datePromises = Array.from({ length: 30 }, (_, i) => {
        const date = addDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        return dateStr;
      });

      try {
        for (const dateStr of datePromises) {
          const docRef = doc(db, 'availability', dateStr);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const slots = (docSnap.data() as Availability).slots;
            const takenSlotsQuery = query(
              collection(db, 'taken_slots'), 
              where('date', '==', dateStr)
            );
            const takenSnap = await getDocs(takenSlotsQuery);
            const takenSlots = takenSnap.docs.map(d => d.data().timeSlot);
            
            // Filter out past slots or slots less than 1 hour away
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            
            const available = slots.filter(slot => {
              if (takenSlots.includes(slot)) return false;
              const [hours, minutes] = slot.split(':').map(Number);
              const [year, month, day] = dateStr.split('-').map(Number);
              const slotDate = new Date(year, month - 1, day, hours, minutes);
              return slotDate > oneHourFromNow;
            });

            if (available.length > 0) {
              setBookingData(prev => ({ ...prev, date: dateStr }));
              setCurrentMonth(parseISO(dateStr));
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error finding soonest available day:', error);
      }
    };

    findSoonestAvailable();
  }, [initialPlan]);

  const getDaysInMonth = (date: Date) => {
    const start = startOfToday() > new Date(date.getFullYear(), date.getMonth(), 1) 
      ? startOfToday() 
      : new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const dates = getDaysInMonth(currentMonth);

  useEffect(() => {
    if (bookingData.date) {
      fetchSlots(bookingData.date);
    }
  }, [bookingData.date]);

  const fetchSlots = async (date: string) => {
    setIsLoadingSlots(true);
    try {
      const docRef = doc(db, 'availability', date);
      const docSnap = await getDoc(docRef);
      
      let baseSlots: string[] = [];
      if (docSnap.exists()) {
        baseSlots = (docSnap.data() as Availability).slots;
      }

      const takenSlotsQuery = query(
        collection(db, 'taken_slots'), 
        where('date', '==', date)
      );
      const takenSnap = await getDocs(takenSlotsQuery);
      const takenSlots = takenSnap.docs.map(d => d.data().timeSlot);
      
      let filteredSlots = baseSlots.filter(s => !takenSlots.includes(s));

      // Filter out past slots or slots less than 1 hour away
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      filteredSlots = filteredSlots.filter(slot => {
        const [hours, minutes] = slot.split(':').map(Number);
        const [year, month, day] = date.split('-').map(Number);
        const slotDate = new Date(year, month - 1, day, hours, minutes);
        return slotDate > oneHourFromNow;
      });
      
      setAvailableSlots(filteredSlots);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `taken_slots/${date}`);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const sendVerificationCode = async () => {
    setFormError(null);
    const method = currentMethod;
    
    if (method === 'sms' && !bookingData.phone) {
      setFormError(t.phone);
      return;
    }
    if (method === 'email' && !bookingData.email) {
      setFormError(lang === 'GE' ? 'გთხოვთ შეიყვანოთ ელ-ფოსტა' : 'Please enter your email');
      return;
    }

    setIsSendingCode(true);
    try {
      if (method === 'sms') {
        let phoneNumber = bookingData.phone!;
        if (!phoneNumber.startsWith('+')) {
          const cleanPhone = phoneNumber.replace(/^0+/, '');
          phoneNumber = `+995${cleanPhone}`;
        }
        
        // Use the verifier initialized in useEffect
        const appVerifier = window.recaptchaVerifier;
        
        if (!appVerifier) {
          throw new Error('Verification system not ready. Please try again.');
        }
        
        try {
          const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
          
          // CRITICAL: Clear verifier BEFORE updating state that removes the container element
          if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch (e) {}
            window.recaptchaVerifier = null;
          }
          
          setConfirmationResult(result);
          setShowVerification(true);
          track('SMS Verification Sent', { phone: phoneNumber });
        } catch (smsError: any) {
          console.error('SMS Error inside block:', smsError);
          const errorMsg = smsError.message || '';
          
          if (errorMsg.includes('-39') || errorMsg.includes('reCAPTCHA')) {
            setVerificationError(lang === 'GE' 
              ? 'ვერიფიკაციის შეცდომა. გთხოვთ დაადასტუროთ reCAPTCHA (რობოტის შემოწმება).' 
              : 'Verification error. Please complete the reCAPTCHA checkbox.');
            
            // On reCAPTCHA errors, it's often best to reset the verifier
            if (window.recaptchaVerifier) {
              try { window.recaptchaVerifier.clear(); } catch (e) {}
              window.recaptchaVerifier = null;
            }
          }
          throw smsError;
        }
      } else {
        // Email Verification via Resend (Backend)
        const response = await fetch('/api/send-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: bookingData.email,
            lang
          })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send verification email');
        }
        
        setShowVerification(true);
        track('Email Verification Sent', { email: bookingData.email });
      }
    } catch (error: any) {
      console.error('Verification Code error:', error);
      const errorCode = error.code || '';
      
      if (errorCode === 'auth/invalid-phone-number') {
        setFormError(lang === 'GE' ? 'არასწორი ტელეფონის ნომერი' : 'Invalid phone number');
      } else if (error.message?.includes('-39')) {
        // Force reCAPTCHA re-init if -39 occurs
        if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); } catch (e) {}
          window.recaptchaVerifier = null;
        }
        setIsCaptchaVerified(false);
        setFormError(lang === 'GE' 
          ? 'დაფიქსირდა შეცდომა (კავშირის ხარვეზი). გთხოვთ ხელახლა მონიშნოთ რობოტის შემოწმება ან გამოიყენოთ Email ვერიფიკაცია.' 
          : 'An error occurred (connection issue). Please solve the robot check again or use Email verification.');
      } else {
        setFormError(lang === 'GE' 
          ? 'დაფიქსირდა შეცდომა. გთხოვთ სცადოთ მოგვიანებით ან გამოიყენოთ Email ვერიფიკაცია.' 
          : 'An error occurred. Please try again later or use Email verification.');
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSMSNotification = async (phone: string, message: string) => {
    try {
      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
    } catch (e) {
      console.error('Failed to send SMS notification', e);
    }
  };

  const handleBookingSubmit = async (bypassTermsCheck: boolean | React.MouseEvent = false) => {
    const shouldBypass = typeof bypassTermsCheck === 'boolean' ? bypassTermsCheck : false;
    setFormError(null);
    
    if (!bookingData.service) {
      setStep(1);
      setFormError(t.errorService);
      return;
    }
    if (!bookingData.date || !bookingData.timeSlot) {
      setStep(2);
      setFormError(t.errorDateTime);
      return;
    }
    const isContactValid = currentMethod === 'email' ? !!bookingData.email : !!bookingData.phone;
    if (!bookingData.location || !bookingData.customerName || !isContactValid) {
      setStep(3);
      setFormError(t.fillAllFields);
      return;
    }
    if (!termsAccepted && !shouldBypass) {
      setShowTermsPopup(true);
      return;
    }

    if (!showVerification) {
      await sendVerificationCode();
      return;
    }

    if (!userCode) {
      setVerificationError('გთხოვთ შეიყვანოთ ვერიფიკაციის კოდი');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    try {
      let isVerified = false;
      const method = currentMethod;

      if (method === 'sms') {
        if (!confirmationResult) {
          throw new Error('No confirmation result');
        }
        const result = await confirmationResult.confirm(userCode);
        isVerified = !!result.user;
      } else {
        // Verify Email OTP via Backend
        const response = await fetch('/api/verify-email-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: bookingData.email,
            code: userCode
          })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Invalid verification code');
        }
        isVerified = true;
      }
      
      if (isVerified) {
        setIsSubmitting(true);
        const bookingRef = await addDoc(collection(db, 'bookings'), {
          ...bookingData,
          status: 'pending',
          promoCode: appliedPromo?.code || null,
          discountAmount: appliedPromo ? appliedPromo.discount : 0,
          finalPrice: getPrice(bookingData.service as any),
          createdAt: serverTimestamp()
        });
        
        // Track booking event
        track('Booking Confirmed', {
          service: bookingData.service || 'Unknown',
          price: getPrice(bookingData.service as any),
          promoCode: appliedPromo?.code || null
        });
        
        // Also mark slot as taken in public collection
        await setDoc(doc(db, 'taken_slots', `${bookingData.date}_${bookingData.timeSlot}`), {
          date: bookingData.date,
          timeSlot: bookingData.timeSlot,
          bookingId: bookingRef.id
        });
        
        // Send notification to backend (WhatsApp to Admin)
        try {
          await fetch('/api/notify-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              bookingData,
              price: getPrice(bookingData.service as 'Basic' | 'Premium'),
              bookingId: bookingRef.id,
              promoCode: appliedPromo?.code || null
            })
          });
        } catch (e) {
          console.error('Failed to send notification', e);
        }

        // Send Confirmation to Customer
        const method = currentMethod;
        const msg = lang === 'GE' 
          ? `Luca's AutoSpa: თქვენი ჯავშანი დადასტურებულია! 📅 ${bookingData.date} | ⏰ ${bookingData.timeSlot}. მადლობა ნდობისთვის!`
          : `Luca's AutoSpa: Your booking is confirmed! 📅 ${bookingData.date} | ⏰ ${bookingData.timeSlot}. Thank you!`;
        
        if (method === 'sms' && bookingData.phone) {
          await handleSMSNotification(bookingData.phone, msg);
        } else if (method === 'email' && bookingData.email) {
          // Add handleEmailNotification to the main scope or use fetch directly
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: bookingData.email, subject: 'ჯავშნის დადასტურება - Luca\'s AutoSpa', message: msg })
            });
          } catch (e) {
            console.error('Failed to send Email confirmation', e);
          }
        }

        setIsSuccess(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#30c3fc', '#ffffff', '#2563eb']
        });
      } else {
        setVerificationError(t.invalidCode);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      
      // Maximum security: Reset reCAPTCHA on any verification error
      if (currentMethod === 'sms' && window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
        setIsCaptchaVerified(false);
        setShowVerification(false); // Go back to re-solve reCAPTCHA
        setConfirmationResult(null);
      }

      if (error.code === 'auth/invalid-verification-code') {
         setVerificationError(t.invalidCode);
      } else {
         setVerificationError(t.verificationError);
      }
    } finally {
      setIsVerifying(false);
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20"
        >
          <Check className="w-12 h-12 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-4 text-white">{t.bookingConfirmed}</h1>
        <p className="text-slate-400 mb-12 max-w-md">
          {t.successDesc}
        </p>
        <Button onClick={onBack} className="w-full max-w-xs py-4 bg-blue-600 hover:bg-blue-700">
          {t.backToHome}
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-slate-950 text-slate-100 relative overflow-hidden pb-20"
    >
      {/* Visual Depth Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(48,195,252,0.03)_0%,transparent_70%)]" />
      </div>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center relative min-h-[32px]">
          <button 
            onClick={step === 1 ? onBack : () => setStep(step - 1)} 
            className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 active:scale-90 relative z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-black uppercase font-orbitron tracking-tight bg-gradient-to-r from-white to-[#30c3fc] bg-clip-text text-transparent absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
            LUCA'S AUTOSPA
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-0 space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between px-2 pt-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div 
                className="flex flex-col items-center gap-2 group cursor-pointer relative" 
                onClick={() => (s.completed || s.id < step) && setStep(s.id)}
              >
                <div className={cn(
                  "w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-700 relative z-10",
                  step === s.id ? "bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)] scale-110" : 
                  s.id < step ? "bg-blue-600/20 text-blue-400" : "bg-slate-900 border border-white/5 text-slate-600"
                )}>
                  {s.id < step ? <CheckCircle className="w-6 h-6" /> : <s.icon className={cn("w-6 h-6", step === s.id ? "text-white" : "")} />}
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 text-center",
                  step === s.id ? "text-blue-400 translate-y-0 opacity-100" : "text-slate-600 opacity-60"
                )}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 mb-6 bg-slate-900 overflow-hidden rounded-full relative">
                  <motion.div 
                    className="absolute inset-0 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: i + 1 < step ? 1 : 0 }}
                    style={{ originX: 0 }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.section 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h2 className="text-xl font-black text-white tracking-tight">{t.chooseService}</h2>
                <div className="space-y-3">
                  {[
                    { 
                      id: 'Basic', 
                      title: t.standardClean, 
                      price: getPrice('Basic'), 
                      originalPrice: pricing.basicPrice,
                      details: t.standardDetails
                    },
                    { 
                      id: 'Premium', 
                      title: t.premiumDeepClean, 
                      price: getPrice('Premium'), 
                      originalPrice: pricing.premiumPrice,
                      details: t.premiumDetails
                    }
                  ].map((s) => (
                    <div key={s.id} className="space-y-2">
                      <button
                        onClick={() => {
                          setBookingData({ ...bookingData, service: s.id as any });
                          setExpandedService(expandedService === s.id ? null : s.id);
                          track('Service Selected', { service: s.id });
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-[1.5rem] border transition-all duration-500 text-left relative overflow-hidden group",
                          bookingData.service === s.id 
                            ? "bg-blue-400/10 border-blue-400 ring-1 ring-blue-400/50 shadow-2xl shadow-blue-400/10" 
                            : "bg-slate-900/40 backdrop-blur-xl border-white/5 hover:border-white/10"
                        )}
                      >
                        <div className="flex items-center gap-4 relative z-10 w-full">
                          <div className={cn(
                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                            bookingData.service === s.id ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20" : "bg-transparent border-white/10"
                          )}>
                            {bookingData.service === s.id && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              >
                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                              </motion.div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="text-lg font-black text-white">{s.title}</h3>
                            <div className="flex items-baseline gap-2">
                              <p className={cn(
                                "text-base font-black",
                                bookingData.service === s.id ? "text-blue-400" : "text-slate-400"
                              )}>{s.price}₾</p>
                              {pricing.isSaleActive && (
                                <p className="text-xs text-slate-600 line-through">{s.originalPrice}₾</p>
                              )}
                            </div>
                          </div>

                          <div className={cn(
                            "p-2 rounded-full transition-all duration-300",
                            expandedService === s.id ? "bg-blue-600/10 text-blue-400 rotate-180" : "text-slate-600"
                          )}>
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {expandedService === s.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                              {s.details.map((detail, idx) => (
                                <motion.div 
                                  key={idx} 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="flex items-center gap-3 text-xs text-slate-300 group/item"
                                >
                                  <div className={cn(
                                    "w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover/item:scale-110",
                                    s.id === 'Premium' ? "bg-blue-400/20 text-blue-400" : "bg-slate-700/30 text-slate-500"
                                  )}>
                                    <CheckCircle className="w-3 h-3" />
                                  </div>
                                  <span className="font-medium">{detail}</span>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!bookingData.service}
                  className="w-full py-5 rounded-[2rem] bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-2xl shadow-blue-600/20 flex gap-3"
                >
                  <span>{lang === 'GE' ? 'გაგრძელება' : 'Continue'}</span>
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white tracking-tight">{t.chooseDate}</h2>
                  <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-xl p-1 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                      className="p-1.5 hover:bg-white/5 rounded-lg disabled:opacity-20 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <span className="text-[10px] font-black uppercase text-white px-1">{format(currentMonth, 'MMMM yyyy', { locale: lang === 'GE' ? ka : undefined })}</span>
                    <button 
                      onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      disabled={currentMonth.getMonth() === new Date().getMonth() + 1}
                      className="p-1.5 hover:bg-white/5 rounded-lg disabled:opacity-20 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Horizontal Date Picker */}
                <div className="flex gap-3 overflow-x-auto px-4 pt-4 pb-6 no-scrollbar -mx-4">
                  {dates.map((date) => {
                    const isSelected = bookingData.date === format(date, 'yyyy-MM-dd');
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setBookingData({ ...bookingData, date: format(date, 'yyyy-MM-dd'), timeSlot: undefined });
                          track('Date Selected', { date: format(date, 'yyyy-MM-dd') });
                        }}
                        className={cn(
                          "flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-500 border",
                          isSelected 
                            ? "bg-blue-400 border-blue-400 text-slate-950 shadow-2xl shadow-blue-400/30 scale-105" 
                            : "bg-slate-900/40 backdrop-blur-xl border-white/5 text-slate-400 hover:border-white/10"
                        )}
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest">{format(date, 'EEE', { locale: lang === 'GE' ? ka : undefined })}</span>
                        <span className="text-lg font-black">{format(date, 'd')}</span>
                        {isSelected && (
                          <motion.div 
                            layoutId="date-indicator"
                            className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots */}
                {bookingData.date && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-1"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-[1px] flex-1 bg-white/5" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.availableTimes}</span>
                      <div className="h-[1px] flex-1 bg-white/5" />
                    </div>

                    {isLoadingSlots ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="h-14 bg-slate-900/40 rounded-xl" />
                        ))}
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                        {availableSlots.map((slot) => {
                          const isSelected = bookingData.timeSlot === slot;
                          return (
                            <button
                              key={slot}
                              onClick={() => {
                                setBookingData({ ...bookingData, timeSlot: slot });
                                track('Time Slot Selected', { timeSlot: slot });
                              }}
                              className={cn(
                                "h-14 rounded-xl border transition-all duration-500 flex flex-col items-center justify-center gap-1 group relative overflow-hidden",
                                isSelected 
                                  ? "bg-blue-400 border-blue-400 text-slate-950 shadow-2xl shadow-blue-400/30 scale-105" 
                                  : "bg-slate-900/40 backdrop-blur-xl border-white/5 text-white hover:border-white/10"
                              )}
                            >
                              <span className="text-base font-black relative z-10">{slot}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-dashed border-white/10">
                        <p className="text-xs text-slate-500 font-medium">{t.noTimes}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="flex gap-4 pt-6">
                <Button 
                  onClick={() => setStep(1)} 
                  variant="ghost"
                  className="flex-1 py-5 rounded-[2rem] border border-white/5 font-black text-lg gap-3"
                >
                  <ChevronLeft className="w-6 h-6" />
                  <span>{lang === 'GE' ? 'უკან' : 'Back'}</span>
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!bookingData.date || !bookingData.timeSlot}
                  className="flex-[2] py-5 rounded-[2rem] bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-2xl shadow-blue-600/30 flex gap-3 relative overflow-hidden group"
                >
                  <span>{lang === 'GE' ? 'გაგრძელება' : 'Continue'}</span>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <h2 className="text-xl font-black text-white tracking-tight">{t.location}</h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.address}</label>
                    <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-900 group font-sans">
                      <MapPicker 
                        initialLocation={bookingData.location}
                        initialLat={bookingData.lat}
                        initialLng={bookingData.lng}
                        onLocationSelect={(address, lat, lng) => setBookingData({ ...bookingData, location: address, lat, lng })}
                        t={t}
                      />
                    </div>
                  </div>
                </div>

                {formError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center"
                  >
                    {formError}
                  </motion.div>
                )}

                <div className="flex gap-4 pt-6">
                  <Button 
                    onClick={() => setStep(2)} 
                    variant="ghost"
                    className="flex-1 py-5 rounded-[1.5rem] border border-white/5 font-black text-lg gap-3"
                  >
                    <ChevronLeft className="w-6 h-6" />
                    <span>{lang === 'GE' ? 'უკან' : 'Back'}</span>
                  </Button>
                  <Button 
                    onClick={() => {
                      if (bookingData.location) {
                        setStep(4);
                        setFormError(null);
                      } else {
                        setFormError(t.errorLocation);
                      }
                    }} 
                    className="flex-[2] py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-2xl shadow-blue-600/30 flex gap-3 relative overflow-hidden group"
                  >
                    <span>{lang === 'GE' ? 'გაგრძელება' : 'Continue'}</span>
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <h2 className="text-xl font-black text-white tracking-tight">{lang === 'GE' ? 'საკონტაქტო ინფორმაცია' : 'Contact Information'}</h2>
                
                <div id="personal-info-section" className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.name}</label>
                    <input 
                      type="text" 
                      placeholder={t.namePlaceholder}
                      className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 focus:border-blue-400 outline-none transition-all text-white text-base shadow-inner"
                      value={bookingData.customerName || ''}
                      onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.carModel}</label>
                    <input 
                      type="text" 
                      placeholder={t.carModelPlaceholder}
                      className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 focus:border-blue-400 outline-none transition-all text-white text-base shadow-inner"
                      value={bookingData.carModel || ''}
                      onChange={(e) => setBookingData({ ...bookingData, carModel: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">
                      {currentMethod === 'email' ? 'Email' : t.phone}
                    </label>
                    {currentMethod === 'email' ? (
                      <input 
                        type="email" 
                        placeholder="your@email.com"
                        className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 focus:border-blue-400 outline-none transition-all text-white text-base shadow-inner"
                        value={bookingData.email || ''}
                        onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                      />
                    ) : (
                      <div className="relative flex items-center bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden focus-within:border-blue-400 transition-all shadow-inner">
                        <div className="pl-6 pr-4 py-4 text-slate-500 font-bold text-base border-r border-white/10 bg-white/5">
                          +995
                        </div>
                        <input 
                          type="tel" 
                          placeholder="5..."
                          className="flex-1 bg-transparent p-4 outline-none text-white text-base"
                          value={bookingData.phone || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setBookingData({ ...bookingData, phone: val });
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Promo Code Input (Optional) - Moved from Step 1 to Step 4 */}
                  <div className="pt-4 border-t border-white/5">
                    {!appliedPromo ? (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">
                          {lang === 'GE' ? 'პრომო კოდი (არასავალდებულო)' : 'Promo Code (Optional)'}
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="SAVE20"
                            className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 focus:border-blue-400 outline-none transition-all text-white text-sm uppercase"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                          />
                          <Button 
                            onClick={applyPromoCode} 
                            disabled={isApplyingPromo || !promoCodeInput}
                            className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
                          >
                            {isApplyingPromo ? '...' : (lang === 'GE' ? 'გამოყენება' : 'Apply')}
                          </Button>
                        </div>
                        {promoError && <p className="text-[10px] text-red-500 font-bold ml-2">{promoError}</p>}
                      </div>
                    ) : (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500/20 text-green-500 rounded-lg flex items-center justify-center">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase tracking-wider">{appliedPromo.code}</p>
                            <p className="text-[10px] text-green-500 font-bold">
                              {lang === 'GE' ? `${appliedPromo.discount}% ფასდაკლება გამოყენებულია` : `${appliedPromo.discount}% Discount Applied`}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setAppliedPromo(null);
                            setPromoCodeInput('');
                          }}
                          className="text-slate-500 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {formError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center"
                  >
                    {formError}
                  </motion.div>
                )}

                <div className="flex gap-4 pt-6">
                  <Button 
                    onClick={() => setStep(3)} 
                    variant="ghost"
                    className="flex-1 py-5 rounded-[1.5rem] border border-white/5 font-black text-lg gap-3"
                  >
                    <ChevronLeft className="w-6 h-6" />
                    <span>{lang === 'GE' ? 'უკან' : 'Back'}</span>
                  </Button>
                  <Button 
                    onClick={() => {
                      const isContactValid = currentMethod === 'email' ? !!bookingData.email : !!bookingData.phone;
                      if (bookingData.customerName && bookingData.carModel && isContactValid) {
                        setStep(5);
                        setFormError(null);
                      } else {
                        setFormError(t.fillAllFields || 'გთხოვთ შეავსოთ ყველა ველი');
                      }
                    }} 
                    className="flex-[2] py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-2xl shadow-blue-600/30 flex gap-3 relative overflow-hidden group"
                  >
                    <span>{lang === 'GE' ? 'გაგრძელება' : 'Continue'}</span>
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.section>
          )}

          {step === 5 && (
            <motion.section 
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <h2 className="text-xl font-black text-white tracking-tight">{lang === 'GE' ? 'ჯავშნის დადასტურება' : 'Confirm Your Booking'}</h2>
                
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-6 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 blur-3xl rounded-full" />
                  
                  {/* Service Summary */}
                  <div className="flex items-start gap-4 pb-6 border-b border-white/5">
                    <div className="w-12 h-12 bg-blue-400/10 text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                      {bookingData.service === 'Premium' ? <Star className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-black text-white text-lg">
                        {bookingData.service === 'Premium' ? t.premiumDeepClean : t.standardClean}
                      </h3>
                      <p className="text-blue-400 font-black text-xl">{getPrice(bookingData.service as any)}₾</p>
                    </div>
                  </div>

                  {/* Date & Time Summary */}
                  <div className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.chooseDate}</p>
                      <p className="text-white font-medium">
                        {bookingData.date ? format(parseISO(bookingData.date), 'EEEE, d MMMM', { locale: lang === 'GE' ? ka : undefined }) : ''}
                      </p>
                      <p className="text-slate-400 text-sm font-bold">{bookingData.timeSlot}</p>
                    </div>
                  </div>

                  {/* Location Summary */}
                  <div className="flex items-start gap-4 py-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.location}</p>
                      <p className="text-white text-sm line-clamp-2">{bookingData.location}</p>
                    </div>
                  </div>

                  {/* Personal Summary */}
                  <div className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.name} & {t.carModel}</p>
                      <p className="text-white font-medium">{bookingData.customerName} - <span className="text-blue-400">{bookingData.carModel}</span></p>
                      <p className="text-slate-400 text-xs">
                        {currentMethod === 'email' ? bookingData.email : bookingData.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Box */}
                <AnimatePresence>
                  {showVerification && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-4 p-6 bg-blue-600 border border-blue-500/50 rounded-3xl shadow-2xl relative z-10 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full -mr-10 -mt-10" />
                      <div className="flex items-center justify-between relative z-10">
                        <label className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                          <ShieldCheck className="w-5 h-5" /> {t.enterCode}
                        </label>
                        <button 
                          onClick={() => {
                            setShowVerification(false);
                            setConfirmationResult(null);
                            setUserCode('');
                          }}
                          className="text-[10px] font-black text-white/60 hover:text-white uppercase tracking-widest transition-colors"
                        >
                          {currentMethod === 'sms' ? (lang === 'GE' ? 'მონაცემების შეცვლა' : 'Change Phone') : t.changeEmail}
                        </button>
                      </div>
                      <input 
                        type="text" 
                        maxLength={6}
                        placeholder="000000"
                        className={cn(
                          "w-full bg-slate-950/40 border border-white/20 rounded-2xl p-5 text-center text-3xl font-black tracking-[0.5em] focus:border-white outline-none transition-all text-white shadow-inner relative z-10",
                          verificationError ? "border-red-500 bg-red-500/10" : "border-white/10"
                        )}
                        value={userCode}
                        onChange={(e) => {
                          setUserCode(e.target.value.replace(/\D/g, ''));
                          setVerificationError(null);
                        }}
                      />
                      {verificationError && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-red-200 text-center font-bold relative z-10"
                        >
                          {verificationError}
                        </motion.p>
                      )}
                      <p className="text-[10px] text-white/50 text-center uppercase tracking-widest font-bold relative z-10">
                        {currentMethod === 'sms' ? (lang === 'GE' ? 'კოდი გამოგზავნილია SMS-ით' : 'Code sent via SMS') : t.codeSent}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {formError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 text-xs font-bold space-y-3"
                  >
                    <p className="text-center">{formError}</p>
                    
                    {currentMethod === 'sms' && (
                      <div className="flex flex-col gap-4">
                        <div className="w-full h-[1px] bg-red-500/10" />
                        <div className="space-y-3">
                          <p className="text-[10px] text-slate-500 text-center uppercase leading-relaxed font-bold">
                            {lang === 'GE' 
                              ? 'SMS სისტემის ხარვეზი? გამოიყენეთ Email ვერიფიკაცია' 
                              : 'SMS system issues? Try Email Verification instead'}
                          </p>
                          <Button 
                            variant="secondary"
                            onClick={() => {
                              setSessionVerificationMethod('email');
                              setStep(4);
                              setFormError(null);
                              track('Verification Switched to Email', { from: 'error_fallback' });
                            }}
                            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            {lang === 'GE' ? 'Email-ით დადასტურება' : 'Verify via Email'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* VISIBLE RECAPTCHA CHECKBOX */}
                {currentMethod === 'sms' && !showVerification && (
                  <div className="flex flex-col items-center gap-3 py-6 animate-in fade-in slide-in-from-bottom-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      {lang === 'GE' ? 'დაადასტურეთ ვერიფიკაცია' : 'Complete Verification'}
                    </p>
                    <div id="recaptcha-container" className="rounded-2xl overflow-hidden border border-white/5 bg-slate-900/40 p-1"></div>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <Button 
                    onClick={() => setStep(4)} 
                    variant="ghost"
                    className="flex-1 py-5 rounded-[1.5rem] border border-white/5 font-black text-lg gap-3"
                  >
                    <ChevronLeft className="w-6 h-6" />
                    <span>{lang === 'GE' ? 'უკან' : 'Back'}</span>
                  </Button>
                  <Button 
                    onClick={() => handleBookingSubmit()} 
                    disabled={isSubmitting || isVerifying || isSendingCode || (currentMethod === 'sms' && !isCaptchaVerified && !showVerification)}
                    className="flex-[2] py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-2xl shadow-blue-600/30 flex gap-3 relative overflow-hidden group disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                  >
                    {isSubmitting || isVerifying || isSendingCode ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {isSendingCode ? t.sendingCode : isVerifying ? t.verifying : t.processing}
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        {showVerification ? t.confirmBooking : t.verifyingBtn}
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Terms of Service Popup */}
      <AnimatePresence>
        {showTermsPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsPopup(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black text-white tracking-tight">{t.termsTitle}</h3>
                <button onClick={() => setShowTermsPopup(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="prose prose-invert max-w-none">
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">1. ზოგადი ინფორმაცია</h2>
          <p>Luca’s AutoSpa წარმოადგენს მოძრავ სერვისს, რომელიც უზრუნველყოფს ავტომობილის ინტერიერის პროფესიონალურ წმენდას თბილისში. სერვისის გამოყენებით მომხმარებელი ავტომატურად ეთანხმება ქვემოთ ჩამოთვლილ წესებსა და პირობებს.</p>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">2. სერვისის აღწერა</h2>
          <h3 className="text-xl font-bold text-white mb-2">2.1 ინტერიერის წმენდა</h3>
          <p>სტანდარტული პაკეტი მოიცავს:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>სრული სალონის მტვერსასრუტით წმენდა</li>
            <li>მტვრის მოცილება და ზედაპირების წმენდა</li>
            <li>მინების წმენდა (შიგნიდან და გარედან)</li>
            <li>ხალიჩების წმენდა</li>
            <li>ჰაერის არომატიზაცია</li>
          </ul>

          <h3 className="text-xl font-bold text-white mt-6 mb-2">2.2 ინტერიერის პრემიუმ დითეილინგი</h3>
          <p>პრემიუმ პაკეტი მოიცავს:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>სტანდარტული პაკეტის ყველა სერვისი</li>
            <li>პროფესიონალური ქაფით და ფუნჯით ღრმა წმენდა</li>
            <li>ჭერზე ლაქების მოცილება</li>
            <li>სავარძლების ღრმა წმენდა</li>
            <li>ანტიწვიმის დატანა ყველა მინაზე</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">3. მომსახურების პირობები</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>სერვისი ხორციელდება მხოლოდ თბილისის ტერიტორიაზე</li>
            <li>Luca’s AutoSpa უზრუნველყოფს მომსახურებას კლიენტის მიერ მითითებულ ლოკაციაზე</li>
            <li>კლიენტი ვალდებულია უზრუნველყოს:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>ავტომობილის დროებითი დაქოქვის შესაძლებლობა (მტვერსასრუტისთვის) ან</li>
                <li>საკმარისი ადგილი ჩვენი სერვისის ავტომობილისთვის დენის მიწოდების მიზნით</li>
              </ul>
            </li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">4. გადახდა</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>გადახდა ხდება ადგილზე:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>ნაღდი ანგარიშსწორებით</li>
                <li>ან საბანკო გადარიცხვით</li>
              </ul>
            </li>
            <li>Luca’s AutoSpa იტოვებს უფლებას შეცვალოს ფასი ადგილზე, თუ ავტომობილის მდგომარეობა მნიშვნელოვნად განსხვავდება წინასწარ აღწერილისგან</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">5. ჯავშნის გაუქმება და გადადება</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>კლიენტმა უნდა გააუქმოს ჯავშანი მინიმუმ 2 საათით ადრე</li>
            <li>დაგვიანებული გაუქმების შემთხვევაში, კლიენტი ვალდებულია გადაიხადოს სერვისის 50%</li>
            <li>Luca’s AutoSpa იტოვებს უფლებას გადადოს ან გააუქმოს სერვისი:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>ცუდი ამინდის პირობებში</li>
                <li>ტექნიკური პრობლემების შემთხვევაში</li>
              </ul>
            </li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">6. დაგვიანება</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>თუ კლიენტი აგვიანებს 15 წუთზე მეტით,
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>ჯავშანი ავტომატურად გაუქმდება</li>
                <li>კლიენტს ეკისრება სერვისის 100% გადახდა</li>
              </ul>
            </li>
            <li>თუ Luca’s AutoSpa ვერ ახერხებს დროულად მისვლას,
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>კლიენტს უფლება აქვს გააუქმოს ჯავშანი ყოველგვარი გადასახადის გარეშე</li>
              </ul>
            </li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">7. პასუხისმგებლობა</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>კლიენტი ვალდებულია სერვისის დასრულებისთანავე შეამოწმოს ავტომობილი</li>
            <li>Luca’s AutoSpa არ აგებს პასუხს იმ დაზიანებებზე, რომლებიც დაფიქსირდება თანამშრომლის წასვლის შემდეგ</li>
            <li>Luca’s AutoSpa არ არის პასუხისმგებელი:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>უკვე არსებულ დაზიანებებზე</li>
                <li>ძველ, ღრმად გამჯდარ ლაქებზე</li>
                <li>ბუნებრივი ცვეთის შედეგად წარმოქმნილ დეფექტებზე</li>
                <li>ავტომობილის ელექტრონიკის შესაძლო გაუმართაობაზე, თუ დაზიანება არ არის პირდაპირ გამოწვეული დაუდევრობით</li>
              </ul>
            </li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">8. ავტომობილში არსებული ნივთები</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>კლიენტი ვალდებულია მომსახურებამდე ამოიღოს ავტომობილიდან ყველა პირადი და ძვირფასი ნივთი</li>
            <li>Luca’s AutoSpa არ აგებს პასუხს დაკარგულ ან დაზიანებულ ნივთებზე</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">9. მომსახურებაზე უარის თქმის უფლება</h2>
          <p>Luca’s AutoSpa იტოვებს უფლებას უარი თქვას სერვისის შესრულებაზე, თუ:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>ავტომობილი არის უკიდურესად ბინძური</li>
            <li>არსებობს ბიოლოგიური ან ჯანმრთელობისთვის საშიში გარემო</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">10. დამატებითი საფასური</h2>
          <p>განსაკუთრებულად დაბინძურებული ავტომობილის შემთხვევაში, Luca’s AutoSpa-ს აქვს უფლება:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>შესთავაზოს დამატებითი საფასური</li>
            <li>ან უარი თქვას მომსახურებაზე</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">11. შედეგის შეზღუდვა</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Luca’s AutoSpa არ იძლევა გარანტიას ყველა ლაქის 100%-იან მოცილებაზე</li>
            <li>ზოგიერთი ლაქა შეიძლება იყოს მუდმივი და არ ექვემდებარებოდეს სრულად გაწმენდას</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">12. ფოტო და ვიდეო მასალა</h2>
          <p>სერვისის გამოყენებით, კლიენტი ავტომატურად აძლევს Luca’s AutoSpa-ს უფლებას გადაიღოს ავტომობილის ფოტო და ვიდეო მასალა და გამოიყენოს იგი მარკეტინგული მიზნებისთვის (სოციალური ქსელები, რეკლამა).</p>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">13. ონლაინ ჯავშანი და მონაცემები</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>ვებსაიტზე (www.lucasautospa.ge) (https://lucasautospa.ge)) ჯავშნის გაკეთებით მომხმარებელი ეთანხმება ამ წესებს</li>
            <li>საიტი შეიძლება იყენებდეს ქუქიებს (Cookies) მომხმარებლისთვის სერვისის გაუმჯობესებისთვის</li>
            <li>მომხმარებლის მონაცემები გამოიყენება მხოლოდ სერვისის მიწოდების მიზნით და არ გადაეცემა მესამე პირებს</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">14. ცვლილებები</h2>
          <p>Luca’s AutoSpa იტოვებს უფლებას ნებისმიერ დროს შეცვალოს აღნიშნული წესები და პირობები წინასწარი შეტყობინების გარეშე.</p>
        </section>
      </div>
              </div>

              <div className="p-6 bg-slate-950/50 border-t border-white/5 flex flex-col gap-3">
                <Button 
                  onClick={() => {
                    setTermsAccepted(true);
                    setShowTermsPopup(false);
                    handleBookingSubmit(true);
                  }}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20"
                >
                  {t.acceptAndConfirm}
                </Button>
                <button 
                  onClick={() => setShowTermsPopup(false)}
                  className="w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Admin Dashboard ---

function TermsOfService({ onBack, t }: { onBack: () => void, t: any, key?: string }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pt-24 pb-16 px-6 text-slate-300"
    >
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-8 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> {t.backToHome}
      </Button>

      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl font-bold text-white mb-8 font-orbitron">წესები და პირობები</h1>
        
        <p className="text-xl font-bold text-white mb-6">Luca’s AutoSpa</p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">1. ზოგადი ინფორმაცია</h2>
          <p>Luca’s AutoSpa წარმოადგენს მოძრავ სერვისს, რომელიც უზრუნველყოფს ავტომობილის ინტერიერის პროფესიონალურ წმენდას თბილისში. სერვისის გამოყენებით მომხმარებელი ავტომატურად ეთანხმება ქვემოთ ჩამოთვლილ წესებსა და პირობებს.</p>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">2. სერვისის აღწერა</h2>
          <h3 className="text-xl font-bold text-white mb-2">2.1 ინტერიერის წმენდა</h3>
          <p>სტანდარტული პაკეტი მოიცავს:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>სრული სალონის მტვერსასრუტით წმენდა</li>
            <li>მტვრის მოცილება და ზედაპირების წმენდა</li>
            <li>მინების წმენდა (შიგნიდან და გარედან)</li>
            <li>ხალიჩების წმენდა</li>
            <li>ჰაერის არომატიზაცია</li>
          </ul>

          <h3 className="text-xl font-bold text-white mt-6 mb-2">2.2 ინტერიერის პრემიუმ დითეილინგი</h3>
          <p>პრემიუმ პაკეტი მოიცავს:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>სტანდარტული პაკეტის ყველა სერვისი</li>
            <li>პროფესიონალური ქაფით და ფუნჯით ღრმა წმენდა</li>
            <li>ჭერზე ლაქების მოცილება</li>
            <li>სავარძლების ღრმა წმენდა</li>
            <li>ანტიწვიმის დატანა ყველა მინაზე</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">3. მომსახურების პირობები</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>სერვისი ხორციელდება მხოლოდ თბილისის ტერიტორიაზე</li>
            <li>Luca’s AutoSpa უზრუნველყოფს მომსახურებას კლიენტის მიერ მითითებულ ლოკაციაზე</li>
            <li>კლიენტი ვალდებულია უზრუნველყოს:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>ავტომობილის დროებითი დაქოქვის შესაძლებლობა (მტვერსასრუტისთვის) ან</li>
                <li>საკმარისი ადგილი ჩვენი სერვისის ავტომობილისთვის დენის მიწოდების მიზნით</li>
              </ul>
            </li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">4. გადახდა</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>გადახდა ხდება ადგილზე:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>ნაღდი ანგარიშსწორებით</li>
                <li>ან საბანკო გადარიცხვით</li>
              </ul>
            </li>
            <li>Luca’s AutoSpa იტოვებს უფლებას შეცვალოს ფასი ადგილზე, თუ ავტომობილის მდგომარეობა მნიშვნელოვნად განსხვავდება წინასწარ აღწერილისგან</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">5. ჯავშნის გაუქმება და გადადება</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>კლიენტმა უნდა გააუქმოს ჯავშანი მინიმუმ 2 საათით ადრე</li>
            <li>დაგვიანებული გაუქმების შემთხვევაში, კლიენტი ვალდებულია გადაიხადოს სერვისის 50%</li>
            <li>Luca’s AutoSpa იტოვებს უფლებას გადადოს ან გააუქმოს სერვისი:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>ცუდი ამინდის პირობებში</li>
                <li>ტექნიკური პრობლემების შემთხვევაში</li>
              </ul>
            </li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">6. დაგვიანება</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>თუ კლიენტი აგვიანებს 15 წუთზე მეტით,
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>ჯავშანი ავტომატურად გაუქმდება</li>
                <li>კლიენტს ეკისრება სერვისის 100% გადახდა</li>
              </ul>
            </li>
            <li>თუ Luca’s AutoSpa ვერ ახერხებს დროულად მისვლას,
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>კლიენტს უფლება აქვს გააუქმოს ჯავშანი ყოველგვარი გადასახადის გარეშე</li>
              </ul>
            </li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">7. პასუხისმგებლობა</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>კლიენტი ვალდებულია სერვისის დასრულებისთანავე შეამოწმოს ავტომობილი</li>
            <li>Luca’s AutoSpa არ აგებს პასუხს იმ დაზიანებებზე, რომლებიც დაფიქსირდება თანამშრომლის წასვლის შემდეგ</li>
            <li>Luca’s AutoSpa არ არის პასუხისმგებელი:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>უკვე არსებულ დაზიანებებზე</li>
                <li>ძველ, ღრმად გამჯდარ ლაქებზე</li>
                <li>ბუნებრივი ცვეთის შედეგად წარმოქმნილ დეფექტებზე</li>
                <li>ავტომობილის ელექტრონიკის შესაძლო გაუმართაობაზე, თუ დაზიანება არ არის პირდაპირ გამოწვეული დაუდევრობით</li>
              </ul>
            </li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">8. ავტომობილში არსებული ნივთები</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>კლიენტი ვალდებულია მომსახურებამდე ამოიღოს ავტომობილიდან ყველა პირადი და ძვირფასი ნივთი</li>
            <li>Luca’s AutoSpa არ აგებს პასუხს დაკარგულ ან დაზიანებულ ნივთებზე</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">9. მომსახურებაზე უარის თქმის უფლება</h2>
          <p>Luca’s AutoSpa იტოვებს უფლებას უარი თქვას სერვისის შესრულებაზე, თუ:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>ავტომობილი არის უკიდურესად ბინძური</li>
            <li>არსებობს ბიოლოგიური ან ჯანმრთელობისთვის საშიში გარემო</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">10. დამატებითი საფასური</h2>
          <p>განსაკუთრებულად დაბინძურებული ავტომობილის შემთხვევაში, Luca’s AutoSpa-ს აქვს უფლება:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>შესთავაზოს დამატებითი საფასური</li>
            <li>ან უარი თქვას მომსახურებაზე</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">11. შედეგის შეზღუდვა</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Luca’s AutoSpa არ იძლევა გარანტიას ყველა ლაქის 100%-იან მოცილებაზე</li>
            <li>ზოგიერთი ლაქა შეიძლება იყოს მუდმივი და არ ექვემდებარებოდეს სრულად გაწმენდას</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">12. ფოტო და ვიდეო მასალა</h2>
          <p>სერვისის გამოყენებით, კლიენტი ავტომატურად აძლევს Luca’s AutoSpa-ს უფლებას გადაიღოს ავტომობილის ფოტო და ვიდეო მასალა და გამოიყენოს იგი მარკეტინგული მიზნებისთვის (სოციალური ქსელები, რეკლამა).</p>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">13. ონლაინ ჯავშანი და მონაცემები</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>ვებსაიტზე (www.lucasautospa.ge) (https://lucasautospa.ge)) ჯავშნის გაკეთებით მომხმარებელი ეთანხმება ამ წესებს</li>
            <li>საიტი შეიძლება იყენებდეს ქუქიებს (Cookies) მომხმარებლისთვის სერვისის გაუმჯობესებისთვის</li>
            <li>მომხმარებლის მონაცემები გამოიყენება მხოლოდ სერვისის მიწოდების მიზნით და არ გადაეცემა მესამე პირებს</li>
          </ul>
        </section>

        <hr className="border-slate-800 my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">14. ცვლილებები</h2>
          <p>Luca’s AutoSpa იტოვებს უფლებას ნებისმიერ დროს შეცვალოს აღნიშნული წესები და პირობები წინასწარი შეტყობინების გარეშე.</p>
        </section>
      </div>
    </motion.div>
  );
}

function AdminDashboard({ onBack, pricing }: { onBack: () => void, pricing: PricingSettings, key?: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability' | 'pricing' | 'reviews' | 'promo'>('bookings');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'createdAt'>('createdAt');
  const [filterStatus, setFilterStatus] = useState<'future' | 'completed' | 'all'>('future');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [showActionsId, setShowActionsId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy(sortBy, 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(fetchedBookings);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'bookings');
    });
    return unsubscribe;
  }, [sortBy]);

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return booking.status === 'completed';
    if (filterStatus === 'future') return booking.status === 'pending';
    return true;
  });

  const handleSMSNotification = async (phone: string, message: string) => {
    try {
      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
    } catch (e) {
      console.error('Failed to send SMS notification', e);
    }
  };

  const handleEmailNotification = async (email: string, subject: string, message: string) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, message })
      });
    } catch (e) {
      console.error('Failed to send Email notification', e);
    }
  };

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    try {
      const booking = bookings.find(b => b.id === id);
      const method = pricing.verificationMethod || 'sms';
      await updateDoc(doc(db, 'bookings', id), { status });
      
      if (booking) {
        if (status === 'cancelled') {
          await deleteDoc(doc(db, 'taken_slots', `${booking.date}_${booking.timeSlot}`));
          
          const message = `Luca's AutoSpa: თქვენი ჯავშანი გაუქმებულია. კითხვებისთვის მოგვწერეთ. / Your booking was cancelled.`;
          if (method === 'sms' && booking.phone) {
            await handleSMSNotification(booking.phone, message);
          } else if (method === 'email' && booking.email) {
            await handleEmailNotification(booking.email, 'ჯავშნის სტატუსი - Luca\'s AutoSpa', message);
          }
          
        } else {
          await setDoc(doc(db, 'taken_slots', `${booking.date}_${booking.timeSlot}`), {
            date: booking.date,
            timeSlot: booking.timeSlot,
            bookingId: id
          });
        }
      }
      
      if (status === 'completed' && booking) {
        track('Order Completed', { service: booking.service, bookingId: id });
        
        const message = `Luca's AutoSpa: სერვისი დასრულებულია! გთხოვთ დაგვიტოვეთ რევიუ / Please review us: ${pricing.reviewLink || 'https://google.com'}`;
        if (method === 'sms' && booking.phone) {
          await handleSMSNotification(booking.phone, message);
        } else if (method === 'email' && booking.email) {
          await handleEmailNotification(booking.email, 'სერვისი დასრულებულია - Luca\'s AutoSpa', message);
        }
      }
      setShowActionsId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const booking = bookings.find(b => b.id === id);
      await deleteDoc(doc(db, 'bookings', id));
      if (booking) {
        await deleteDoc(doc(db, 'taken_slots', `${booking.date}_${booking.timeSlot}`));
      }
      setShowActionsId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bookings/${id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 20 }}
      className="max-w-7xl mx-auto px-4 pt-24 pb-8"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">ადმინ პანელი</h1>
          <p className="text-xs md:text-sm text-slate-400">მართეთ თქვენი ჯავშნები და ხელმისაწვდომობა.</p>
        </div>
        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
            <div className="flex flex-nowrap">
              <button 
                onClick={() => setActiveTab('bookings')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === 'bookings' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800"
                )}
              >
                ჯავშნები
              </button>
              <button 
                onClick={() => setActiveTab('availability')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === 'availability' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800"
                )}
              >
                ხელმისაწვდომობა
              </button>
              <button 
                onClick={() => setActiveTab('pricing')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === 'pricing' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800"
                )}
              >
                ფასები
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === 'reviews' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800"
                )}
              >
                ავატარები
              </button>
              <button 
                onClick={() => setActiveTab('promo')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === 'promo' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800"
                )}
              >
                პრომო კოდები
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'bookings' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-300 hover:bg-slate-900">
              <ArrowLeft className="w-4 h-4" /> საიტზე დაბრუნება
            </Button>
            
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setFilterStatus('future')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filterStatus === 'future' ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                მომავალი
              </button>
              <button 
                onClick={() => setFilterStatus('completed')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filterStatus === 'completed' ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                დასრულებული
              </button>
              <button 
                onClick={() => setFilterStatus('all')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filterStatus === 'all' ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                ყველა
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Card key={i} className="p-4 bg-slate-900 border-slate-800">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-2 h-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card className="text-center py-20 bg-slate-900 border-slate-800">
              <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">ჯავშნები არ მოიძებნა</h3>
              <p className="text-slate-500">ამ კატეგორიაში ჯავშნები არ არის.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredBookings.map(booking => (
                <Card key={booking.id} className="overflow-hidden bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
                  <div 
                    onClick={() => setExpandedBookingId(expandedBookingId === booking.id ? null : booking.id)}
                    className="p-4 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2 h-10 rounded-full",
                        booking.status === 'pending' && "bg-yellow-500",
                        booking.status === 'completed' && "bg-green-500",
                        booking.status === 'cancelled' && "bg-red-500"
                      )} />
                      <div>
                        <p className="font-bold text-white">{booking.customerName}</p>
                        <p className="text-xs text-slate-500">{format(parseISO(booking.date), 'MMM dd, yyyy')} • {booking.timeSlot}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                        {booking.service === 'Premium' ? 'პრემიუმი' : 'სტანდარტი'}
                      </span>
                      <ChevronRight className={cn(
                        "w-5 h-5 text-slate-600 transition-transform",
                        expandedBookingId === booking.id && "rotate-90"
                      )} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedBookingId === booking.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-800 bg-slate-950/50"
                      >
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">საკონტაქტო</p>
                              <div className="space-y-1">
                                {booking.phone && (
                                  <a href={`tel:${booking.phone}`} className="flex items-center gap-2 text-sm text-blue-400 hover:underline">
                                    <Phone className="w-3.5 h-3.5" /> {booking.phone}
                                  </a>
                                )}
                                {booking.email && (
                                  <a href={`mailto:${booking.email}`} className="flex items-center gap-2 text-sm text-indigo-400 hover:underline">
                                    <Mail className="w-3.5 h-3.5" /> {booking.email}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">მდებარეობა</p>
                              <p className="text-sm text-slate-300 flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-500" /> {booking.location}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">სტატუსი</p>
                              <span className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5 rounded-md",
                                booking.status === 'pending' && "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
                                booking.status === 'completed' && "bg-green-500/10 text-green-500 border border-green-500/20",
                                booking.status === 'cancelled' && "bg-red-500/10 text-red-500 border border-red-500/20"
                              )}>
                                {booking.status === 'pending' ? 'მოლოდინში' : booking.status === 'completed' ? 'დასრულებული' : 'გაუქმებული'}
                              </span>
                            </div>
                            <div className="relative">
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowActionsId(showActionsId === booking.id ? null : booking.id);
                                }}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white gap-2"
                              >
                                მოქმედება <ChevronRight className={cn("w-4 h-4 transition-transform", showActionsId === booking.id && "rotate-90")} />
                              </Button>

                              {showActionsId === booking.id && (
                                <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                  <button 
                                    onClick={() => updateBookingStatus(booking.id!, 'completed')}
                                    className="w-full px-4 py-3 text-left text-sm font-bold text-green-400 hover:bg-green-500/10 border-b border-slate-800 transition-colors"
                                  >
                                    დასრულება
                                  </button>
                                  <button 
                                    onClick={() => updateBookingStatus(booking.id!, 'cancelled')}
                                    className="w-full px-4 py-3 text-left text-sm font-bold text-yellow-500 hover:bg-yellow-500/10 border-b border-slate-800 transition-colors"
                                  >
                                    გაუქმება
                                  </button>
                                  <button 
                                    onClick={() => deleteBooking(booking.id!)}
                                    className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                                  >
                                    წაშლა
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'availability' ? (
        <AvailabilityManager onBack={onBack} />
      ) : activeTab === 'pricing' ? (
        <PricingManager pricing={pricing} onBack={onBack} />
      ) : activeTab === 'promo' ? (
        <PromoCodeManager onBack={onBack} />
      ) : (
        <ReviewsManager pricing={pricing} onBack={onBack} />
      )}
    </motion.div>
  );
}

function ReviewsManager({ pricing, onBack }: { pricing: PricingSettings, onBack: () => void }) {
  const [localPricing, setLocalPricing] = useState<PricingSettings>(pricing);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'pricing'), localPricing);
      // Success
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/pricing');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-300 hover:bg-slate-900">
          <ArrowLeft className="w-4 h-4" /> საიტზე დაბრუნება
        </Button>
        <h2 className="text-2xl font-bold text-white">ავატარების მართვა</h2>
      </div>

      <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">მთავარი გვერდის რევიუები</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const reviews = localPricing.heroReviews || [];
              setLocalPricing({ ...localPricing, heroReviews: [...reviews, { imageUrl: '', link: '' }] });
            }}
            className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" /> დამატება
          </Button>
        </div>

        <div className="space-y-4">
          {(localPricing.heroReviews || []).map((review, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 relative group">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">სურათის URL</label>
                <input 
                  type="text"
                  value={review.imageUrl}
                  onChange={(e) => {
                    const newReviews = [...(localPricing.heroReviews || [])];
                    newReviews[index].imageUrl = e.target.value;
                    setLocalPricing({ ...localPricing, heroReviews: newReviews });
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-blue-600 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ბმული (Link)</label>
                <input 
                  type="text"
                  value={review.link}
                  onChange={(e) => {
                    const newReviews = [...(localPricing.heroReviews || [])];
                    newReviews[index].link = e.target.value;
                    setLocalPricing({ ...localPricing, heroReviews: newReviews });
                  }}
                  placeholder="https://instagram.com/review"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-blue-600 transition-all"
                />
              </div>
              <button 
                onClick={() => {
                  const newReviews = (localPricing.heroReviews || []).filter((_, i) => i !== index);
                  setLocalPricing({ ...localPricing, heroReviews: newReviews });
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full py-4 rounded-xl font-bold shadow-xl shadow-blue-600/20"
        >
          {isSaving ? 'ინახება...' : 'ავატარების შენახვა'}
        </Button>
      </Card>
    </div>
  );
}

function PricingManager({ pricing, onBack }: { pricing: PricingSettings, onBack: () => void }) {
  const [localPricing, setLocalPricing] = useState<PricingSettings>(pricing);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'pricing'), localPricing);
      // Success
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/pricing');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-300 hover:bg-slate-900">
          <ArrowLeft className="w-4 h-4" /> საიტზე დაბრუნება
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Services */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">სერვისების ფასები</h3>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">ინტერიერი (₾)</label>
                <input 
                  type="number"
                  value={localPricing.basicPrice}
                  onChange={(e) => setLocalPricing({ ...localPricing, basicPrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">ინტერიერი -%</label>
                <input 
                  type="number"
                  value={localPricing.basicSalePercentage || 0}
                  onChange={(e) => setLocalPricing({ ...localPricing, basicSalePercentage: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">პრემიუმი (₾)</label>
                <input 
                  type="number"
                  value={localPricing.premiumPrice}
                  onChange={(e) => setLocalPricing({ ...localPricing, premiumPrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">პრემიუმი -%</label>
                <input 
                  type="number"
                  value={localPricing.premiumSalePercentage || 0}
                  onChange={(e) => setLocalPricing({ ...localPricing, premiumSalePercentage: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Global Sale */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">აქცია</h3>
            </div>
            <button 
              onClick={() => setLocalPricing({ ...localPricing, isSaleActive: !localPricing.isSaleActive })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                localPricing.isSaleActive ? "bg-blue-600" : "bg-slate-800"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                localPricing.isSaleActive ? "left-7" : "left-1"
              )} />
            </button>
          </div>
          <div className="p-4 bg-blue-600/5 border border-blue-600/10 rounded-2xl">
            <p className="text-xs text-slate-400">აქტიური აქციის დროს გამოყენებული იქნება ზემოთ მითითებული პროცენტები.</p>
          </div>
        </Card>

        {/* Verification Settings */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/10 text-indigo-500 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">ვერიფიკაციის მეთოდი</h3>
            </div>
            <div className="flex p-1 bg-slate-950 rounded-xl border border-white/5">
              <button 
                onClick={() => setLocalPricing({ ...localPricing, verificationMethod: 'sms' })}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  localPricing.verificationMethod === 'sms' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Smartphone className="w-3 h-3" /> SMS
              </button>
              <button 
                onClick={() => setLocalPricing({ ...localPricing, verificationMethod: 'email' })}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  localPricing.verificationMethod === 'email' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Mail className="w-3 h-3" /> EMAIL
              </button>
            </div>
          </div>

          {localPricing.verificationMethod === 'email' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Resend API Key</label>
                <input 
                  type="password"
                  value={localPricing.resendApiKey || ''}
                  onChange={(e) => setLocalPricing({ ...localPricing, resendApiKey: e.target.value })}
                  placeholder="re_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-600 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">გამგზავნი Email</label>
                <input 
                  type="email"
                  value={localPricing.resendSenderEmail || ''}
                  onChange={(e) => setLocalPricing({ ...localPricing, resendSenderEmail: e.target.value })}
                  placeholder="onboarding@resend.dev"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-600 transition-all"
                />
              </div>
            </motion.div>
          )}
        </Card>

        {/* SMS Notifications */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">SMS შეტყობინებები (SMSOffice)</h3>
            </div>
            <button 
              onClick={() => setLocalPricing({ ...localPricing, isSmsEnabled: !localPricing.isSmsEnabled })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                localPricing.isSmsEnabled ? "bg-blue-600" : "bg-slate-800"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                localPricing.isSmsEnabled ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">SMS API Key</label>
              <input 
                type="password"
                value={localPricing.smsApiKey || ''}
                onChange={(e) => setLocalPricing({ ...localPricing, smsApiKey: e.target.value })}
                placeholder="API Key"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">რევიუ ლინკი</label>
              <input 
                type="text"
                value={localPricing.reviewLink || ''}
                onChange={(e) => setLocalPricing({ ...localPricing, reviewLink: e.target.value })}
                placeholder="https://g.page/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
              />
            </div>
          </div>
        </Card>

        {/* WhatsApp Notifications */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600/10 text-green-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">WhatsApp შეტყობინებები (უფასო)</h3>
            </div>
            <button 
              onClick={() => setLocalPricing({ ...localPricing, isWhatsappEnabled: !localPricing.isWhatsappEnabled })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                localPricing.isWhatsappEnabled ? "bg-green-600" : "bg-slate-800"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                localPricing.isWhatsappEnabled ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">WhatsApp ნომერი</label>
              <input 
                type="text"
                value={localPricing.whatsappNumber || ''}
                onChange={(e) => setLocalPricing({ ...localPricing, whatsappNumber: e.target.value })}
                placeholder="+995..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-green-600 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">CallMeBot API Key</label>
              <input 
                type="password"
                value={localPricing.whatsappApiKey || ''}
                onChange={(e) => setLocalPricing({ ...localPricing, whatsappApiKey: e.target.value })}
                placeholder="API Key"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-green-600 transition-all"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="px-12 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20"
        >
          {isSaving ? 'ინახება...' : 'ცვლილებების შენახვა'}
        </Button>
      </div>
    </div>
  );
}

function AvailabilityManager({ onBack }: { onBack: () => void }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const docRef = doc(db, 'availability', selectedDate);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSlots(docSnap.data().slots);
        } else {
          setSlots([]);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `availability/${selectedDate}`);
      }
    };
    fetchAvailability();
  }, [selectedDate]);

  const toggleSlot = (time: string) => {
    if (slots.includes(time)) {
      setSlots(slots.filter(s => s !== time));
    } else {
      setSlots([...slots, time].sort());
    }
  };

  const saveAvailability = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'availability', selectedDate), {
        date: selectedDate,
        slots: slots
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `availability/${selectedDate}`);
    } finally {
      setIsSaving(false);
    }
  };

  const timeOptions = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  return (
    <div className="max-w-2xl mx-auto px-1 sm:px-0">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-300 hover:bg-slate-900 -ml-2">
          <ArrowLeft className="w-4 h-4" /> საიტზე დაბრუნება
        </Button>
        <h2 className="text-xl md:text-2xl font-bold text-white">ხელმისაწვდომობის მართვა</h2>
      </div>
      <Card className="bg-slate-900 border-slate-800 p-4 md:p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">აირჩიეთ თარიღი</label>
            <input 
              type="date" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none text-white text-base"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ხელმისაწვდომი დროები: {format(parseISO(selectedDate), 'MMMM dd')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {timeOptions.map(time => (
                <button
                  key={time}
                  onClick={() => toggleSlot(time)}
                  className={cn(
                    "p-3.5 rounded-xl border text-sm font-medium transition-all",
                    slots.includes(time) 
                      ? "bg-blue-600 border-blue-600 text-white shadow-md" 
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-blue-500"
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full py-4 rounded-2xl font-bold text-base md:text-lg shadow-xl shadow-blue-600/20" onClick={saveAvailability} disabled={isSaving}>
            {isSaving ? 'ინახება...' : 'შენახვა'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function PromoCodeManager({ onBack }: { onBack: () => void }) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState(10);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'promo_codes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode));
      setPromoCodes(fetched);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'promo_codes');
    });
    return unsubscribe;
  }, []);

  const handleAddCode = async () => {
    if (!newCode) return;
    setIsAdding(true);
    try {
      const codeId = newCode.toUpperCase().trim();
      await setDoc(doc(db, 'promo_codes', codeId), {
        code: codeId,
        discount: newDiscount,
        active: true,
        createdAt: serverTimestamp()
      });
      setNewCode('');
      setNewDiscount(10);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'promo_codes');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'promo_codes', id), { active: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `promo_codes/${id}`);
    }
  };

  const deleteCode = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promo_codes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `promo_codes/${id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-300 hover:bg-slate-900">
          <ArrowLeft className="w-4 h-4" /> საიტზე დაბრუნება
        </Button>
        <h2 className="text-2xl font-bold text-white">პრომო კოდების მართვა</h2>
      </div>

      <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">ახალი პრომო კოდი</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">კოდი</label>
            <input 
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="მაგ: SAVE20"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ფასდაკლება (%)</label>
            <input 
              type="number"
              value={newDiscount}
              onChange={(e) => setNewDiscount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleAddCode} 
              disabled={isAdding || !newCode}
              className="w-full py-3 rounded-xl font-bold"
            >
              {isAdding ? 'ემატება...' : 'კოდის დამატება'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-500" /> არსებული კოდები
        </h3>
        
        {isLoading ? (
          <div className="text-center py-10 text-slate-500">იტვირთება...</div>
        ) : promoCodes.length === 0 ? (
          <Card className="p-10 text-center bg-slate-900 border-slate-800 border-dashed">
            <p className="text-slate-500">პრომო კოდები არ არის დამატებული.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promoCodes.map(code => (
              <Card key={code.id} className="bg-slate-900 border-slate-800 p-5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg",
                    code.active ? "bg-blue-600/10 text-blue-500" : "bg-slate-800 text-slate-500"
                  )}>
                    {code.discount}%
                  </div>
                  <div>
                    <h4 className="font-black text-white text-lg tracking-tight">{code.code}</h4>
                    <p className="text-xs text-slate-500">შექმნილია: {code.createdAt?.toDate ? format(code.createdAt.toDate(), 'MMM dd, yyyy') : 'ახლახანს'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleCodeStatus(code.id, code.active)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      code.active ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                    )}
                    title={code.active ? "დეაქტივაცია" : "აქტივაცია"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteCode(code.id)}
                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all"
                    title="წაშლა"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
