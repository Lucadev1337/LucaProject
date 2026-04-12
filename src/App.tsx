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
  User
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
  Zap, 
  Tag,
  ArrowRight,
  LogOut,
  Settings,
  LayoutDashboard,
  Plus,
  Trash2,
  MessageCircle,
  Instagram,
  ArrowLeft,
  HelpCircle,
  ChevronLeft,
  Check,
  Users
} from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, parseISO } from 'date-fns';
import { ka } from 'date-fns/locale';
import { cn } from './lib/utils';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { track } from '@vercel/analytics';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const logo = "https://cdn.discordapp.com/attachments/1456600712489468089/1492934413393072300/lucasautospa.jpeg?ex=69dd2305&is=69dbd185&hm=e2c5e667e176c9f07812bfdda468c92196bb2eaf6eb7ed38b161a7738c983b1b";

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
    chooseDate: "აირჩიეთ თარიღი და დრო",
    availableTimes: "ხელმისაწვდომი დროები",
    location: "მომსახურების ადგილი",
    address: "მისამართი",
    name: "სახელი",
    phone: "ტელეფონი",
    email: "ელ-ფოსტა (ვერიფიკაციისთვის)",
    enterCode: "შეიყვანეთ 6-ნიშნა კოდი",
    codeSent: "კოდი გაიგზავნა თქვენს ელ-ფოსტაზე. თუ არ მიგიღიათ, შეამოწმეთ სპამი.",
    changeEmail: "ელ-ფოსტის შეცვლა",
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
    emailPlaceholder: "თქვენი@ფოსტა.com",
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
    errorService: "გთხოვთ აირჩიოთ სერვისი",
    errorDateTime: "გთხოვთ აირჩიოთ თარიღი და დრო",
    errorLocation: "გთხოვთ მიუთითოთ მომსახურების მისამართი",
    errorPersonalInfo: "გთხოვთ შეავსოთ საკონტაქტო ინფორმაცია",
    errorTerms: "გთხოვთ დაეთანხმოთ წესებსა და პირობებს",
    acceptAndConfirm: "ვეთანხმები და დაჯავშნა",
    cancel: "გაუქმება",
    locationError: "თქვენი ადგილმდებარეობის დადგენა ვერ მოხერხდა",
    termsTitle: "წესები და პირობები",
    bestValue: "საუკეთესო ფასი",
    secure: "უსაფრთხო",
    fast: "სწრაფი",
    premium: "პრემიუმი",
    standardDetails: [
      "სრული სალონის მტვერსასრუტით წმენდა",
      "მტვრის მოცილება და ტილოთი წმენდა",
      "მინების წმენდა (გარედან და შიგნიდან)",
      "ხალიჩების წმენდა",
      "ჰაერის არომატიზაცია"
    ],
    premiumDetails: [
      "სრული სტანდარტული პაკეტი",
      "ფუნჯით და ქაფით პროფესიონალური წმენდა",
      "ჭერზე ლაქების მოცილება",
      "სავარძლების ღრმა წმენდა",
      "ყველა დეტალის დამუშავება",
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
    email: "Email (for verification)",
    enterCode: "Enter 6-digit code",
    codeSent: "Code sent to your email. If not received, check spam.",
    changeEmail: "Change Email",
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
    emailPlaceholder: "your@email.com",
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
    errorService: "Please select a service",
    errorDateTime: "Please select a date and time",
    errorLocation: "Please specify the service address",
    errorPersonalInfo: "Please fill in your contact information",
    errorTerms: "Please agree to the terms and conditions",
    acceptAndConfirm: "Accept & Confirm",
    cancel: "Cancel",
    locationError: "Unable to retrieve your location",
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
  email: string;
  phone: string;
  service: 'Basic' | 'Premium';
  date: string;
  timeSlot: string;
  location: string;
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
const TBILISI_CENTER: [number, number] = [41.7151, 44.8271];

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

function MapPicker({ onLocationSelect, initialLocation, t }: { onLocationSelect: (address: string, lat?: number, lng?: number) => void, initialLocation?: string, t: any }) {
  const [marker, setMarker] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState(initialLocation || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(TBILISI_CENTER);
  const [zoom, setZoom] = useState(13);

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

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setMarker([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setZoom(17);
          
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
            const data = await response.json();
            if (data && data.display_name) {
              setAddress(data.display_name);
              setSearchQuery(data.display_name);
              onLocationSelect(data.display_name, latitude, longitude);
            }
          } catch (e) {
            console.error('Reverse geocoding failed', e);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLocating(false);
          // Silent fail or console log is safer in iframe than alert
          console.warn('Location access denied or unavailable');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.warn('Geolocation is not supported by your browser');
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
  const [pricing, setPricing] = useState<PricingSettings>({
    basicPrice: 89,
    premiumPrice: 149,
    salePercentage: 20,
    isSaleActive: false
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
      }
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
        "min-h-screen font-sans transition-colors duration-300 bg-slate-950 text-slate-100"
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

                  {isAdmin && view !== 'admin' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setView(view === 'admin' ? 'public' : 'admin')}
                      className="flex gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                      {view === 'admin' ? <Zap className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                      <span>{view === 'admin' ? t.viewSite : t.adminPanel}</span>
                    </Button>
                  )}
                  {user ? (
                    <div className="flex items-center gap-3">
                      {!isAdmin && <span className="hidden lg:inline text-xs text-red-500 font-medium">არაადმინისტრატორი</span>}
                      <span className="hidden md:inline text-xs text-slate-400">{user.email}</span>
                      {!isAdmin && <img src={user.photoURL || ''} alt="User Profile" className="w-8 h-8 rounded-full border border-slate-700" referrerPolicy="no-referrer" />}
                      <Button variant="ghost" size="sm" onClick={logout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800">
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    // Admin login button removed as requested, accessible via /dash
                    view === 'admin' && (
                      <Button variant="primary" size="sm" onClick={login} className="gap-2">
                        <ShieldCheck className="w-4 h-4" /> ადმინ შესვლა
                      </Button>
                    )
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
            ) : (
              <AdminDashboard key="admin" onBack={() => setView('public')} pricing={pricing} />
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
                    src="https://cdn.discordapp.com/attachments/1456600712489468089/1492899401872703550/lucasautospalogotransparentcropped.png?ex=69dd026a&is=69dbb0ea&hm=079b336f78d420e38f0b8d7599e23f22b1fd0221e60f8af1b52bf64049d437ed" 
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
                  <a href="https://www.tiktok.com/@lucasautospa.ge" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
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

function PublicSite({ onBookNow, pricing, t, lang }: { onBookNow: (plan?: 'Basic' | 'Premium') => void, pricing: PricingSettings, t: any, lang: Language, key?: string }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroImages = [
    "https://media.discordapp.net/attachments/1456600712489468089/1492884090524008488/IMG_9959.png?ex=69dcf427&is=69dba2a7&hm=d78117ac4a1ac8d8592e657f2f21f5e425bc5c6efbba5c9749af84bf9cd4c7c0&=&format=webp&quality=lossless&width=1466&height=1100",
    "https://media.discordapp.net/attachments/1456600712489468089/1492884090947375154/IMG_9961.png?ex=69dcf427&is=69dba2a7&hm=8e3c61b43894ed87869c60a4bcb3581ffc3b38395b030bab8b18bfff3154122c&=&format=webp&quality=lossless&width=1466&height=1100",
    
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
                {pricing.heroReviews && pricing.heroReviews.length > 0 ? (
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
                ) : (
                  [1, 2, 3].map(i => (
                    <img 
                      key={i} 
                      src={`https://picsum.photos/seed/user${i}/100/100`} 
                      className="w-10 h-10 rounded-full border-2 border-slate-900 shadow-sm" 
                      referrerPolicy="no-referrer"
                      alt="Happy Customer"
                    />
                  ))
                )}
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
                      {pricing.isSaleActive ? (
                        <>
                          <span className="text-3xl font-black text-white">{getPrice(pricing.basicPrice, 'Basic')}₾</span>
                          <span className="text-lg text-slate-500 line-through">{pricing.basicPrice}₾</span>
                        </>
                      ) : (
                        <span className="text-3xl font-black text-white">{pricing.basicPrice}₾</span>
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
                      {pricing.isSaleActive ? (
                        <>
                          <span className="text-3xl font-black text-white">{getPrice(pricing.premiumPrice, 'Premium')}₾</span>
                          <span className="text-lg text-slate-500 line-through">{pricing.premiumPrice}₾</span>
                        </>
                      ) : (
                        <span className="text-3xl font-black text-white">{pricing.premiumPrice}₾</span>
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
  const [bookingData, setBookingData] = useState<Partial<Booking>>({
    service: initialPlan,
    status: 'pending',
    date: format(startOfToday(), 'yyyy-MM-dd')
  });

  const getPrice = (service: 'Basic' | 'Premium') => {
    const base = service === 'Basic' ? pricing.basicPrice : pricing.premiumPrice;
    if (pricing.isSaleActive) {
      const discount = service === 'Basic' ? (pricing.basicSalePercentage || 0) : (pricing.premiumSalePercentage || 0);
      return Math.round(base * (1 - discount / 100));
    }
    return base;
  };
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Verification states
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [userCode, setUserCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | 'all' | null>(initialPlan ? initialPlan : 'all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTermsPopup, setShowTermsPopup] = useState(false);

  const steps = [
    { id: 1, label: t.chooseService, icon: Zap, completed: !!bookingData.service },
    { id: 2, label: t.chooseDate, icon: Calendar, completed: !!(bookingData.date && bookingData.timeSlot) },
    { id: 3, label: t.location, icon: MapPin, completed: !!(bookingData.location && bookingData.customerName && bookingData.phone && bookingData.email) }
  ];

  const currentStep = steps.find(s => !s.completed)?.id || 3;

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
            
            if (slots.filter(s => !takenSlots.includes(s)).length > 0) {
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

    if (initialPlan) {
      setTimeout(() => {
        const element = document.getElementById('date-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // If no initial plan, scroll to plan section
      setTimeout(() => {
        const element = document.getElementById('plan-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
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
      
      setAvailableSlots(baseSlots.filter(s => !takenSlots.includes(s)));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `taken_slots/${date}`);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const sendVerificationCode = async () => {
    setFormError(null);
    if (!bookingData.email) {
      setFormError(t.email);
      return;
    }
    setIsSendingCode(true);
    try {
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: bookingData.email })
      });
      const data = await response.json();
      if (data.verificationId) {
        setVerificationId(data.verificationId);
        setShowVerification(true);
        // Track verification event
        track('Verification Code Sent', { email: bookingData.email });
      } else {
        setFormError(t.sendCodeError);
      }
    } catch (error) {
      console.error('Send code error:', error);
      setFormError(t.generalError);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleBookingSubmit = async (bypassTermsCheck: boolean | React.MouseEvent = false) => {
    const shouldBypass = typeof bypassTermsCheck === 'boolean' ? bypassTermsCheck : false;
    setFormError(null);
    
    if (!bookingData.service) {
      setFormError(t.errorService);
      document.getElementById('plan-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!bookingData.date || !bookingData.timeSlot) {
      setFormError(t.errorDateTime);
      document.getElementById('date-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!bookingData.location) {
      setFormError(t.errorLocation);
      document.getElementById('location-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!bookingData.customerName || !bookingData.phone || !bookingData.email) {
      setFormError(t.errorPersonalInfo);
      document.getElementById('personal-info-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.email)) {
      setFormError(lang === 'GE' ? 'გთხოვთ შეიყვანოთ სწორი ელ-ფოსტა' : 'Please enter a valid email address');
      document.getElementById('personal-info-section')?.scrollIntoView({ behavior: 'smooth' });
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
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, code: userCode })
      });
      const data = await response.json();
      
      if (data.success) {
        setIsSubmitting(true);
        const bookingRef = await addDoc(collection(db, 'bookings'), {
          ...bookingData,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        
        // Track booking event
        track('Booking Confirmed', {
          service: bookingData.service || 'Unknown',
          price: bookingData.service ? getPrice(bookingData.service as any) : 0
        });
        
        // Also mark slot as taken in public collection
        await setDoc(doc(db, 'taken_slots', `${bookingData.date}_${bookingData.timeSlot}`), {
          date: bookingData.date,
          timeSlot: bookingData.timeSlot,
          bookingId: bookingRef.id
        });
        
        // Send confirmation email to customer
        try {
          await fetch('/api/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: bookingData.email, 
              bookingData,
              price: getPrice(bookingData.service as 'Basic' | 'Premium')
            })
          });
        } catch (e) {
          console.error('Failed to send confirmation email', e);
        }

        setIsSuccess(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#30c3fc', '#ffffff', '#2563eb']
        });
      } else {
        setVerificationError(data.error || t.invalidCode);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError(t.verificationError);
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
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 active:scale-90 relative z-10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-black uppercase font-orbitron tracking-tight bg-gradient-to-r from-white to-[#30c3fc] bg-clip-text text-transparent absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
            LUCA'S AUTOSPA
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-0 space-y-6">
        {/* Progress Indicator */}
        <div style={{ paddingTop: '170px' }} className="flex items-center justify-between px-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-2 relative">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                  s.completed ? "bg-green-500 text-slate-950" : s.id === currentStep ? "bg-blue-400 text-slate-950 shadow-lg shadow-blue-400/20" : "bg-slate-900 text-slate-500 border border-white/5"
                )}>
                  {s.completed ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider transition-colors duration-500",
                  s.id === currentStep ? "text-blue-400" : "text-slate-500"
                )}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-4 bg-slate-900 relative overflow-hidden">
                  <motion.div 
                    className="absolute inset-0 bg-blue-400"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: s.completed ? 1 : 0 }}
                    style={{ originX: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Select Service */}
        <motion.section 
          id="plan-section" 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="text-xl font-black text-white tracking-tight">{t.chooseService}</h2>
          <div className="space-y-3">
            {[
              { 
                id: 'Basic', 
                title: t.standardClean, 
                price: getPrice('Basic'), 
                originalPrice: pricing.basicPrice,
                icon: Zap,
                details: t.standardDetails
              },
              { 
                id: 'Premium', 
                title: t.premiumDeepClean, 
                price: getPrice('Premium'), 
                originalPrice: pricing.premiumPrice,
                icon: Star,
                details: t.premiumDetails
              }
            ].map((s) => (
              <div key={s.id} className="space-y-2">
                <button
                  onClick={() => {
                    setBookingData({ ...bookingData, service: s.id as any });
                    setExpandedService(s.id);
                    track('Service Selected', { service: s.id });
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 text-left relative overflow-hidden group",
                    bookingData.service === s.id 
                      ? "bg-blue-400/10 border-blue-400 ring-1 ring-blue-400/50 shadow-2xl shadow-blue-400/10" 
                      : "bg-slate-900/40 backdrop-blur-xl border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                      bookingData.service === s.id ? "bg-blue-400 text-slate-950 shadow-xl shadow-blue-400/40 scale-110" : "bg-slate-950/50 text-slate-500"
                    )}>
                      <s.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white mb-0.5">{s.title}</h3>
                      </div>
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
                  </div>
                </button>
                
                <AnimatePresence>
                  {(expandedService === s.id || expandedService === 'all') && (
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
        </motion.section>

        {/* Choose Date & Time */}
        <motion.section 
          id="date-section" 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
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
                      className="absolute -bottom-1 w-1 h-1 bg-slate-950 rounded-full"
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
        </motion.section>

        {/* Service Location */}
        <motion.section 
          id="location-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-xl font-black tracking-tight">{t.location}</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.address}</label>
              <div className="rounded-xl overflow-hidden shadow-2xl">
                <MapPicker 
                  initialLocation={bookingData.location}
                  onLocationSelect={(address) => setBookingData({ ...bookingData, location: address })}
                  t={t}
                />
              </div>
            </div>

            <div id="personal-info-section" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.name}</label>
                <input 
                  type="text" 
                  placeholder={t.namePlaceholder}
                  className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-3.5 focus:border-blue-400 outline-none transition-all text-white text-sm shadow-inner"
                  value={bookingData.customerName || ''}
                  onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.phone}</label>
                <div className="relative flex items-center bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden focus-within:border-blue-400 transition-all shadow-inner">
                  <div className="pl-4 pr-3 py-3.5 text-white font-black text-sm border-r border-white/10 bg-white/5">
                    +995
                  </div>
                  <input 
                    type="tel" 
                    placeholder="5..."
                    className="flex-1 bg-transparent p-3.5 outline-none text-white text-sm"
                    value={bookingData.phone || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setBookingData({ ...bookingData, phone: val });
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.email}</label>
              <input 
                type="email" 
                placeholder={t.emailPlaceholder}
                className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-3.5 focus:border-blue-400 outline-none transition-all text-white text-sm shadow-inner"
                value={bookingData.email || ''}
                onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                disabled={showVerification}
              />
            </div>
          </div>
        </motion.section>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-4 py-4 border-y border-white/5"
        >
          {[
            { icon: ShieldCheck, label: t.secure },
            { icon: Zap, label: t.fast },
            { icon: Star, label: t.premium }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-blue-400 border border-white/5">
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Verification Box at the very bottom */}
        <AnimatePresence>
          {showVerification && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-4 p-6 bg-blue-600/10 border border-blue-600/20 rounded-[2.5rem] shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-blue-400 flex items-center gap-2 uppercase tracking-widest">
                  <ShieldCheck className="w-5 h-5" /> {t.enterCode}
                </label>
                <button 
                  onClick={() => setShowVerification(false)}
                  className="text-[10px] font-black text-blue-400/60 hover:text-blue-400 uppercase tracking-widest transition-colors"
                >
                  {t.changeEmail}
                </button>
              </div>
              <input 
                type="text" 
                maxLength={6}
                placeholder="000000"
                className={cn(
                  "w-full bg-slate-950/50 border rounded-2xl p-5 text-center text-3xl font-black tracking-[0.5em] focus:border-blue-600 outline-none transition-all text-white shadow-inner",
                  verificationError ? "border-red-500/50 bg-red-500/5" : "border-white/10"
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
                  className="text-xs text-red-500 text-center font-bold"
                >
                  {verificationError}
                </motion.p>
              )}
              <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
                {t.codeSent}
              </p>
            </motion.div>
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
                <div className="prose prose-invert prose-sm max-w-none text-slate-400 space-y-6">
                  <p className="text-lg font-bold text-white">Luca’s AutoSpa</p>
                  
                  <section>
                    <h4 className="text-white font-bold mb-2">1. ზოგადი ინფორმაცია</h4>
                    <p>Luca’s AutoSpa წარმოადგენს მოძრავ სერვისს, რომელიც უზრუნველყოფს ავტომობილის ინტერიერის პროფესიონალურ წმენდას თბილისში. სერვისის გამოყენებით მომხმარებელი ავტომატურად ეთანხმება ქვემოთ ჩამოთვლილ წესებსა და პირობებს.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-bold mb-2">2. სერვისის აღწერა</h4>
                    <p>სტანდარტული პაკეტი მოიცავს: სრული სალონის მტვერსასრუტით წმენდა, მტვრის მოცილება, მინების წმენდა, ხალიჩების წმენდა, ჰაერის არომატიზაცია.</p>
                    <p className="mt-2">პრემიუმ პაკეტი მოიცავს: სტანდარტული პაკეტის ყველა სერვისი, პროფესიონალური ქაფით და ფუნჯით ღრმა წმენდა, ჭერზე ლაქების მოცილება, სავარძლების ღრმა წმენდა, ანტიწვიმის დატანა ყველა მინაზე.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-bold mb-2">3. მომსახურების პირობები</h4>
                    <p>სერვისი ხორციელდება მხოლოდ თბილისის ტერიტორიაზე. კლიენტი ვალდებულია უზრუნველყოს ავტომობილის დროებითი დაქოქვის შესაძლებლობა ან საკმარისი ადგილი დენის მიწოდების მიზნით.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-bold mb-2">4. გადახდა</h4>
                    <p>გადახდა ხდება ადგილზე ნაღდი ანგარიშსწორებით ან საბანკო გადარიცხვით. Luca’s AutoSpa იტოვებს უფლებას შეცვალოს ფასი ადგილზე, თუ ავტომობილის მდგომარეობა მნიშვნელოვნად განსხვავდება წინასწარ აღწერილისგან.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-bold mb-2">5. ჯავშნის გაუქმება და გადადება</h4>
                    <p>კლიენტმა უნდა გააუქმოს ჯავშანი მინიმუმ 2 საათით ადრე. დაგვიანებული გაუქმების შემთხვევაში, კლიენტი ვალდებულია გადაიხადოს სერვისის 50%.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-bold mb-2">6. დაგვიანება</h4>
                    <p>თუ კლიენტი აგვიანებს 15 წუთზე მეტით, ჯავშანი ავტომატურად გაუქმდება და კლიენტს ეკისრება სერვისის 100% გადახდა.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-bold mb-2">7. პასუხისმგებლობა</h4>
                    <p>კლიენტი ვალდებულია სერვისის დასრულებისთანავე შეამოწმოს ავტომობილი. Luca’s AutoSpa არ აგებს პასუხს იმ დაზიანებებზე, რომლებიც დაფიქსირდება თანამშრომლის წასვლის შემდეგ.</p>
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

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
        <div className="max-w-2xl mx-auto bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-5 rounded-[2.5rem] shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between gap-6">
            <div className="pl-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">{t.total}</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-black text-blue-400 leading-none">{bookingData.service ? getPrice(bookingData.service as any) : 0}</p>
                <span className="text-sm font-black text-blue-400/60">₾</span>
              </div>
            </div>
            <Button 
              onClick={() => handleBookingSubmit()}
              disabled={isSubmitting || isSendingCode || isVerifying || !bookingData.timeSlot || !bookingData.location || !bookingData.customerName || !bookingData.email}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black flex gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 h-14"
            >
              {isSendingCode ? t.sendingCode : isVerifying ? t.verifying : isSubmitting ? t.processing : (
                <>
                  <Zap className="w-5 h-5" /> {showVerification ? t.verifyingBtn : t.confirmBooking}
                </>
              )}
            </Button>
          </div>
          {formError && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-red-500 text-center mt-3 font-bold uppercase tracking-wider"
            >
              {formError}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- Admin Dashboard ---

function TermsOfService({ onBack, t }: { onBack: () => void, t: any, key?: string }) {
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
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability' | 'pricing' | 'reviews'>('bookings');
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

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    try {
      const booking = bookings.find(b => b.id === id);
      await updateDoc(doc(db, 'bookings', id), { status });
      
      if (booking) {
        if (status === 'cancelled') {
          await deleteDoc(doc(db, 'taken_slots', `${booking.date}_${booking.timeSlot}`));
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
        try {
          await fetch('/api/send-review-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: booking.email, customerName: booking.customerName })
          });
        } catch (e) { console.error(e); }
      } else if (status === 'cancelled' && booking) {
        try {
          await fetch('/api/send-cancellation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: booking.email, bookingData: booking })
          });
        } catch (e) { console.error(e); }
      }
      setShowActionsId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('ნამდვილად გსურთ წაშლა?')) return;
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
            <div className="text-center py-20 text-slate-500">ჯავშნები იტვირთება...</div>
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
                                <a href={`tel:${booking.phone}`} className="flex items-center gap-2 text-sm text-blue-400 hover:underline">
                                  <Phone className="w-3.5 h-3.5" /> {booking.phone}
                                </a>
                                <a href={`mailto:${booking.email}`} className="flex items-center gap-2 text-sm text-blue-400 hover:underline">
                                  <Mail className="w-3.5 h-3.5" /> {booking.email}
                                </a>
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
      alert('ავატარები წარმატებით განახლდა!');
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
      alert('ფასები წარმატებით განახლდა!');
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
        {/* Basic Service */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">ინტერიერის წმენდა</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ფასი (₾)</label>
              <input 
                type="number"
                value={localPricing.basicPrice}
                onChange={(e) => setLocalPricing({ ...localPricing, basicPrice: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ფასდაკლება (%)</label>
              <input 
                type="number"
                value={localPricing.basicSalePercentage || 0}
                onChange={(e) => setLocalPricing({ ...localPricing, basicSalePercentage: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
              />
            </div>
          </div>
        </Card>

        {/* Premium Service */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">პრემიუმ დითეილინგი</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ფასი (₾)</label>
              <input 
                type="number"
                value={localPricing.premiumPrice}
                onChange={(e) => setLocalPricing({ ...localPricing, premiumPrice: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ფასდაკლება (%)</label>
              <input 
                type="number"
                value={localPricing.premiumSalePercentage || 0}
                onChange={(e) => setLocalPricing({ ...localPricing, premiumSalePercentage: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
              />
            </div>
          </div>
        </Card>

        {/* Global Sale Settings */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">ფასდაკლების აქტივაცია</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-400">{localPricing.isSaleActive ? 'აქტიურია' : 'გამორთულია'}</span>
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
          </div>

          <div className="p-4 bg-blue-600/5 border border-blue-600/10 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-black">?</span>
            </div>
            <p className="text-xs text-slate-400">
              ფასდაკლების გააქტიურების შემთხვევაში, თითოეულ სერვისზე გამოყენებული იქნება მისთვის მითითებული ინდივიდუალური ფასდაკლების პროცენტი.
            </p>
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
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-400">{localPricing.isWhatsappEnabled ? 'ჩართულია' : 'გამორთულია'}</span>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ტელეფონის ნომერი (მაგ: +995...)</label>
              <input 
                type="text"
                value={localPricing.whatsappNumber || ''}
                onChange={(e) => setLocalPricing({ ...localPricing, whatsappNumber: e.target.value })}
                placeholder="+995591952473"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-green-600 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CallMeBot API Key</label>
              <input 
                type="text"
                value={localPricing.whatsappApiKey || ''}
                onChange={(e) => setLocalPricing({ ...localPricing, whatsappApiKey: e.target.value })}
                placeholder="123456"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-green-600 transition-all"
              />
            </div>
          </div>

          <div className="p-4 bg-green-600/5 border border-green-600/10 rounded-2xl space-y-3">
            <p className="text-xs text-slate-300 font-bold">როგორ მივიღოთ API Key:</p>
            <ol className="text-[11px] text-slate-400 space-y-1 list-decimal ml-4">
              <li>დაამატეთ <b>+34 644 20 44 15</b> თქვენს კონტაქტებში (WhatsApp).</li>
              <li>გააგზავნეთ შეტყობინება: <b>I allow callmebot to send me messages</b></li>
              <li>დაელოდეთ პასუხს API Key-ით და ჩაწერეთ ზემოთ მოცემულ ველში.</li>
            </ol>
          </div>
        </Card>
      </div>

      <div className="flex justify-center md:justify-end pt-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full md:w-auto px-12 py-4 rounded-2xl font-bold text-base md:text-lg shadow-xl shadow-blue-600/20"
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
      alert('ხელმისაწვდომობა წარმატებით განახლდა');
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
