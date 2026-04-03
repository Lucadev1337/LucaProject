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
import { motion, AnimatePresence } from 'motion/react';
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
  ArrowLeft,
  HelpCircle,
  ChevronLeft,
  Check
} from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, parseISO } from 'date-fns';
import { cn } from './lib/utils';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import logo from './lucasautospa.jpeg';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Types ---
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

interface PricingSettings {
  basicPrice: number;
  premiumPrice: number;
  salePercentage: number;
  isSaleActive: boolean;
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
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function MapPicker({ onLocationSelect, initialLocation }: { onLocationSelect: (address: string, lat?: number, lng?: number) => void, initialLocation?: string }) {
  const [marker, setMarker] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState(initialLocation || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
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
              placeholder="ჩაწერეთ მისამართი..."
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
            {isSearching ? '...' : 'ძებნა'}
          </Button>
        </div>
      </div>
      <div className="h-[300px] w-full rounded-3xl overflow-hidden border border-white/10 relative z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <ChangeView center={mapCenter} zoom={zoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onClick={handleMapClick} />
          {marker && <Marker position={marker} />}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 italic">დააკლიკეთ რუკაზე ზუსტი ადგილის ასარჩევად</p>
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
  const [view, setView] = useState<'public' | 'admin' | 'booking'>('public');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
          <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('public')}>
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden">
                    <img src={logo} alt="Luca's AutoSpa" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">Luca's <span className="text-blue-500">AutoSpa</span></span>
                </div>
                
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setView(view === 'admin' ? 'public' : 'admin')}
                      className="flex gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                      {view === 'admin' ? <Zap className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                      <span>{view === 'admin' ? 'საიტის ნახვა' : 'ადმინ პანელი'}</span>
                    </Button>
                  )}
                  {user ? (
                    <div className="flex items-center gap-3">
                      {!isAdmin && <span className="hidden lg:inline text-xs text-red-500 font-medium">არაადმინისტრატორი</span>}
                      <span className="hidden md:inline text-xs text-slate-400">{user.email}</span>
                      <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-slate-700" referrerPolicy="no-referrer" />
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
              <PublicSite key="public" onBookNow={() => setView('booking')} pricing={pricing} />
            ) : view === 'booking' ? (
              <BookingPage key="booking" onBack={() => setView('public')} pricing={pricing} />
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
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden">
                    <img src={logo} alt="Luca's AutoSpa" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-white font-bold text-base">Luca's AutoSpa</span>
                </div>
                <p className="text-xs leading-relaxed">
                  პრემიუმ ინტერიერის წმენდა, სასურველ მისამართზე. თქვენ ზოგავთ დროს და ენერგიას, ჩვენ მოვდივართ თქვენს მისამართზე და ვუბრუნებთ ავტომობილს პირვანდელ იერსახეს.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">მომსახურების არეალი</h4>
                <p className="text-xs">თბილისი. მოძრავი სერვისი თქვენს კართან.</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">კონტაქტი</h4>
                <div className="flex flex-col gap-2 text-xs">
                  <a href="tel:+995591952473" className="flex items-center gap-2 hover:text-blue-400">
                    <Phone className="w-3 h-3" /> +995 591 952 473
                  </a>
                  <a href="mailto:hello@lucasautospa.com" className="flex items-center gap-2 hover:text-blue-400">
                    <Mail className="w-3 h-3" /> hello@lucasautospa.com
                  </a>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto border-t border-slate-800 mt-8 pt-6 text-center text-[10px]">
              &copy; {new Date().getFullYear()} Luca's AutoSpa. ყველა უფლება დაცულია.
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

function PublicSite({ onBookNow, pricing }: { onBookNow: () => void, pricing: PricingSettings, key?: string }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroImages = [
    "https://s25180.pcdn.co/wp-content/uploads/2022/06/Interior-Detailing-Products.jpg",
    "https://i.pinimg.com/1200x/dd/4e/42/dd4e4266d0a8972dd80175f1f6250541.jpg",
    "https://i.pinimg.com/1200x/dd/4e/42/dd4e4266d0a8972dd80175f1f6250541.jpg",
    "https://i.pinimg.com/1200x/dd/4e/42/dd4e4266d0a8972dd80175f1f6250541.jpg",
    "https://i.pinimg.com/1200x/dd/4e/42/dd4e4266d0a8972dd80175f1f6250541.jpg",
    "https://i.pinimg.com/1200x/dd/4e/42/dd4e4266d0a8972dd80175f1f6250541.jpg",
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);

  const scrollToBooking = () => {
    onBookNow();
  };

  const getPrice = (base: number) => {
    if (pricing.isSaleActive) {
      return Math.round(base * (1 - pricing.salePercentage / 100));
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
      <section className="relative py-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 -z-10" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-xs font-bold mb-6 border border-blue-600/30">
              <MapPin className="w-4 h-4" />
              <span>მოძრავი სერვისი - ჩვენ მოვალთ თქვენთან!</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              ჩვენ ვაწკრიალებთ, <span className="text-blue-500">შენ არ კარგავ დროს</span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed max-w-lg">
              დეტალური ინტერიერის წმენდა შენს კართან.<br />
              პროფესიონალური ხსნარებით, მისაღებ ფასად.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-2xl shadow-xl shadow-blue-600/20" onClick={scrollToBooking}>
                დაჯავშნე ახლავე <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="rounded-2xl border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                სერვისების ნახვა
              </Button>
            </div>
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <img 
                    key={i} 
                    src={`https://picsum.photos/seed/user${i}/100/100`} 
                    className="w-10 h-10 rounded-full border-2 border-slate-900 shadow-sm" 
                    referrerPolicy="no-referrer"
                    alt=""
                  />
                ))}
              </div>
              <div className="text-sm">
                <div className="flex text-yellow-500 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                </div>
                <p className="text-slate-400 font-medium">მომსახურეობა სრული თბილისის მასშტაბით</p>
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative group"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/20 aspect-[4/3] border border-slate-800">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentSlide}
                  src={heroImages[currentSlide]} 
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-full object-cover opacity-80" 
                  referrerPolicy="no-referrer"
                  alt="Car Interior Detailing"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              
              {/* Navigation Arrows */}
              <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/50 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:scale-110 active:scale-95 z-20"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/50 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:scale-110 active:scale-95 z-20"
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
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">ბოლო შედეგი</p>
                    <p className="text-lg font-bold">პრემიუმ დითეილინგი</p>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: "სისწრაფე", desc: "სამუშაო სრულდება მაქსიმუმ 2 საათში თქვენს ლოკაციაზე." },
            { icon: ShieldCheck, title: "პროფესიონალიზმი", desc: "ვიყენებთ პრემიუმ ქიმიკატებს და ორთქლის ტექნოლოგიას." },
            { icon: MapPin, title: "მოქნილობა", desc: "ჩვენ მოვალთ თქვენს ლოკაციაზე. ნებისმიერ ადგილას, ნებისმიერ დროს." }
          ].map((f, i) => (
            <div key={i} className="flex flex-col gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">მარტივი ფასები</h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">აირჩიეთ თქვენთვის სასურველი პაკეტი. ფარული ხარჯების გარეშე.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Basic Package */}
            <Card className="flex flex-col bg-slate-900 border-slate-800 hover:border-blue-900/50 transition-colors">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 text-white">სტანდარტული წმენდა</h3>
                <div className="flex items-baseline gap-2">
                  {pricing.isSaleActive ? (
                    <>
                      <span className="text-3xl font-extrabold text-white">{getPrice(pricing.basicPrice)}₾</span>
                      <span className="text-lg text-slate-500 line-through">{pricing.basicPrice}₾</span>
                    </>
                  ) : (
                    <span className="text-3xl font-extrabold text-white">{pricing.basicPrice}₾</span>
                  )}
                  <span className="text-xs text-slate-500">/ სერვისი</span>
                </div>
                {pricing.isSaleActive && (
                  <div className="mt-2 inline-block bg-red-600/20 text-red-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    -{pricing.salePercentage}% ფასდაკლება
                  </div>
                )}
              </div>
              <ul className="flex-1 space-y-3 mb-8">
                {[
                  "სრული სალონის მტვერსასრუტით წმენდა",
                  "მტვრის მოცილება და ტილოთი წმენდა",
                  "მინების წმენდა (გარედან და შიგნიდან)",
                  "ხალიჩების წმენდა",
                  "ჰაერის არომატიზაცია"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full py-3 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800" onClick={scrollToBooking}>
                აირჩიეთ სტანდარტული
              </Button>
            </Card>

            {/* Premium Package */}
            <Card className="flex flex-col bg-slate-900 border-blue-600/50 ring-4 ring-blue-600/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider">
                ყველაზე პოპულარული
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 text-white">პრემიუმ ღრმა წმენდა</h3>
                <div className="flex items-baseline gap-2">
                  {pricing.isSaleActive ? (
                    <>
                      <span className="text-3xl font-extrabold text-white">{getPrice(pricing.premiumPrice)}₾</span>
                      <span className="text-lg text-slate-500 line-through">{pricing.premiumPrice}₾</span>
                    </>
                  ) : (
                    <span className="text-3xl font-extrabold text-white">{pricing.premiumPrice}₾</span>
                  )}
                  <span className="text-xs text-slate-500">/ სერვისი</span>
                </div>
                {pricing.isSaleActive && (
                  <div className="mt-2 inline-block bg-red-600/20 text-red-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    -{pricing.salePercentage}% ფასდაკლება
                  </div>
                )}
              </div>
              <ul className="flex-1 space-y-3 mb-8">
                {[
                  "სრული სტანდარტული პაკეტი",
                  "ფუნჯით და ქაფით პროფესიონალური წმენდა",
                  "ჭერზე ლაქების მოცილება",
                  "სიდენიების ღრმა წმენდა",
                  "ცხოველის ბეწვის მოცილება",
                  "ანტიწვიმა ყველა მინაზე"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full py-3 rounded-xl shadow-lg shadow-blue-600/20" onClick={scrollToBooking}>
                აირჩიეთ პრემიუმი
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Booking CTA Section */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-950 rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -z-0" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-0" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">მზად ხართ <span className="text-blue-500">სიახლისთვის?</span></h2>
              <p className="text-slate-400 text-base mb-10 max-w-xl mx-auto">
                ენდეთ Luca's AutoSpa-ს და დაუბრუნეთ თქვენს ავტომობილს პირვანდელი სახე.
              </p>
              <Button size="lg" className="rounded-2xl shadow-2xl shadow-blue-600/20" onClick={scrollToBooking}>
                დაჯავშნეთ ახლავე
              </Button>
              <div className="mt-10 flex flex-wrap justify-center gap-8 opacity-40">
                <div className="flex items-center gap-2 text-white">
                  <Star className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">5-ვარსკვლავიანი</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Zap className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">მოძრავი</span>
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

function BookingPage({ onBack, pricing }: { onBack: () => void, pricing: PricingSettings, key?: string }) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState<Partial<Booking>>({
    service: 'Premium',
    status: 'pending'
  });

  const getPrice = (service: 'Basic' | 'Premium') => {
    const base = service === 'Basic' ? pricing.basicPrice : pricing.premiumPrice;
    if (pricing.isSaleActive) {
      return Math.round(base * (1 - pricing.salePercentage / 100));
    }
    return base;
  };
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Verification states
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [userCode, setUserCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
      setFormError('გთხოვთ შეიყვანოთ ელ-ფოსტა ვერიფიკაციისთვის');
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
      } else {
        setFormError('ვერიფიკაციის კოდის გაგზავნა ვერ მოხერხდა');
      }
    } catch (error) {
      console.error('Send code error:', error);
      setFormError('შეცდომა კოდის გაგზავნისას');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleBookingSubmit = async () => {
    setFormError(null);
    if (!bookingData.service || !bookingData.date || !bookingData.timeSlot || !bookingData.customerName || !bookingData.phone || !bookingData.location || !bookingData.email) {
      setFormError('გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    if (!showVerification) {
      sendVerificationCode();
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
            body: JSON.stringify({ email: bookingData.email, bookingData })
          });
        } catch (e) {
          console.error('Failed to send confirmation email', e);
        }

        setIsSuccess(true);
      } else {
        setVerificationError(data.error || 'არასწორი ან ვადაგასული კოდი');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError('შეცდომა ვერიფიკაციისას');
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
        <h1 className="text-3xl font-bold mb-4 text-white">ჯავშანი დადასტურებულია!</h1>
        <p className="text-slate-400 mb-12 max-w-md">
          გმადლობთ, რომ აირჩიეთ Luca's AutoSpa. ჩვენ მივიღეთ თქვენი მოთხოვნა და მალე დაგიკავშირდებით დეტალების დასადასტურებლად.
        </p>
        <Button onClick={onBack} className="w-full max-w-xs py-4 bg-blue-600 hover:bg-blue-700">
          მთავარ გვერდზე დაბრუნება
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-950 text-slate-100 pb-32"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">დაჯავშნე შენი ავტომობილის სპა დღე</h1>
          <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <HelpCircle className="w-6 h-6 text-slate-500" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Progress Bar */}
        <div className="flex items-center justify-between px-4">
          {[
            { step: 1, label: 'პაკეტი' },
            { step: 2, label: 'დეტალები' },
            { step: 3, label: 'დადასტურება' }
          ].map((s, i) => (
            <React.Fragment key={s.step}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  step >= s.step ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-900 text-slate-500 border border-slate-800"
                )}>
                  {s.step}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  step >= s.step ? "text-white" : "text-slate-500"
                )}>{s.label}</span>
              </div>
              {i < 2 && <div className="flex-1 h-[1px] bg-slate-800 mx-4" />}
            </React.Fragment>
          ))}
        </div>

        {/* Select Service */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">აირჩიეთ სერვისი</h2>
          <div className="space-y-3">
            {[
              { 
                id: 'Basic', 
                title: 'სტანდარტული წმენდა', 
                price: getPrice('Basic'), 
                originalPrice: pricing.basicPrice,
                icon: Zap,
                details: ["სრული სალონის მტვერსასრუტით წმენდა", "მტვრის მოცილება და ტილოთი წმენდა", "მინების წმენდა (გარედან და შიგნიდან)", "ხალიჩების წმენდა", "ჰაერის არომატიზაცია"]
              },
              { 
                id: 'Premium', 
                title: 'პრემიუმ დითეილინგი', 
                price: getPrice('Premium'), 
                originalPrice: pricing.premiumPrice,
                icon: Star,
                details: ["სრული სტანდარტული პაკეტი", "ფუნჯით და ქაფით პროფესიონალური წმენდა", "ჭერზე ლაქების მოცილება", "სიდენიების ღრმა წმენდა", "ცხოველის ბეწვის მოცილება", "ანტიწვიმა ყველა მინაზე"]
              }
            ].map((s) => (
              <div key={s.id} className="space-y-2">
                <button
                  onClick={() => {
                    setBookingData({ ...bookingData, service: s.id as any });
                    setExpandedService(expandedService === s.id ? null : s.id);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-3xl border-2 transition-all text-left",
                    bookingData.service === s.id 
                      ? "bg-blue-600/10 border-blue-600 ring-1 ring-blue-600 shadow-lg shadow-blue-600/5" 
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                      bookingData.service === s.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-950 text-slate-500"
                    )}>
                      <s.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{s.title}</h3>
                      <div className="flex items-baseline gap-2">
                        <p className={cn(
                          "text-base font-bold",
                          bookingData.service === s.id ? "text-blue-400" : "text-slate-400"
                        )}>{s.price}₾</p>
                        {pricing.isSaleActive && (
                          <p className="text-xs text-slate-600 line-through">{s.originalPrice}₾</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 underline">დეტალები</span>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      bookingData.service === s.id ? "bg-blue-600 border-blue-600" : "border-slate-700"
                    )}>
                      {bookingData.service === s.id && <Check className="w-3 h-3 text-white" />}
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
                      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-2">
                        {s.details.map((detail, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                            <Check className="w-3 h-3 text-blue-500" />
                            {detail}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Choose Date & Time */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">აირჩიეთ თარიღი და დრო</h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                className="p-1 hover:bg-slate-800 rounded-full disabled:opacity-20"
              >
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <span className="text-xs font-bold uppercase text-white">{format(currentMonth, 'MMMM yyyy')}</span>
              <button 
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                disabled={currentMonth.getMonth() === new Date().getMonth() + 1}
                className="p-1 hover:bg-slate-800 rounded-full disabled:opacity-20"
              >
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Horizontal Date Picker */}
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {dates.map((date) => {
              const isSelected = bookingData.date === format(date, 'yyyy-MM-dd');
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setBookingData({ ...bookingData, date: format(date, 'yyyy-MM-dd'), timeSlot: undefined })}
                  className={cn(
                    "flex-shrink-0 w-14 h-20 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all",
                    isSelected ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  )}
                >
                  <span className="text-[10px] font-medium uppercase">{format(date, 'EEE')}</span>
                  <span className="text-lg font-bold">{format(date, 'd')}</span>
                </button>
              );
            })}
          </div>

          {/* Time Slots */}
          {bookingData.date && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] flex-1 bg-slate-800" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ხელმისაწვდომი დროები</span>
                <div className="h-[1px] flex-1 bg-slate-800" />
              </div>

              {isLoadingSlots ? (
                <div className="grid grid-cols-3 gap-3 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-900 rounded-3xl" />
                  ))}
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {availableSlots.map((slot) => {
                    const isSelected = bookingData.timeSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setBookingData({ ...bookingData, timeSlot: slot })}
                        className={cn(
                          "h-20 rounded-3xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
                          isSelected 
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                            : "bg-slate-900 border-slate-800 text-white hover:border-slate-700"
                        )}
                      >
                        <span className="text-base font-bold">{slot}</span>
                        <span className="text-[9px] font-bold opacity-50 uppercase">PM</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-900 rounded-3xl border border-dashed border-slate-800">
                  <p className="text-xs text-slate-500">ამ დღისთვის ხელმისაწვდომი დროები არ არის.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Service Location */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold">მომსახურების ადგილი</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">მისამართი</label>
              <MapPicker 
                initialLocation={bookingData.location}
                onLocationSelect={(address) => setBookingData({ ...bookingData, location: address })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">სახელი</label>
                <input 
                  type="text" 
                  placeholder="თქვენი სახელი"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 focus:border-blue-600 outline-none transition-colors text-white text-sm"
                  value={bookingData.customerName || ''}
                  onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ტელეფონი</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="tel" 
                    placeholder="+995 ..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 pl-10 focus:border-blue-600 outline-none transition-colors text-white text-sm"
                    value={bookingData.phone || ''}
                    onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ელ-ფოსტა (ვერიფიკაციისთვის)</label>
              <input 
                type="email" 
                placeholder="თქვენი@ფოსტა.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 focus:border-blue-600 outline-none transition-colors text-white text-sm"
                value={bookingData.email || ''}
                onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                disabled={showVerification}
              />
            </div>

            {showVerification && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-6 bg-blue-600/10 border border-blue-600/20 rounded-3xl"
              >
                <label className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> შეიყვანეთ 6-ნიშნა კოდი
                </label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="000000"
                  className={cn(
                    "w-full bg-white/5 border rounded-2xl p-4 text-center text-2xl font-bold tracking-[1em] focus:border-blue-600 outline-none transition-colors text-white",
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
                <p className="text-xs text-slate-400 text-center">
                  კოდი გაიგზავნა თქვენს ელ-ფოსტაზე. თუ არ მიგიღიათ, შეამოწმეთ სპამი.
                </p>
                <button 
                  onClick={() => setShowVerification(false)}
                  className="text-xs text-blue-400 hover:underline w-full text-center"
                >
                  ელ-ფოსტის შეცვლა
                </button>
              </motion.div>
            )}
          </div>
        </section>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 p-4 pb-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">ჯამი</p>
            <p className="text-xl font-extrabold text-blue-400">{bookingData.service ? getPrice(bookingData.service as any) : 0}₾</p>
          </div>
          <Button 
            onClick={handleBookingSubmit}
            disabled={isSubmitting || isSendingCode || isVerifying || !bookingData.timeSlot || !bookingData.location || !bookingData.customerName || !bookingData.email}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-bold flex gap-2 shadow-lg shadow-blue-600/20"
          >
            {isSendingCode ? 'კოდი იგზავნება...' : isVerifying ? 'მოწმდება...' : isSubmitting ? 'მუშავდება...' : (
              <>
                <Zap className="w-4 h-4" /> {showVerification ? 'ვერიფიკაცია და დაჯავშნა' : 'ჯავშნის დადასტურება'}
              </>
            )}
          </Button>
        </div>
        {formError && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 text-center mt-4 font-bold"
          >
            {formError}
          </motion.p>
        )}
      </div>

      {/* Floating Chat Button */}
      <a 
        href="https://wa.me/995591952473"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-32 right-6 z-50 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-90"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </motion.div>
  );
}

// --- Admin Dashboard ---

function AdminDashboard({ onBack, pricing }: { onBack: () => void, pricing: PricingSettings, key?: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability' | 'pricing'>('bookings');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'createdAt'>('createdAt');

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy(sortBy, 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(fetchedBookings);
      setIsLoading(false);

      // Simple migration: ensure all active bookings are in taken_slots
      fetchedBookings.forEach(async (booking) => {
        if (booking.status !== 'cancelled') {
          await setDoc(doc(db, 'taken_slots', `${booking.date}_${booking.timeSlot}`), {
            date: booking.date,
            timeSlot: booking.timeSlot,
            bookingId: booking.id
          });
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'bookings');
    });
    return unsubscribe;
  }, [sortBy]);

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    try {
      const booking = bookings.find(b => b.id === id);
      await updateDoc(doc(db, 'bookings', id), { status });
      
      // Update taken_slots if cancelled or re-activated
      if (booking) {
        if (status === 'cancelled') {
          await deleteDoc(doc(db, 'taken_slots', `${booking.date}_${booking.timeSlot}`));
        } else {
          // Ensure it exists if not cancelled
          await setDoc(doc(db, 'taken_slots', `${booking.date}_${booking.timeSlot}`), {
            date: booking.date,
            timeSlot: booking.timeSlot,
            bookingId: id
          });
        }
      }
      
      // If completed, send review request email
      if (status === 'completed' && booking) {
        try {
          await fetch('/api/send-review-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: booking.email, customerName: booking.customerName })
          });
        } catch (e) {
          console.error('Failed to send review request email', e);
        }
      }
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
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bookings/${id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 20 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">ადმინ პანელი</h1>
          <p className="text-sm text-slate-400">მართეთ თქვენი ჯავშნები და ხელმისაწვდომობა.</p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-sm">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-slate-400 text-sm px-4 outline-none border-r border-slate-800"
          >
            <option value="createdAt">ბოლო დამატებული</option>
            <option value="date">თარიღით</option>
          </select>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'bookings' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800"
            )}
          >
            ჯავშნები
          </button>
          <button 
            onClick={() => setActiveTab('availability')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'availability' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800"
            )}
          >
            ხელმისაწვდომობა
          </button>
          <button 
            onClick={() => setActiveTab('pricing')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'pricing' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800"
            )}
          >
            ფასები
          </button>
        </div>
      </div>

      {activeTab === 'bookings' ? (
        <div className="space-y-6">
          <div className="mb-8 flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-300 hover:bg-slate-900">
              <ArrowLeft className="w-4 h-4" /> საიტზე დაბრუნება
            </Button>
          </div>
          {isLoading ? (
            <div className="text-center py-20 text-slate-500">ჯავშნები იტვირთება...</div>
          ) : bookings.length === 0 ? (
            <Card className="text-center py-20 bg-slate-900 border-slate-800">
              <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">ჯავშნები ჯერ არ არის</h3>
              <p className="text-slate-500">ახალი ჯავშნები აქ გამოჩნდება.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bookings.map(booking => (
                <Card key={booking.id} className="p-0 overflow-hidden bg-slate-900 border-slate-800">
                  <div className="flex flex-col md:flex-row">
                    <div className={cn(
                      "w-full md:w-2 bg-slate-800",
                      booking.status === 'pending' && "bg-yellow-500",
                      booking.status === 'completed' && "bg-green-500",
                      booking.status === 'cancelled' && "bg-red-500"
                    )} />
                    <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <UserIcon className="w-3 h-3" /> კლიენტი
                        </div>
                        <p className="font-bold text-base text-white">{booking.customerName}</p>
                        <div className="flex flex-col text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {booking.phone}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {booking.email}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <Zap className="w-3 h-3" /> სერვისი
                        </div>
                        <p className="font-bold text-sm text-white">{booking.service === 'Premium' ? 'პრემიუმ დითეილინგი' : 'სტანდარტული წმენდა'}</p>
                        <p className="text-xs text-slate-400">
                          {booking.service === 'Basic' ? pricing.basicPrice : pricing.premiumPrice}₾
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <Calendar className="w-3 h-3" /> თარიღი და დრო
                        </div>
                        <p className="font-bold text-sm text-white">{format(parseISO(booking.date), 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {booking.timeSlot}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <MapPin className="w-3 h-3" /> მდებარეობა
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">{booking.location}</p>
                      </div>
                    </div>
                    <div className="bg-slate-950 p-5 flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-800">
                      {booking.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => updateBookingStatus(booking.id!, 'completed')} className="bg-green-600 hover:bg-green-700">
                            დასრულება
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateBookingStatus(booking.id!, 'cancelled')} className="text-red-400 hover:bg-red-900/20">
                            გაუქმება
                          </Button>
                        </>
                      )}
                      {booking.status !== 'pending' && (
                        <div className={cn(
                          "px-4 py-2 rounded-lg text-sm font-bold text-center",
                          booking.status === 'completed' ? "bg-green-900/20 text-green-400 border border-green-900/50" : "bg-red-900/20 text-red-400 border border-red-900/50"
                        )}>
                          {booking.status === 'completed' ? 'დასრულებული' : 'გაუქმებული'}
                        </div>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteBooking(booking.id!)} className="text-slate-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'availability' ? (
        <AvailabilityManager onBack={onBack} />
      ) : (
        <PricingManager pricing={pricing} onBack={onBack} />
      )}
    </motion.div>
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
            <h3 className="text-xl font-bold text-white">სტანდარტული წმენდა</h3>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ფასი (₾)</label>
            <input 
              type="number"
              value={localPricing.basicPrice}
              onChange={(e) => setLocalPricing({ ...localPricing, basicPrice: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
            />
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
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ფასი (₾)</label>
            <input 
              type="number"
              value={localPricing.premiumPrice}
              onChange={(e) => setLocalPricing({ ...localPricing, premiumPrice: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
            />
          </div>
        </Card>

        {/* Sale Settings */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">ფასდაკლების პარამეტრები</h3>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ფასდაკლების პროცენტი (%)</label>
              <input 
                type="number"
                value={localPricing.salePercentage}
                onChange={(e) => setLocalPricing({ ...localPricing, salePercentage: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
              />
            </div>
            <div className="p-4 bg-blue-600/5 border border-blue-600/10 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-black">?</span>
              </div>
              <p className="text-xs text-slate-400">
                ფასდაკლება ავტომატურად აისახება ყველა სერვისზე საიტზე და ჯავშნის გვერდზე.
              </p>
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-300 hover:bg-slate-900">
          <ArrowLeft className="w-4 h-4" /> საიტზე დაბრუნება
        </Button>
        <h2 className="text-2xl font-bold text-white">ადმინ პანელი</h2>
      </div>
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-xl font-bold mb-6 text-white">ხელმისაწვდომობის მართვა</h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">აირჩიეთ თარიღი</label>
            <input 
              type="date" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-white text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ხელმისაწვდომი დროები: {format(parseISO(selectedDate), 'MMMM dd')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {timeOptions.map(time => (
                <button
                  key={time}
                  onClick={() => toggleSlot(time)}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-medium transition-all",
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

          <Button className="w-full py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/20" onClick={saveAvailability} disabled={isSaving}>
            {isSaving ? 'ინახება...' : 'შენახვა'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
