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
  deleteDoc,
  getDocFromServer
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
  ChevronDown,
  PlusCircle,
  Edit3,
  Car,
  History,
  Search,
  Filter,
  Info
} from 'lucide-react';
import { format, addDays, subDays, startOfToday, isSameDay, parseISO, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { ka, ru } from 'date-fns/locale';
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
type Language = 'GE' | 'EN' | 'RU';

const translations = {
  GE: {
    socialMedia: "სოციალური ქსელები",
    heroBadge: "მოძრავი სერვისი - ჩვენ მოვალთ თქვენთან!",
    heroTitle: "ჩვენ ვაწკრიალებთ, ",
    heroTitleSpan: "შენ ზოგავ დროს",
    heroDesc: "ავტომობილის დეტალური ინტერიერის ქიმწმენდა თქვენს მისამართზე. პროფესიონალური საშუალებებით, მისაღებ ფასად.",
    bookNow: "დაჯავშნე ონლაინ",
    bookPhone: "დაჯავშნე ტელეფონზე",
    viewServices: "სერვისების ნახვა",
    lastResult: "ბოლო შედეგი",
    detailingService: "ავტომობილის დეტალური ქიმწმენდა",
    features: [
      { title: "სისწრაფე", desc: "სამუშაო სრულდება მაქსიმუმ 3 საათში თქვენს ლოკაციაზე." },
      { title: "პროფესიონალიზმი", desc: "ვიყენებთ პრემიუმ ხარისხის ხსნარებს და ხელსაწყოებს." },
      { title: "მოქნილობა", desc: "ჩვენ მოვალთ თქვენს ლოკაციაზე. ნებისმიერ ადგილას, ნებისმიერ დროს." }
    ],
    pricingTitle: "მისაღები ფასები",
    pricingDesc: "პროფესიონალური დითეილინგი თქვენს მისამართზე.",
    perService: "/ სერვისი ადგილზე",
    sale: "ფასდაკლება",
    selectService: "დაჯავშნა",
    readyForNew: "მზად ხართ ",
    readyForNewSpan: "სიახლისთვის?",
    ctaDesc: "ენდეთ Luca's AutoSpa-ს და დაუბრუნეთ თქვენს ავტომობილს პირვანდელი სახე.",
    fiveStar: "5-ვარსკვლავიანი",
    googleReviews: "მომხმარებლების შეფასებები",
    mobile: "მოძრავი",
    footerDesc: "ინტერიერის დეტალური ქიმწმენდა (დითეილინგი) თქვენთვის სასურველ მისამართზე. დაზოგეთ დრო და ენერგია, ჩვენ დავუბრუნებთ თქვენს ავტომობილს პირვანდელი იერსახეს.",
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
    codeSent: "კოდი გამოიგზავნა თქვენს მიერ არჩეული მეთოდით.",
    changeEmail: "მონაცემების შეცვლა",
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
    chooseVerificationMethod: "აირჩიეთ დადასტურების მეთოდი",
    whatsapp: "WhatsApp",
    viber: "Viber",
    email: "Email",
    codeSentVia: "კოდი გამოიგზავნა: ",
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
      "პროფესიონალური საშუალებებით და ფუნჯით ღრმა ქიმწმენდა",
      "ჭერზე ლაქების მოცილება",
      "სავარძლების ღრმა წმენდა",
      "ყველა დეტალის სიღრმისეული დამუშავება",
      "მინების წმენდა",
      "ხალიჩების ქიმწმენდა",
      "ჰაერის არომატიზაცია"
    ],
    next: "შემდეგი",
    howItWorks: "როგორ ვმუშაობთ",
    steps: [
      { title: "დაჯავშნა", desc: "აირჩიეთ სასურველი სერვისი და დრო ონლაინ." },
      { title: "მოვდივართ თქვენთან", desc: "ჩვენი გუნდი მოვა თქვენს მისამართზე საჭირო აღჭურვილობით." },
      { title: "ისიამოვნეთ შედეგით", desc: "მიიღეთ იდეალურად სუფთა ავტომობილი სახლიდან გაუსვლელად." }
    ],
    terms: {
      spaName: "Luca’s AutoSpa",
      sections: [
        {
          title: "1. ზოგადი ინფორმაცია",
          content: "Luca’s AutoSpa წარმოადგენს მოძრავ სერვისს, რომელიც უზრუნველყოფს ავტომობილის ინტერიერის პროფესიონალურ წმენდას თბილისში. სერვისის გამოყენებით მომხმარებელი ავტომატურად ეთანხმება ქვემოთ ჩამოთვლილ წესებსა და პირობებს."
        },
        {
          title: "2. სერვისის აღწერა",
          subtitle: "2.1 ინტერიერის დეტალური ქიმწმენდა",
          listTitle: "მომსახურება მოიცავს:",
          items: [
            "სრული სალონის მტვერსასრუტით წმენდა",
            "მინების წმენდა",
            "ხალიჩების წმენდა",
            "ჰაერის არომატიზაცია",
            "პროფესიონალური ქაფით და ფუნჯით ღრმა წმენდა",
            "ჭერზე ლაქების მოცილება",
            "სავარძლების ღრმა წმენდა"
          ]
        },
        {
          title: "3. მომსახურების პირობები",
          items: [
            "სერვისი ხორციელდება მხოლოდ თბილისის ტერიტორიაზე",
            "Luca’s AutoSpa უზრუნველყოფს მომსახურებას კლიენტის მიერ მითითებულ ლოკაციაზე",
            "კლიენტი ვალდებულია უზრუნველყოს:",
            {
              subItems: [
                "საკმარისი ადგილი ჩვენი სერვისის ავტომობილის გვერდზე დაყენებისთვის დენის მიწოდების მიზნით"
              ]
            }
          ]
        },
        {
          title: "4. გადახდა",
          items: [
            "გადახდა ხდება ადგილზე:",
            {
              subItems: [
                "ნაღდი ანგარიშსწორებით",
                "ან საბანკო გადარიცხვით"
              ]
            },
            "Luca’s AutoSpa იტოვებს უფლებას შეცვალოს ფასი ადგილზე, თუ ავტომობილის მდგომარეობა მნიშვნელოვნად განსხვავდება წინასწარ აღწერილისგან"
          ]
        },
        {
          title: "5. ჯავშნის გაუქმება და გადადება",
          items: [
            "კლიენტმა უნდა გააუქმოს ჯავშანი მინიმუმ 2 საათით ადრე",
            "დაგვიანებული გაუქმების შემთხვევაში, კლიენტი ვალდებულია გადაიხადოს სერვისის 50%",
            "Luca’s AutoSpa იტოვებს უფლებას გადადოს ან გააუქმოს სერვისი:",
            {
              subItems: [
                "ცუდი ამინდის პირობებში",
                "ტექნიკური პრობლემების შემთხვევაში"
              ]
            }
          ]
        },
        {
          title: "6. დაგვიანება",
          items: [
            "თუ კლიენტი აგვიანებს 15 წუთზე მეტით,",
            {
              subItems: [
                "ჯავშანი ავტომატურად გაუქმდება",
                "კლიენტს ეკისრება სერვისის 100% გადახდა"
              ]
            },
            "თუ Luca’s AutoSpa ვერ ახერხებს დროულად მისვლას,",
            {
              subItems: [
                "კლიენტს უფლება აქვს გააუქმოს ჯავშანი ყოველგვარი გადასახადის გარეშე"
              ]
            }
          ]
        },
        {
          title: "7. პასუხისმგებლობა",
          items: [
            "კლიენტი ვალდებულია სერვისის დასრულებისთანავე შეამოწმოს ავტომობილი",
            "Luca’s AutoSpa არ აგებს პასუხს იმ დაზიანებებზე, რომლებიც დაფიქსირდება თანამშრომლის წასვლის შემდეგ",
            "Luca’s AutoSpa არ არის პასუხისმგებელი:",
            {
              subItems: [
                "უკვე არსებულ დაზიანებებზე",
                "ძველ, ღრმად გამჯდარ ლაქებზე",
                "ბუნებრივი ცვეთის შედეგად წარმოქმნილ დეფექტებზე",
                "ავტომობილის ელექტრონიკის შესაძლო გაუმართაობაზე, თუ დაზიანება არ არის პირდაპირ გამოწვეული დაუდევრობით"
              ]
            }
          ]
        },
        {
          title: "8. ავტომობილში არსებული ნივთები",
          items: [
            "კლიენტი ვალდებულია მომსახურებამდე ამოიღოს ავტომობილიდან ყველა პირადი და ძვირფასი ნივთი",
            "Luca’s AutoSpa არ აგებს პასუხს დაკარგულ ან დაზიანებულ ნივთებზე"
          ]
        },
        {
          title: "9. მომსახურებაზე უარის თქმის უფლება",
          content: "Luca’s AutoSpa იტოვებს უფლებას უარი თქვას სერვისის შესრულებაზე, თუ:",
          items: [
            "ავტომობილი არის უკიდურესად ბინძური",
            "არსებობს ბიოლოგიური ან ჯანმრთელობისთვის საშიში გარემო"
          ]
        },
        {
          title: "10. დამატებითი საფასური",
          content: "განსაკუთრებულად დაბინძურებული ავტომობილის შემთხვევაში, Luca’s AutoSpa-ს აქვს უფლება:",
          items: [
            "შესთავაზოს დამატებითი საფასური",
            "ან უარი თქვას მომსახურებაზე"
          ]
        },
        {
          title: "11. შედეგის შეზღუდვა",
          items: [
            "Luca’s AutoSpa არ იძლევა გარანტიას ყველა ლაქის 100%-იან მოცილებაზე",
            "ზოგიერთი ლაქა შეიძლება იყოს მუდმივი და არ ექვემდებარებოდეს სრულად გაწმენდას"
          ]
        },
        {
          title: "12. ფოტო და ვიდეო მასალა",
          content: "სერვისის გამოყენებით, კლიენტი ავტომატურად აძლევს Luca’s AutoSpa-ს უფლებას გადაიღოს ავტომობილის ფოტო და ვიდეო მასალა და გამოიყენოს იგი მარკეტინგული მიზნებისთვის (სოციალური ქსელები, რეკლამა)."
        },
        {
          title: "13. ონლაინ ჯავშანი და მონაცემები",
          items: [
            "ვებსაიტზე (www.lucasautospa.ge) ჯავშნის გაკეთებით მომხმარებელი ეთანხმება ამ წესებს",
            "საიტი შეიძლება იყენებდეს ქუქიებს (Cookies) მომხმარებლისთვის სერვისის გაუმჯობესებისთვის",
            "მომხმარებლის მონაცემები გამოიყენება მხოლოდ სერვისის მიწოდების მიზნით და არ გადაეცემა მესამე პირებს"
          ]
        },
        {
          title: "14. ცვლილებები",
          content: "Luca’s AutoSpa იტოვებს უფლებას ნებისმიერ დროს შეცვალოს აღნიშნული წესები და პირობები წინასწარი შეტყობინების გარეშე."
        }
      ]
    }
  },
  EN: {
    socialMedia: "Social Media",
    heroBadge: "Mobile Service - We come to you!",
    heroTitle: "We clean at your location, ",
    heroTitleSpan: "you save precious time",
    heroDesc: "Detailed interior cleaning at your doorstep. At an affordable price.",
    bookNow: "Book Online",
    bookPhone: "Book by Phone",
    viewServices: "View Services",
    lastResult: "Last Result",
    detailingService: "Detailed Interior Dry Cleaning",
    features: [
      { title: "Speed", desc: "Work is completed in maximum 3 hours at your location." },
      { title: "Professionalism", desc: "We use premium chemicals and tools." },
      { title: "Flexibility", desc: "We come to your location. Anywhere, anytime." }
    ],
    pricingTitle: "Affordable Price",
    pricingDesc: "Professional detailing at your desired address.",
    perService: "/ on-site service",
    sale: "Sale",
    selectService: "Book Now",
    readyForNew: "Ready for ",
    readyForNewSpan: "something new?",
    ctaDesc: "Trust Luca's AutoSpa and give your car its original look back.",
    fiveStar: "5-Star",
    googleReviews: "Google Reviews",
    mobile: "Mobile",
    footerDesc: "Detailed interior detailing at your doorstep. You save time and energy, we come to your address and restore your car's original look.",
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
    codeSent: "Code has been sent via your chosen method.",
    changeEmail: "Change Details",
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
    chooseVerificationMethod: "Choose Verification Method",
    whatsapp: "WhatsApp",
    viber: "Viber",
    email: "Email",
    codeSentVia: "Code sent via: ",
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
      "Professional brush and foam cleaning",
      "Ceiling stain removal",
      "Deep seat cleaning",
      "Thorough cleaning of all details",
      "Glass cleaning",
      "Mat cleaning",
      "Air freshening"
    ],
    next: "Next",
    howItWorks: "How it works",
    steps: [
      { title: "Booking", desc: "Choose your desired service and time online." },
      { title: "We come to you", desc: "Our team will come to your address with the necessary equipment." },
      { title: "Enjoy the result", desc: "Get a perfectly clean car without leaving your home." }
    ],
    terms: {
      spaName: "Luca’s AutoSpa",
      sections: [
        {
          title: "1. General Information",
          content: "Luca’s AutoSpa is a mobile service providing professional car interior cleaning in Tbilisi. By using the service, the user automatically agrees to the terms and conditions listed below."
        },
        {
          title: "2. Service Description",
          subtitle: "2.1 Detailed Interior Dry Cleaning",
          listTitle: "The service includes:",
          items: [
            "Full interior vacuuming",
            "Glass cleaning",
            "Mat cleaning",
            "Air freshening",
            "Professional foam and brush deep cleaning",
            "Ceiling stain removal",
            "Deep seat cleaning"
          ]
        },
        {
          title: "3. Service Conditions",
          items: [
            "Service is provided only within the territory of Tbilisi",
            "Luca’s AutoSpa provides service at the location specified by the client",
            "The client is responsible for providing:",
            {
              subItems: [
                "Sufficient space to park our service vehicle alongside for power supply purposes"
              ]
            }
          ]
        },
        {
          title: "4. Payment",
          items: [
            "Payment is made on-site:",
            {
              subItems: [
                "By cash",
                "Or by bank transfer"
              ]
            },
            "Luca’s AutoSpa reserves the right to change the price on-site if the car's condition differs significantly from the preliminary description"
          ]
        },
        {
          title: "5. Booking Cancellation and Rescheduling",
          items: [
            "The client must cancel the booking at least 2 hours in advance",
            "In case of late cancellation, the client is obliged to pay 50% of the service fee",
            "Luca’s AutoSpa reserves the right to postpone or cancel the service:",
            {
              subItems: [
                "In case of bad weather conditions",
                "In case of technical problems"
              ]
            }
          ]
        },
        {
          title: "6. Late Arrival",
          items: [
            "If the client is late by more than 15 minutes,",
            {
              subItems: [
                "The booking will be automatically cancelled",
                "The client is responsible for paying 100% of the service fee"
              ]
            },
            "If Luca’s AutoSpa is unable to arrive on time,",
            {
              subItems: [
                "The client has the right to cancel the booking without any charge"
              ]
            }
          ]
        },
        {
          title: "7. Responsibility",
          items: [
            "The client is obliged to check the car immediately upon completion of the service",
            "Luca’s AutoSpa is not responsible for damages recorded after the employee's departure",
            "Luca’s AutoSpa is not responsible for:",
            {
              subItems: [
                "Pre-existing damages",
                "Old, deeply embedded stains",
                "Defects resulting from natural wear and tear",
                "Possible malfunctions of the car's electronics, unless the damage is directly caused by negligence"
              ]
            }
          ]
        },
        {
          title: "8. Items in the Car",
          items: [
            "The client is obliged to remove all personal and valuable items from the car before the service",
            "Luca’s AutoSpa is not responsible for lost or damaged items"
          ]
        },
        {
          title: "9. Right to Refuse Service",
          content: "Luca’s AutoSpa reserves the right to refuse the service if:",
          items: [
            "The car is extremely dirty",
            "There is a biological or health-hazardous environment"
          ]
        },
        {
          title: "10. Additional Fees",
          content: "In case of an exceptionally dirty car, Luca’s AutoSpa has the right to:",
          items: [
            "Offer an additional fee",
            "Or refuse service"
          ]
        },
        {
          title: "11. Result Limitation",
          items: [
            "Luca’s AutoSpa does not guarantee 100% removal of all stains",
            "Some stains may be permanent and not subject to complete cleaning"
          ]
        },
        {
          title: "12. Photo and Video Material",
          content: "By using the service, the client automatically gives Luca’s AutoSpa the right to take photos and videos of the car and use them for marketing purposes (social networks, advertising)."
        },
        {
          title: "13. Online Booking and Data",
          items: [
            "By making a booking on the website (www.lucasautospa.ge), the user agrees to these rules",
            "The site may use cookies (Cookies) to improve the service for the user",
            "User data is used only for the purpose of providing the service and is not transferred to third parties"
          ]
        },
        {
          title: "14. Changes",
          content: "Luca’s AutoSpa reserves the right to change these terms and conditions at any time without prior notice."
        }
      ]
    }
  },
  RU: {
    socialMedia: "Социальные сети",
      heroBadge: "Мобильный сервис - Мы приедем к вам!",
      heroTitle: "Мы чистим на месте, ",
      heroTitleSpan: "вы экономите время",
      heroDesc: "Детальная химчистка салона автомобиля по вашему адресу. Профессиональными средствами, по доступной цене.",
      bookNow: "Забронировать онлайн",
      bookPhone: "Забронировать по телефону",
      viewServices: "Посмотреть услуги",
      lastResult: "Последний результат",
      detailingService: "Детальная химчистка салона",
      features: [
        { title: "Скорость", desc: "Работа выполняется максимум за 3 часа на вашем месте." },
        { title: "Профессионализм", desc: "Мы используем химию и инструменты премиум-класса." },
        { title: "Гибкость", desc: "Мы приедем к вам. В любое место, в любое время." }
      ],
      pricingTitle: "Доступные цены",
      pricingDesc: "Профессиональный детейлинг по вашему адресу.",
      perService: "/ услуга на месте",
      sale: "Скидка",
      selectService: "Забронировать",
      readyForNew: "Готовы к ",
      readyForNewSpan: "новому?",
      ctaDesc: "Доверьтесь Luca's AutoSpa и верните своему автомобилю первозданный вид.",
      fiveStar: "5 звезд",
      googleReviews: "Отзывы клиентов",
      mobile: "Мобильный",
      footerDesc: "Детальная химчистка (детейлинг) салона по вашему адресу. Экономьте время и энергию, мы приедем к вам и вернем вашему авто первозданный вид.",
      serviceArea: "Зона обслуживания",
      serviceAreaDesc: "Тбилиси. Мобильный сервис у вашей двери.",
      contact: "Контакт",
      rights: "Все права защищены.",
      adminPanel: "Панель админа",
      viewSite: "На сайт",
      details: "Детали",
      chooseDate: "Выберите дату и время",
      availableTimes: "Доступное время",
      location: "Место обслуживания",
      address: "Адрес",
      name: "Имя",
      phone: "Телефон",
      enterCode: "Введите 6-значный код",
      codeSent: "Код был отправлен выбранным вами способом.",
      changeEmail: "Изменить данные",
      total: "Итого",
      confirmBooking: "Подтвердить бронь",
      verifyingBtn: "Проверить и забронировать",
      bookingConfirmed: "Бронирование подтверждено!",
      successDesc: "Спасибо, что выбрали Luca's AutoSpa. Мы получили ваш запрос и скоро свяжемся с вами для подтверждения деталей.",
      backToHome: "Вернуться на главную",
      searchAddress: "Введите адрес...",
      search: "Поиск",
      clickMap: "Кликните на карту, чтобы выбрать точное местопололожение",
      sendCode: "Отправить код",
      verification: "Верификация",
      sendingCode: "Код отправляется...",
      chooseVerificationMethod: "Выберите способ верификации",
      whatsapp: "WhatsApp",
      viber: "Viber",
      email: "Email",
      codeSentVia: "Код отправлен через: ",
      verifying: "Проверка...",
      processing: "Обработка...",
      noTimes: "На этот день нет доступного времени.",
      namePlaceholder: "Ваше имя",
      detailsLink: "Детали",
      chooseService: "Выберите услугу",
      invalidCode: "Неверный или просроченный код",
      verificationError: "Ошибка верификации",
      sendCodeError: "Не удалось отправить код верификации",
      generalError: "Ошибка при отправке кода",
      fillAllFields: "Пожалуйста, заполните все обязательные поля",
      termsOfService: "Правила и условия",
      agreeToTerms: "Я согласен с правилами и условиями",
      readTerms: "Прочитать правила и условия",
      acceptAndConfirm: "Принять и подтвердить",
      carModel: "Модель автомобиля",
      carModelPlaceholder: "Напр: Toyota Camry",
      errorService: "Пожалуйста, выберите услугу",
      errorDateTime: "Пожалуйста, выберите дату и время",
      errorLocation: "Пожалуйста, укажите адрес обслуживания",
      errorPersonalInfo: "Пожалуйста, заполните контактную информацию",
      errorTerms: "Пожалуйста, согласитесь с правилами и условиями",
      cancel: "Отмена",
      termsTitle: "Правила и условия",
      bestValue: "Лучшая цена",
      secure: "Безопасно",
      fast: "Быстро",
      premium: "Высокое качество",
      standardDetails: [
        "Полная очистка салона пылесосом",
        "Глубокая химчистка профессиональной пеной и щеткой",
        "Удаление пятен с потолка",
        "Глубокая чистка сидений",
        "Тщательная обработка всех деталей",
        "Чистка стекол",
        "Чистка ковриков",
        "Ароматизация воздуха"
      ],
      next: "Далее",
      howItWorks: "Как это работает",
      steps: [
        { title: "Бронирование", desc: "Выберите услугу и время онлайн." },
        { title: "Приезжаем к вам", desc: "Наша команда приедет по вашему адресу со всем необходимым оборудованием." },
        { title: "Результат", desc: "Получите идеально чистый автомобиль, не выходя из дома." }
      ],
      terms: {
        spaName: "Luca’s AutoSpa",
        sections: [
          {
            title: "1. Общая информация",
            content: "Luca's AutoSpa — это мобильный сервис, предоставляющий профессиональную химчистку салона автомобиля в Тбилиси. Используя сервис, пользователь автоматически соглашается с условиями, перечисленными ниже."
          },
          {
            title: "2. Описание услуг",
            subtitle: "2.1 Детальная сухая химчистка салона",
            listTitle: "Услуга включает в себя:",
            items: [
              "Полная чистка салона пылесосом",
              "Чистка стекол",
              "Чистка ковриков",
              "Ароматизация воздуха",
              "Глубокая чистка профессиональной пеной и щеткой",
              "Удаление пятен с потолка",
              "Глубокая чистка сидений"
            ]
          },
          {
            title: "3. Условия обслуживания",
            items: [
              "Услуга предоставляется только на территории Тбилиси",
              "Luca’s AutoSpa предоставляет услуги по адресу, указанному клиентом",
              "Клиент несет ответственность за предоставление:",
              {
                subItems: [
                  "Достаточного места для парковки нашего сервисного автомобиля рядом для целей электроснабжения"
                ]
              }
            ]
          },
          {
            title: "4. Оплата",
            items: [
              "Оплата производится на месте:",
              {
                subItems: [
                  "Наличными",
                  "Или банковским переводом"
                ]
              },
              "Luca’s AutoSpa оставляет за собой право изменить цену на месте, если состояние автомобиля существенно отличается от предварительного описания"
            ]
          },
          {
            title: "5. Отмена и перенос бронирования",
            items: [
              "Клиент должен отменить бронирование не менее чем за 2 часа",
              "В случае поздней отмены клиент обязан оплатить 50% стоимости услуги",
              "Luca’s AutoSpa оставляет за собой право перенести или отменить обслуживание:",
              {
                subItems: [
                  "В случае плохих погодных условий",
                  "В случае технических проблем"
                ]
              }
            ]
          },
          {
            title: "6. Опоздание",
            items: [
              "Если клиент опаздывает более чем на 15 минут,",
              {
                subItems: [
                  "Бронирование будет автоматически аннулировано",
                  "Клиент несет ответственность за оплату 100% стоимости услуги"
                ]
              },
              "Если Luca’s AutoSpa не может прибыть вовремя,",
              {
                subItems: [
                  "Клиент имеет право отменить бронирование без какой-либо оплаты"
                ]
              }
            ]
          },
          {
            title: "7. Ответственность",
            items: [
              "Клиент обязан проверить автомобиль сразу после завершения услуги",
              "Luca’s AutoSpa не несет ответственности за повреждения, зафиксированные после отъезда сотрудника",
              "Luca’s AutoSpa не несет ответственности за:",
              {
                subItems: [
                  "Ранее существовавшие повреждения",
                  "Старые, глубоко въевшиеся пятна",
                  "Дефекты, возникшие в результате естественного износа",
                  "Возможные неисправности электроники автомобиля, за исключением случаев, когда ущерб вызван непосредственно небрежностью"
                ]
              }
            ]
          },
          {
            title: "8. Вещи в машине",
            items: [
              "Клиент обязан убрать все личные и ценные вещи из машины перед началом обслуживания",
              "Luca’s AutoSpa не несет ответственности за потерянные или поврежденные вещи"
            ]
          },
          {
            title: "9. Право на отказ в обслуживании",
            content: "Luca’s AutoSpa оставляет за собой право отказать в обслуживании, если:",
            items: [
              "Машина очень грязная",
              "Существует биологическая или опасная для здоровья среда"
            ]
          },
          {
            title: "10. Дополнительные сборы",
            content: "В случае исключительно грязного автомобиля Luca’s AutoSpa имеет право:",
            items: [
              "Предложить дополнительную плату",
              "Или отказать в обслуживании"
            ]
          },
          {
            title: "11. Ограничение результата",
            items: [
              "Luca’s AutoSpa не гарантирует 100% удаление всех пятен",
              "Некоторые пятна могут быть постоянными и не подлежать полной очистке"
            ]
          },
          {
            title: "12. Фото и видео материалы",
            content: "Пользуясь услугой, клиент автоматически дает Luca’s AutoSpa право делать фото и видео автомобиля и использовать их в маркетинговых целях (социальные сети, реклама)."
          },
          {
            title: "13. Онлайн-бронирование и данные",
            items: [
              "Совершая бронирование на сайте (www.lucasautospa.ge), пользователь соглашается с этими правилами",
              "Сайт может использовать файлы cookie (Cookies) для улучшения работы сервиса для пользователя",
              "Данные пользователя используются только для целей предоставления услуги и не передаются третьим лицам"
            ]
          },
          {
            title: "14. Изменения",
            content: "Luca’s AutoSpa оставляет за собой право изменять эти правила и условия в любое время без предварительного уведомления."
          }
        ]
      }
    }
};

interface Booking {
  id: string;
  customerName: string;
  carModel: string;
  phone: string;
  email?: string;
  service: string;
  date: string;
  timeSlot: string;
  location: string;
  lat?: number;
  lng?: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
  finalPrice?: number;
  fuelFee?: number;
  distance?: number;
  promoCode?: string | null;
  discountAmount?: number;
  addons?: string[];
}

interface Addon {
  id: string;
  nameGE: string;
  nameEN: string;
  nameRU: string;
  descriptionGE: string;
  descriptionEN: string;
  descriptionRU: string;
  price: number;
  active: boolean;
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

interface Client {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

interface Car {
  id: string;
  brand: string;
  model: string;
  year?: string;
  licensePlate: string;
  color?: string;
  notes?: string;
}

interface PricingSettings {
  price: number;
  salePercentage: number;
  isSaleActive: boolean;
  pricePerKm?: number;
  baseLocation?: { lat: number; lng: number };
  heroReviews?: HeroReview[];
  isSmsEnabled?: boolean;
  verificationMethod?: 'sms' | 'email';
  isViberVerificationEnabled?: boolean;
  isEmailVerificationEnabled?: boolean;
  smsProvider?: 'twilio' | 'smsto' | 'vonage' | 'wasender';
  waSenderApiKey?: string;
  waSenderInstanceId?: string;
  twilioSid?: string;
  twilioToken?: string;
  twilioFrom?: string;
  vonageApiKey?: string;
  vonageApiSecret?: string;
  smsSender?: string;
  reviewLink?: string;
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

// --- Utilities ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function AdminBaseMap({ location, onChange }: { location: { lat: number, lng: number }, onChange: (loc: { lat: number, lng: number }) => void }) {
  return (
    <div className="h-64 rounded-2xl overflow-hidden border border-white/5 relative group">
      <MapContainer 
        center={[location.lat, location.lng]} 
        zoom={13} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <Marker position={[location.lat, location.lng]} />
        <MapEvents onClick={(e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng })} />
        <ChangeView center={[location.lat, location.lng]} zoom={13} />
      </MapContainer>
      <div className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-white/10 shadow-xl pointer-events-none">
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Base Point Chosen</span>
      </div>
    </div>
  );
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

const getLangValue = (lang: Language, ge: any, en: any, ruText: any) => {
  if (lang === 'GE') return ge;
  if (lang === 'EN') return en;
  return ruText || en;
};

const getDateLocale = (lang: Language) => {
  if (lang === 'GE') return ka;
  if (lang === 'RU') return ru;
  return undefined;
};

const Card = ({ children, className, ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div className={cn('bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-5 text-slate-100', className)} {...props}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'public' | 'admin' | 'booking' | 'terms' | 'confirmation'>('public');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lang, setLang] = useState<Language>('GE');
  const [isLangSelected, setIsLangSelected] = useState(false);

  const t = translations[lang];
  const [isPricingLoading, setIsPricingLoading] = useState(true);

  // Firestore Connection Test
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'settings', 'pricing'));
        console.log("Firestore connection verified successfully.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration: the client is offline.");
        } else {
          console.error("Firestore connectivity issue:", error);
        }
      }
    };
    testConnection();
  }, []);

  const [pricing, setPricing] = useState<PricingSettings>({
    price: 59,
    salePercentage: 20,
    isSaleActive: false,
    pricePerKm: 2,
    baseLocation: { lat: 41.7151, lng: 44.8271 }, // Default to Tbilisi
    isSmsEnabled: true,
    verificationMethod: 'sms'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      console.log("Current User UID:", u?.uid);
      if (u && u.email?.toLowerCase() === 'luca.mergell@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    // Check if language is already selected in localStorage
    const savedLang = localStorage.getItem('preferredLang') as Language;
    if (savedLang && (savedLang === 'GE' || savedLang === 'EN' || savedLang === 'RU')) {
      setLang(savedLang);
      setIsLangSelected(true);
    }

    // Check URL parameters for view
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'confirmation') {
      setView('confirmation');
      setIsLangSelected(true); // Don't block confirmation page with language selector
    }

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

  const handleLanguageSelect = (selectedLang: Language) => {
    setLang(selectedLang);
    setIsLangSelected(true);
    localStorage.setItem('preferredLang', selectedLang);
  };

  if (!isLangSelected) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md text-center"
        >
          <div className="flex justify-center mb-10">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20 border border-white/10 p-1 bg-slate-900">
               <img src={logo} alt="Luca's AutoSpa" className="w-full h-full object-cover rounded-[1.2rem]" />
            </div>
          </div>
          
          <h1 className="text-3xl font-black tracking-tight text-white mb-2 font-orbitron uppercase">
            LUCA'S AUTOSPA
          </h1>
          <p className="text-slate-400 mb-10 tracking-widest text-[10px] font-black uppercase">
            Mobile Car Detailing In Tbilisi
          </p>

          <div className="grid gap-4">
            <button 
              onClick={() => handleLanguageSelect('GE')}
              className="group relative flex items-center justify-between p-6 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-[2rem] transition-all duration-300 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/5 shadow-lg group-hover:scale-110 transition-transform">
                  <img src="https://flagcdn.com/w80/ge.png" alt="GE" className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <p className="text-white font-black text-lg">ქართული</p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Georgia</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-blue-500/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={() => handleLanguageSelect('EN')}
              className="group relative flex items-center justify-between p-6 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-[#30c3fc]/50 rounded-[2rem] transition-all duration-300 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/5 shadow-lg group-hover:scale-110 transition-transform">
                  <img src="https://flagcdn.com/w80/gb.png" alt="EN" className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <p className="text-white font-black text-lg">English</p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">United Kingdom</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-[#30c3fc] group-hover:translate-x-1 transition-all" />
               {/* Glow effect on hover */}
               <div className="absolute inset-0 bg-[#30c3fc]/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={() => handleLanguageSelect('RU')}
              className="group relative flex items-center justify-between p-6 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-[#facc15]/50 rounded-[2rem] transition-all duration-300 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/5 shadow-lg group-hover:scale-110 transition-transform">
                  <img src="https://flagcdn.com/w80/ru.png" alt="RU" className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <p className="text-white font-black text-lg">Русский</p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Russia</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-[#facc15] group-hover:translate-x-1 transition-all" />
               {/* Glow effect on hover */}
               <div className="absolute inset-0 bg-[#facc15]/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
          
          <div className="mt-16 text-slate-600 flex items-center justify-center gap-2">
             <ShieldCheck className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Secure & Professional Service</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn(
        "min-h-screen font-sans transition-colors duration-300 bg-slate-950 text-slate-100",
        lang === 'GE' && "lang-ge"
      )}>
        {/* Navigation - Hidden on booking/confirmation page */}
        {view !== 'booking' && view !== 'confirmation' && (
          <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('public')}>
                  <span className="text-xl font-bold tracking-tight font-orbitron uppercase bg-gradient-to-r from-white to-[#30c3fc] bg-clip-text text-transparent">
                    LUCA'S AUTOSPA
                  </span>
                </div>
                
                  <div className="flex items-center gap-2">
                    {/* Language Switcher */}
                    <div className="flex items-center bg-slate-900/50 p-1 rounded-xl border border-slate-800 gap-1">
                      <button 
                        onClick={() => {
                          setLang('GE');
                          localStorage.setItem('preferredLang', 'GE');
                        }}
                        className={cn(
                          "p-1.5 rounded-lg transition-all active:scale-90",
                          lang === 'GE' ? "bg-blue-600 shadow-lg shadow-blue-600/30" : "hover:bg-slate-800"
                        )}
                        title="ქართული"
                      >
                        <img src="https://flagcdn.com/w40/ge.png" alt="Georgia Flag" className="w-5 h-3.5 object-cover rounded-sm" />
                      </button>
                      <button 
                        onClick={() => {
                          setLang('EN');
                          localStorage.setItem('preferredLang', 'EN');
                        }}
                        className={cn(
                          "p-1.5 rounded-lg transition-all active:scale-90",
                          lang === 'EN' ? "bg-blue-600 shadow-lg shadow-blue-600/30" : "hover:bg-slate-800"
                        )}
                        title="English"
                      >
                        <img src="https://flagcdn.com/w40/gb.png" alt="UK Flag" className="w-5 h-3.5 object-cover rounded-sm" />
                      </button>
                      <button 
                        onClick={() => {
                          setLang('RU');
                          localStorage.setItem('preferredLang', 'RU');
                        }}
                        className={cn(
                          "p-1.5 rounded-lg transition-all active:scale-90",
                          lang === 'RU' ? "bg-blue-600 shadow-lg shadow-blue-600/30" : "hover:bg-slate-800"
                        )}
                        title="Русский"
                      >
                        <img src="https://flagcdn.com/w40/ru.png" alt="Russia Flag" className="w-5 h-3.5 object-cover rounded-sm" />
                      </button>
                    </div>

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

                    {!isAdmin && (window.location.pathname === '/dash' || window.location.search.includes('view=admin')) && (
                      <div className="flex items-center gap-3">
                        {!user ? (
                          <Button variant="primary" size="sm" onClick={login} className="gap-2">
                            <ShieldCheck className="w-4 h-4" /> ადმინ შესვლა
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={logout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800">
                            <LogOut className="w-4 h-4" /> {getLangValue(lang, 'გამოსვლა', 'Logout', 'Выйти')}
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
                onBookNow={() => {
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
                onViewTerms={() => setView('terms')}
                onSuccess={() => {
                  setView('confirmation');
                  window.history.pushState(null, '', '/?view=confirmation');
                }}
              />
            ) : view === 'terms' ? (
              <TermsOfService key="terms" onBack={() => setView('public')} t={t} />
            ) : view === 'confirmation' ? (
              <ConfirmationPage key="confirmation" onBack={() => {
                setView('public');
                window.history.pushState(null, '', '/');
              }} t={t} lang={lang} />
            ) : isAdmin ? (
              <AdminDashboard key="admin" onBack={() => setView('public')} pricing={pricing} lang={lang} />
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
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:col-span-2">
                <div>
                  <h4 className="text-white font-semibold mb-3 text-sm">{t.serviceArea}</h4>
                  <p className="text-xs">{t.serviceAreaDesc}</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3 text-sm">{t.contact}</h4>
                  <div className="flex flex-col gap-2 text-xs">
                    <a href="tel:+995579129698" className="flex items-center gap-2 hover:text-blue-400">
                      <Phone className="w-3 h-3" /> +995 579 129 698
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
                    <a href="https://wa.me/message/6TTH66BJU2FRH1" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-green-600 hover:text-white transition-all">
                      <MessageCircle className="w-4 h-4" />
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
            </div>
            <div className="max-w-7xl mx-auto border-t border-slate-800 mt-8 pt-6 text-center text-[10px]">
              &copy; {new Date().getFullYear()} LUCA'S AUTOSPA. {t.rights}
            </div>
          </footer>
        )}

          {/* Floating Action Button - Show on all non-admin/confirmation pages */}
        {view !== 'admin' && view !== 'confirmation' && (
          <a 
            href="tel:+995579129698" 
            className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 hover:shadow-blue-500/20 transition-all active:scale-90"
          >
            <Phone className="w-6 h-6" />
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
  const [addons, setAddons] = useState<Addon[]>([]);
  const [expandedAddonId, setExpandedAddonId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'addons'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));
      setAddons(fetched);
    });
    return unsubscribe;
  }, []);

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

  const getPrice = (base: number) => {
    if (pricing.isSaleActive) {
      const discount = pricing.salePercentage || 0;
      return Math.round(base * (1 - discount / 100));
    }
    return base;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Preload Hero/Results Images for zero-lag carousel */}
      <div className="hidden" aria-hidden="true">
        {heroImages.map((src, i) => (
          <img key={i} src={src} loading="eager" decoding="async" />
        ))}
      </div>
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
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <Button 
                size="lg" 
                className="relative group overflow-hidden rounded-[2rem] bg-blue-600 hover:bg-blue-500 text-white font-black px-6 sm:px-10 h-16 text-sm sm:text-lg shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:shadow-[0_30px_60px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1.5 active:scale-95 flex items-center gap-3 border border-white/20" 
                onClick={() => scrollToBooking()}
              >
                <span className="relative z-10 flex items-center gap-3 uppercase tracking-wider">
                  {t.bookNow}
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.div>
                </span>
                
                {/* Glassy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Pulsing Glow behind */}
                <div className="absolute -inset-1 bg-blue-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                
                {/* Shine Sweep Effect */}
                <motion.div 
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[25deg]"
                  initial={{ left: '-150%' }}
                  animate={{ left: '150%' }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 1 }}
                />
              </Button>
              <a 
                href="tel:+995579129698"
                className="inline-flex items-center justify-center rounded-[2rem] border-2 border-green-500/20 bg-green-500/5 backdrop-blur-md text-green-400 hover:bg-green-500/10 hover:border-green-500/40 px-6 sm:px-10 h-16 text-sm sm:text-lg font-black transition-all hover:-translate-y-1.5 active:scale-95 shadow-xl group gap-3" 
              >
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="uppercase tracking-wider truncate">{t.bookPhone}</span>
              </a>
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-[2rem] border-2 border-white/5 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/20 px-6 sm:px-10 h-16 text-sm sm:text-lg transition-all hover:-translate-y-1.5 active:scale-95 font-black sm:w-auto w-full uppercase tracking-wider" 
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
            viewport={{ once: true, amount: 0.1 }}
            className="text-center mb-12 flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-blue-500/5 border border-blue-500/20 mb-6 backdrop-blur-xl shadow-[0_8px_16px_rgba(59,130,246,0.05)] transition-all hover:border-blue-500/40 group">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
              <h2 className="text-[10px] md:text-xs font-black text-blue-400 uppercase tracking-[0.25em] leading-none">{t.pricingTitle}</h2>
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white max-w-2xl mx-auto tracking-tight">
              {t.pricingDesc}
            </h3>
          </motion.div>

          <div className="max-w-xl mx-auto relative z-10">
            {/* Unified Plan */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.1 }}
            >
              <Card className="flex flex-col h-full bg-slate-900/60 backdrop-blur-xl border-blue-400/30 ring-1 ring-blue-400/10 relative overflow-hidden group rounded-[2rem]">
                <div className="absolute top-0 right-0 bg-blue-400 text-slate-950 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {t.bestValue}
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-50" />
                <div className="p-6 md:p-8 relative z-10">
                  <div className="mb-6 text-center sm:text-left">
                    <div className="flex items-baseline justify-center sm:justify-start gap-2">
                      {isLoading ? (
                        <Skeleton className="h-10 w-24" />
                      ) : (
                        <>
                          {pricing.isSaleActive ? (
                            <>
                              <span className="text-4xl font-black text-white">{Math.round(pricing.price * (1 - (pricing.salePercentage || 0) / 100))}₾</span>
                              <span className="text-xl text-slate-500 line-through">{pricing.price}₾</span>
                            </>
                          ) : (
                            <span className="text-4xl font-black text-white">{pricing.price}₾</span>
                          )}
                        </>
                      )}
                    </div>
                    {pricing.isSaleActive && (pricing.salePercentage || 0) > 0 && (
                      <div className="mt-3 inline-block bg-green-500/20 text-green-400 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider border border-green-500/20">
                        -{pricing.salePercentage}% {t.sale}
                      </div>
                    )}
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                    {t.standardDetails.map((item: string, i: number) => (
                      <motion.li 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-blue-400/30 hover:bg-white/10 transition-all duration-300 group/item"
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-blue-400 group-hover/item:text-slate-950 transition-colors duration-300 shadow-lg shadow-blue-400/5">
                          <CheckCircle className="w-4 h-4 text-blue-400 group-hover/item:text-inherit" />
                        </div>
                        <span className="text-[11px] font-medium text-slate-300 group-hover/item:text-white transition-colors leading-tight">
                          {item}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full py-7 rounded-2xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black transition-all text-base shadow-xl shadow-blue-500/20 active:scale-95 group/btn overflow-hidden relative" 
                    onClick={() => scrollToBooking()}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {t.selectService}
                      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Addons Section */}
            {addons.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                className="mt-12 space-y-6"
              >
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight">
                    {getLangValue(lang, 'დამატებითი სერვისები', 'Premium Add-ons', 'Дополнительные услуги')}
                  </h4>
                  <div className="h-1 w-12 bg-blue-500/30 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addons.map((addon, i) => {
                    const isExpanded = expandedAddonId === addon.id;
                    return (
                      <motion.div 
                        key={addon.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => setExpandedAddonId(isExpanded ? null : addon.id)}
                        className={cn(
                          "group/addon relative rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden",
                          isExpanded 
                            ? "bg-slate-900 border-blue-400/40 shadow-[0_20px_40px_rgba(0,0,0,0.3)] ring-1 ring-blue-400/20" 
                            : "bg-slate-900/40 border-white/5 hover:border-blue-400/30 hover:bg-slate-900/60"
                        )}
                      >
                        <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0",
                              isExpanded ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-blue-500/10 text-blue-400"
                            )}>
                              <PlusCircle className={cn("w-6 h-6 transition-transform duration-500", isExpanded && "rotate-45")} />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-black text-white text-base sm:text-lg leading-tight">
                                {getLangValue(lang, addon.nameGE, addon.nameEN, addon.nameRU)}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-blue-400 font-black text-sm whitespace-nowrap">+{addon.price}₾</span>
                                {!isExpanded && (
                                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                    {getLangValue(lang, 'დეტალები', 'Details', 'Детали')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300",
                            isExpanded ? "border-blue-400/40 bg-blue-400/10 text-blue-400" : "border-white/10 text-slate-500 group-hover/addon:border-blue-400/30 group-hover/addon:text-blue-400"
                          )}>
                            <ChevronDown className={cn("w-4 h-4 transition-transform duration-500", isExpanded && "rotate-180")} />
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                              <div className="px-6 pb-6 pt-2 border-t border-white/5 mx-6 mt-0">
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                  {getLangValue(lang, addon.descriptionGE, addon.descriptionEN, addon.descriptionRU)}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <div className={cn(
                          "absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent transition-opacity duration-500",
                          isExpanded ? "opacity-100" : "opacity-0"
                        )} />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-16 px-4 bg-slate-900/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
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
                viewport={{ once: true, amount: 0.1 }}
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
              viewport={{ once: true, amount: 0.1 }}
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
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-xl shadow-2xl shadow-blue-400/20 bg-blue-400 hover:bg-blue-300 text-slate-950 h-12 text-sm font-black px-8" onClick={() => scrollToBooking()}>
                  {t.bookNow}
                </Button>
                <a 
                  href="tel:+995579129698"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 backdrop-blur-md text-green-400 hover:bg-green-500/20 px-8 h-12 text-sm font-black transition-all" 
                >
                  <Phone className="mr-2 w-4 h-4" /> {t.bookPhone}
                </a>
              </div>
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

function BookingPage({ onBack, pricing, t, lang, onViewTerms, onSuccess }: { onBack: () => void, pricing: PricingSettings, t: any, lang: Language, onViewTerms?: () => void, onSuccess?: () => void, key?: string }) {
  const [step, setStep] = useState(1);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);
  const [bookingData, setBookingData] = useState<Partial<Booking>>({
    service: 'DetailingService',
    status: 'pending',
    date: format(startOfToday(), 'yyyy-MM-dd')
  });

  const getPrice = () => {
    const base = pricing.price;
    const fuelFee = bookingData.fuelFee || 0;
    let finalPrice = base;
    
    const addonsTotal = selectedAddonIds.reduce((sum, id) => {
      const addon = allAddons.find(a => a.id === id);
      return sum + (addon?.price || 0);
    }, 0);

    if (pricing.isSaleActive) {
      const discount = pricing.salePercentage || 0;
      finalPrice = Math.round(base * (1 - discount / 100)) + addonsTotal + fuelFee;
    } else {
      finalPrice = base + addonsTotal + fuelFee;
    }

    if (appliedPromo && appliedPromo.active) {
      finalPrice = Math.round(finalPrice * (1 - appliedPromo.discount / 100));
    }

    return finalPrice;
  };

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
          setPromoError(getLangValue(lang, 'პრომო კოდი არააქტიურია', 'Promo code is inactive', 'Промокод неактивен'));
        }
      } else {
        setPromoError(getLangValue(lang, 'პრომო კოდი არასწორია', 'Invalid promo code', 'Неверный промокод'));
      }
    } catch (error) {
      console.error('Error applying promo:', error);
      setPromoError(getLangValue(lang, 'შეცდომა კოდის შემოწმებისას', 'Error validating code', 'Ошибка при проверке кода'));
    } finally {
      setIsApplyingPromo(false);
    }
  };
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedDays, setBookedDays] = useState<string[]>([]);
  const [unavailableDays, setUnavailableDays] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchMonthStatus = async () => {
      try {
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
        
        // 1. Fetch booked days
        const qBooked = query(
          collection(db, 'taken_slots'),
          where('date', '>=', start),
          where('date', '<=', end)
        );
        
        const bookedSnap = await getDocs(qBooked);
        const booked = bookedSnap.docs.map(d => d.data().date);
        
        // 2. Fetch all availability for the month to find blocked days
        const qAvail = query(
          collection(db, 'availability'),
          where('__name__', '>=', start),
          where('__name__', '<=', end)
        );
        const availSnap = await getDocs(qAvail);
        const availDocs = availSnap.docs.reduce((acc, d) => {
          acc[d.id] = (d.data() as Availability).slots;
          return acc;
        }, {} as Record<string, string[]>);

        // A day is unavailable if:
        // - It's already booked (1 booking per day rule)
        // - OR it has no slots defined in availability
        // - OR all slots are in the past (handled in render usually, but good to know)
        
        setBookedDays([...new Set(booked)]);
        
        // Find days in this month range that have no slots
        const monthDays = getDaysInMonth(currentMonth);
        const unavail: string[] = [];
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        monthDays.forEach(d => {
          const dStr = format(d, 'yyyy-MM-dd');
          const slots = availDocs[dStr] || [];
          
          // Filter out past slots if it's today
          let activeSlots = [...slots];
          if (isToday(d)) {
            activeSlots = activeSlots.filter(slot => {
               const [hours, minutes] = slot.split(':').map(Number);
               const slotDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes);
               return slotDate > oneHourFromNow;
            });
          }

          if (booked.includes(dStr) || activeSlots.length === 0) {
            unavail.push(dStr);
          }
        });
        setUnavailableDays(unavail);

      } catch (e) {
        console.error('Error fetching month status:', e);
      }
    };
    fetchMonthStatus();
  }, [currentMonth]);

  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Verification states
  const [userCode, setUserCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | 'all' | null>(null);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [emailPopup, setEmailPopup] = useState(false);
  const [sessionVerificationMethod, setSessionVerificationMethod] = useState<'whatsapp' | 'email' | null>(null);
  const [showAddonsPopup, setShowAddonsPopup] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [expandedAddonId, setExpandedAddonId] = useState<string | null>(null);

  const currentMethod = sessionVerificationMethod || 'whatsapp';

  useEffect(() => {
    const q = query(collection(db, 'addons'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));
      setAllAddons(fetched);
    });
    return unsubscribe;
  }, []);

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
    { id: 1, label: t.chooseDate, icon: Calendar, completed: !!(bookingData.date && bookingData.timeSlot) },
    { id: 2, label: t.location, icon: MapPin, completed: !!bookingData.location },
    { id: 3, label: getLangValue(lang, 'საკონტაქტო ინფორმაცია', 'Contact Info', 'Контактная информация'), icon: Users, completed: !!(bookingData.customerName && bookingData.carModel && (currentMethod === 'email' ? !!bookingData.email : !!bookingData.phone)) }
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
            
            // Enforce 1 booking per day rule
            if (!takenSnap.empty) continue;

            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            
            const available = slots.filter(slot => {
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
  }, []);

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
      
      // Enforce 1 booking per day rule
      if (!takenSnap.empty) {
        setAvailableSlots([]);
        return;
      }
      
      let filteredSlots = [...baseSlots];

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

  const sendVerificationCode = async (method: 'whatsapp' | 'email', emailOverride?: string) => {
    setIsSendingCode(true);
    setFormError(null);
    try {
      setSessionVerificationMethod(method);
      const targetEmail = emailOverride || bookingData.email;

      if (method === 'email') {
        if (!targetEmail) throw new Error('Email is required');
        const response = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: targetEmail,
            lang,
            method: 'email'
          })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send email');
        }
        
        setShowVerification(true);
        setEmailPopup(false);
        setBookingData(prev => ({ ...prev, email: targetEmail }));
        track('Email Verification Sent', { email: targetEmail });
      } else {
        let phoneNumber = bookingData.phone!;
        if (!phoneNumber.startsWith('+')) {
          const cleanPhone = phoneNumber.replace(/^0+/, '');
          phoneNumber = `+995${cleanPhone}`;
        }
        
        const response = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phone: phoneNumber,
            lang,
            method: 'whatsapp'
          })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send code');
        }
        
        setShowVerification(true);
        track(`WHATSAPP Verification Sent`, { phone: phoneNumber });
      }
    } catch (error: any) {
      console.error('Verification Code error:', error);
      setFormError(error.message || (lang === 'GE' 
        ? 'დაფიქსირდა შეცდომა. გთხოვთ სცადოთ მოგვიანებით.' 
        : 'An error occurred. Please try again later.'));
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleBookingSubmit = async (bypassTermsCheck: boolean | React.MouseEvent = false) => {
    const shouldBypass = typeof bypassTermsCheck === 'boolean' ? bypassTermsCheck : false;
    setFormError(null);
    
    if (!bookingData.date || !bookingData.timeSlot) {
      setStep(1);
      setFormError(t.errorDateTime);
      return;
    }
    // Phone was required in step 3
    if (!bookingData.location || !bookingData.customerName || !bookingData.phone) {
      setStep(2);
      setFormError(t.fillAllFields);
      return;
    }
    if (!termsAccepted && !shouldBypass) {
      setShowTermsPopup(true);
      return;
    }

    if (!showVerification) {
      setFormError(getLangValue(lang, 'გთხოვთ ჯერ გაიაროთ ვერიფიკაცია', 'Please verify first', 'Пожалуйста, сначала пройдите верификацию'));
      return;
    }

    if (!userCode) {
      setVerificationError('გთხოვთ შეიყვანოთ ვერიფიკაციის კოდი');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    try {
      const activeMethod = sessionVerificationMethod;
      let verificationKey = activeMethod === 'email' ? bookingData.email : bookingData.phone!;
      
      if (activeMethod !== 'email' && !verificationKey.startsWith('+')) {
        const cleanPhone = verificationKey.replace(/^0+/, '');
        verificationKey = `+995${cleanPhone}`;
      }

      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: verificationKey,
          code: userCode
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid code');
      }

      // Pre-submission validation: Double check availability and time limit
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const [hours, minutes] = bookingData.timeSlot!.split(':').map(Number);
      const [year, month, day] = bookingData.date!.split('-').map(Number);
      const slotDate = new Date(year, month - 1, day, hours, minutes);

      if (slotDate <= oneHourFromNow) {
        throw new Error(lang === 'GE' 
          ? 'სამწუხაროდ, ამ დროის დაჯავშნა აღარ არის შესაძლებელი (მინუმუმ 1 საათით ადრე).' 
          : 'Sorry, this slot is no longer available (must book at least 1 hour in advance).');
      }

      const takenCheckQuery = query(
        collection(db, 'taken_slots'),
        where('date', '==', bookingData.date)
      );
      const takenCheckSnap = await getDocs(takenCheckQuery);
      if (!takenCheckSnap.empty) {
        throw new Error(lang === 'GE'
          ? 'სამწუხაროდ, ეს დღე უკვე დაკავებულია.'
          : 'Sorry, this day is already booked.');
      }

      setIsSubmitting(true);
      const bookingRef = await addDoc(collection(db, 'bookings'), {
          ...bookingData,
          status: 'pending',
          promoCode: appliedPromo?.code || null,
          discountAmount: appliedPromo ? appliedPromo.discount : 0,
          addons: selectedAddonIds,
          finalPrice: getPrice(),
          verificationMethod: sessionVerificationMethod,
          customerEmail: bookingData.email || null,
          createdAt: serverTimestamp()
        });
        
        // --- AUTO SYNC CLIENT ---
        try {
          const targetClientId = bookingData.phone;
          if (!targetClientId) return;

          const clientRef = doc(db, 'clients', targetClientId);
          const clientSnap = await getDoc(clientRef);
          
          if (clientSnap.exists()) {
            await updateDoc(clientRef, {
              fullName: bookingData.customerName,
              email: bookingData.email || clientSnap.data().email || null,
              updatedAt: serverTimestamp()
            });
          } else {
            await setDoc(clientRef, {
              fullName: bookingData.customerName,
              phone: bookingData.phone,
              email: bookingData.email || null,
              notes: '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }

          if (bookingData.carModel) {
            const carModelLower = bookingData.carModel.toLowerCase().trim();
            const carsSnap = await getDocs(collection(db, 'clients', targetClientId, 'cars'));
            const carExists = carsSnap.docs.some(d => {
              const data = d.data();
              const existingBrand = (data.brand || '').toLowerCase();
              const existingModel = (data.model || '').toLowerCase();
              return carModelLower.includes(existingBrand) && carModelLower.includes(existingModel);
            });

            if (!carExists) {
              const parts = bookingData.carModel.split(' ');
              await addDoc(collection(db, 'clients', targetClientId, 'cars'), {
                brand: parts[0] || 'Unknown',
                model: parts.slice(1).join(' ') || parts[0] || 'Unknown',
                licensePlate: '-',
                notes: 'Automatically added from booking'
              });
            }
          }
        } catch (clientSyncError) {
          console.error("Error syncing client:", clientSyncError);
        }
        // --- END AUTO SYNC CLIENT ---
        
        // Track booking event
        track('Booking Confirmed', {
          service: 'Detailed Interior Clean',
          price: getPrice(),
          addons: selectedAddonIds.join(', '),
          promoCode: appliedPromo?.code || null,
          method: sessionVerificationMethod
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
              bookingData: {
                ...bookingData,
                verificationMethod: sessionVerificationMethod,
                customerEmail: bookingData.email || null
              },
              addons: selectedAddonIds.map(id => {
                const addon = allAddons.find(a => a.id === id);
                return {
                  nameGE: addon?.nameGE,
                  nameEN: addon?.nameEN,
                  price: addon?.price
                };
              }),
              price: getPrice(),
              bookingId: bookingRef.id,
              promoCode: appliedPromo?.code || null,
              customerMethod: sessionVerificationMethod,
              customerEmail: bookingData.email || null,
              lang
            })
          });
        } catch (e) {
          console.error('Failed to send notification', e);
        }

        setIsSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
    } catch (error: any) {
      console.error('Verification error:', error);
      
      if (error.code === 'auth/invalid-verification-code' || error.message?.includes('Invalid')) {
         setVerificationError(t.invalidCode);
      } else {
         setVerificationError(t.verificationError);
      }
    } finally {
      setIsVerifying(false);
      setIsSubmitting(false);
    }
  };

  if (isSuccess && !onSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
...
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
        <div className="flex items-center justify-between px-1 md:px-2 pt-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div 
                className="flex flex-col items-center gap-1.5 md:gap-2 group cursor-pointer relative" 
                onClick={() => (s.completed || s.id < step) && setStep(s.id)}
              >
                <div className={cn(
                  "w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-[1.25rem] flex items-center justify-center transition-all duration-700 relative z-10",
                  step === s.id ? "bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-110" : 
                  s.id < step ? "bg-blue-600/20 text-blue-400" : "bg-slate-900 border border-white/5 text-slate-600"
                )}>
                  {s.id < step ? <CheckCircle className="w-5 h-5 md:w-6 md:h-6" /> : <s.icon className={cn("w-5 h-5 md:w-6 md:h-6", step === s.id ? "text-white" : "")} />}
                </div>
                <span className={cn(
                  "text-[7px] md:text-[9px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all duration-500 text-center",
                  step === s.id ? "text-blue-400 translate-y-0 opacity-100" : "text-slate-600 opacity-60"
                )}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-[1px] md:h-[2px] mx-1 md:mx-2 mb-5 md:mb-6 bg-slate-900 overflow-hidden rounded-full relative">
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
                    <span className="text-[10px] font-black uppercase text-white px-1">{format(currentMonth, 'MMMM yyyy', { locale: getDateLocale(lang) })}</span>
                    <button 
                      onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      disabled={currentMonth.getMonth() === new Date().getMonth() + 1}
                      className="p-1.5 hover:bg-white/5 rounded-lg disabled:opacity-20 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto px-4 pt-4 pb-6 no-scrollbar -mx-4 items-center">
                  {/* Previous Month Card */}
                  {!(currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()) && (
                    <button
                      onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      className="flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-500 border bg-slate-900/40 backdrop-blur-xl border-white/5 text-slate-400 hover:border-white/10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase text-center">{getLangValue(lang, 'წინა თვე', 'PREV', 'ПРЕД')}</span>
                    </button>
                  )}

                  {dates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isSelected = bookingData.date === dateStr;
                    const isUnavailable = unavailableDays.includes(dateStr);
                    
                    return (
                      <button
                        key={date.toISOString()}
                        disabled={isUnavailable}
                        onClick={() => {
                          setBookingData({ ...bookingData, date: dateStr, timeSlot: undefined });
                          track('Date Selected', { date: dateStr });
                        }}
                        className={cn(
                          "flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-500 border relative",
                          isSelected 
                            ? "bg-blue-400 border-blue-400 text-slate-950 shadow-2xl shadow-blue-400/30 scale-105" 
                            : isUnavailable
                              ? "bg-slate-900/20 border-white/[0.02] text-slate-700 cursor-not-allowed opacity-50"
                              : "bg-slate-900/40 backdrop-blur-xl border-white/5 text-slate-400 hover:border-white/10"
                        )}
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest">{format(date, 'EEE', { locale: getDateLocale(lang) })}</span>
                        <span className="text-lg font-black">{format(date, 'd')}</span>
                        {isSelected && (
                          <motion.div 
                            layoutId="date-indicator"
                            className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                          />
                        )}
                        {isUnavailable && !isSelected && (
                          <div className="absolute top-1 right-1">
                             <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Next Month Card */}
                  {currentMonth.getMonth() === new Date().getMonth() && (
                    <button
                      onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      className="flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-500 border bg-slate-900/40 backdrop-blur-xl border-white/5 text-slate-400 hover:border-white/10"
                    >
                      <ChevronRight className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase text-center">{getLangValue(lang, 'შემდეგი', 'NEXT', 'СЛЕД')}</span>
                    </button>
                  )}
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

              <div className="pt-6">
                {formError && step === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center"
                  >
                    {formError}
                  </motion.div>
                )}
                <Button 
                  onClick={() => {
                    if (bookingData.date && bookingData.timeSlot) {
                      setStep(2);
                      setFormError(null);
                    } else {
                      setFormError(t.errorDateTime);
                    }
                  }} 
                  className={cn(
                    "w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl flex gap-3 transition-all duration-300",
                    (!bookingData.date || !bookingData.timeSlot) 
                      ? "bg-slate-800 text-slate-500 shadow-none cursor-pointer" 
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                  )}
                >
                  <span>{t.next}</span>
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
                        onLocationSelect={(address, lat, lng) => {
                          let fuelFee = 0;
                          let distance = 0;
                          if (lat && lng && pricing.baseLocation && pricing.pricePerKm) {
                            distance = calculateDistance(
                              pricing.baseLocation.lat,
                              pricing.baseLocation.lng,
                              lat,
                              lng
                            );
                            fuelFee = Math.round(distance * pricing.pricePerKm);
                          }
                          setBookingData({ ...bookingData, location: address, lat, lng, fuelFee, distance });
                        }}
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
                    onClick={() => setStep(1)} 
                    variant="ghost"
                    className="flex-1 py-5 rounded-[1.5rem] border border-white/5 font-black text-lg gap-3"
                  >
                    <ChevronLeft className="w-6 h-6" />
                    <span>{lang === 'GE' ? 'უკან' : 'Back'}</span>
                  </Button>
                  <Button 
                    onClick={() => {
                      if (bookingData.location) {
                        setStep(3);
                        setFormError(null);
                      } else {
                        setFormError(t.errorLocation);
                      }
                    }} 
                    className={cn(
                      "flex-[2] py-5 rounded-[1.5rem] font-black text-lg shadow-2xl flex gap-3 relative overflow-hidden group transition-all duration-300",
                      !bookingData.location
                        ? "bg-slate-800 text-slate-500 shadow-none cursor-pointer"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30"
                    )}
                  >
                    <span>{t.next}</span>
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
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
                <h2 className="text-xl font-black text-white tracking-tight">{getLangValue(lang, 'საკონტაქტო ინფორმაცია', 'Contact Information', 'Контактная информация')}</h2>
                
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
                      {t.phone}
                    </label>
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
                  </div>

                  {/* Promo Code Input (Optional) - Moved from Step 1 to Step 4 */}
                  <div className="pt-4 border-t border-white/5">
                    {!appliedPromo ? (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">
                          {getLangValue(lang, 'პრომო კოდი (არასავალდებულო)', 'Promo Code (Optional)', 'Промокод (опционально)')}
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
                            {isApplyingPromo ? '...' : getLangValue(lang, 'გამოყენება', 'Apply', 'Применить')}
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
                              {getLangValue(lang, `${appliedPromo.discount}% ფასდაკლება გამოყენებულია`, `${appliedPromo.discount}% Discount Applied`, `${appliedPromo.discount}% скидка применена`)}
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
                    onClick={() => setStep(2)} 
                    variant="ghost"
                    className="flex-1 py-5 rounded-[1.5rem] border border-white/5 font-black text-lg gap-3"
                  >
                    <ChevronLeft className="w-6 h-6" />
                    <span>{lang === 'GE' ? 'უკან' : 'Back'}</span>
                  </Button>
                  <Button 
                    onClick={() => {
                      if (bookingData.customerName && bookingData.carModel && bookingData.phone) {
                        if (allAddons.length > 0) {
                          setShowAddonsPopup(true);
                        } else {
                          setStep(4);
                        }
                        setFormError(null);
                      } else {
                        setFormError(t.fillAllFields || 'გთხოვთ შეავსოთ ყველა ველი');
                      }
                    }} 
                    className={cn(
                      "flex-[2] py-5 rounded-[1.5rem] font-black text-lg shadow-2xl flex gap-3 relative overflow-hidden group transition-all duration-300",
                      (!bookingData.customerName || !bookingData.carModel || !bookingData.phone)
                        ? "bg-slate-800 text-slate-500 shadow-none cursor-pointer"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30"
                    )}
                  >
                    <span>{t.next}</span>
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
                <h2 className="text-xl font-black text-white tracking-tight">{lang === 'GE' ? 'ჯავშნის დადასტურება' : 'Confirm Your Booking'}</h2>
                
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-6 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 blur-3xl rounded-full" />
                  
                  {/* Service Summary */}
                  <div className="flex items-start gap-4 pb-6 border-b border-white/5">
                    <div className="w-12 h-12 bg-blue-400/10 text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-lg">
                        {t.detailingService}
                      </h3>
                      <p className="text-blue-400 font-black text-xl">{getPrice()}₾</p>
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
                        {bookingData.date ? format(parseISO(bookingData.date), 'EEEE, d MMMM', { locale: getDateLocale(lang) }) : ''}
                      </p>
                      <p className="text-slate-400 text-sm font-bold">{bookingData.timeSlot}</p>
                    </div>
                  </div>

                  {/* Addons Summary */}
                  {selectedAddonIds.length > 0 && (
                    <div className="flex items-start gap-4 py-4 border-t border-white/5">
                      <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
                        <PlusCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{getLangValue(lang, 'დამატებითი სერვისები', 'Additional Services', 'Дополнительные услуги')}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedAddonIds.map(id => {
                            const addon = allAddons.find(a => a.id === id);
                            return (
                              <span key={id} className="text-[10px] font-black bg-blue-600/20 text-blue-400 px-2 py-1 rounded-md uppercase tracking-tighter">
                                {getLangValue(lang, addon?.nameGE, addon?.nameEN, addon?.nameRU)} (+{addon?.price}₾)
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

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

                  {/* Fuel Fee Summary */}
                  {bookingData.fuelFee ? (
                    <div className="py-2 border-t border-white/5 flex justify-between items-center px-1">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        {getLangValue(lang, 'ადგილზე მოსვლის საფასური', 'Fuel Fee', 'Транспортировка')}
                        <span className="ml-2 font-normal text-slate-700">({bookingData.distance?.toFixed(1)} KM)</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-bold">+{bookingData.fuelFee}₾</p>
                    </div>
                  ) : null}

                  {/* Personal Summary */}
                  <div className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.name} & {t.carModel}</p>
                      <p className="text-white font-medium">{bookingData.customerName} - <span className="text-blue-400">{bookingData.carModel}</span></p>
                      <p className="text-slate-400 text-xs text-mono">+995 {bookingData.phone}</p>
                      {bookingData.email && (
                        <p className="text-slate-500 text-[10px] italic">{bookingData.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verification Buttons */}
                {!showVerification ? (
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-black">
                      {t.chooseVerificationMethod}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => sendVerificationCode('whatsapp')}
                        disabled={isSendingCode}
                        className="py-6 rounded-3xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2 transition-all h-auto group"
                      >
                        <div className="p-3 bg-green-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                          <MessageCircle className="w-6 h-6" />
                        </div>
                        {lang === 'GE' ? 'WhatsApp-ით' : 'via WhatsApp'}
                      </Button>
                      <Button 
                        onClick={() => setEmailPopup(true)}
                        disabled={isSendingCode}
                        className="py-6 rounded-3xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2 transition-all h-auto group"
                      >
                        <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                          <Mail className="w-6 h-6" />
                        </div>
                        {lang === 'GE' ? 'Email-ით' : 'via Email'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
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
                          setUserCode('');
                        }}
                        className="text-[10px] font-black text-white/60 hover:text-white uppercase tracking-widest transition-colors"
                      >
                        {getLangValue(lang, 'შეცვლა', 'Change', 'Изм.')}
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-200 text-center font-bold relative z-10"
                      >
                        {verificationError}
                      </motion.p>
                    )}
                    <p className="text-[10px] text-white/50 text-center uppercase tracking-widest font-bold relative z-10">
                      {t.codeSentVia} 
                      <span className="text-white ml-1">
                        {sessionVerificationMethod === 'email' ? bookingData.email : bookingData.phone}
                        ({sessionVerificationMethod?.toUpperCase()})
                      </span>
                    </p>
                  </motion.div>
                )}

                {formError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 text-xs font-bold text-center"
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
                  
                  {showVerification && (
                    <Button 
                      onClick={() => handleBookingSubmit()} 
                      className="flex-[2] py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-2xl shadow-blue-600/30 flex gap-3 relative overflow-hidden group disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                      {isSubmitting || isVerifying || isSendingCode ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {isSendingCode ? t.sendingCode : isVerifying ? t.verifying : t.processing}
                        </span>
                      ) : (
                        <span className="flex items-center gap-3">
                          {t.confirmBooking}
                          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Addons Popup */}
      <AnimatePresence>
        {showAddonsPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddonsPopup(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">{getLangValue(lang, 'დამატებითი სერვისები', 'Additional Services', 'Дополнительные услуги')}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{getLangValue(lang, 'აირჩიეთ და მიიღეთ მეტი', 'Choose and get more', 'Выберите и получите больше')}</p>
                </div>
                <button onClick={() => setShowAddonsPopup(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {allAddons.map(addon => {
                  const isSelected = selectedAddonIds.includes(addon.id);
                  const isExpanded = expandedAddonId === addon.id;
                  
                  return (
                    <motion.div 
                      key={addon.id}
                      layout
                      className={cn(
                        "rounded-[1.75rem] border transition-all duration-300 overflow-hidden",
                        isSelected ? "bg-blue-600/10 border-blue-600/30" : "bg-slate-950/50 border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="p-4 flex items-center gap-4">
                        <button 
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAddonIds(selectedAddonIds.filter(id => id !== addon.id));
                              if (expandedAddonId === addon.id) setExpandedAddonId(null);
                            } else {
                              setSelectedAddonIds([...selectedAddonIds, addon.id]);
                              setExpandedAddonId(addon.id);
                            }
                          }}
                          className={cn(
                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                            isSelected ? "bg-blue-600 border-blue-600" : "border-white/20 bg-transparent"
                          )}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>
                        
                        <div className="flex-1 min-w-0" onClick={() => {
                          if (isSelected) {
                            setSelectedAddonIds(selectedAddonIds.filter(id => id !== addon.id));
                            if (expandedAddonId === addon.id) setExpandedAddonId(null);
                          } else {
                            setSelectedAddonIds([...selectedAddonIds, addon.id]);
                            setExpandedAddonId(addon.id);
                          }
                        }}>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-white text-base leading-tight">{getLangValue(lang, addon.nameGE, addon.nameEN, addon.nameRU)}</h4>
                            <span className="text-blue-400 font-black shrink-0">{addon.price}₾</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => setExpandedAddonId(isExpanded ? null : addon.id)}
                          className={cn(
                            "p-2 hover:bg-white/5 rounded-xl transition-all text-slate-500 shrink-0",
                            isExpanded && "rotate-180 text-white"
                          )}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4"
                          >
                            <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-xs text-slate-400 leading-relaxed italic">
                              {getLangValue(lang, addon.descriptionGE, addon.descriptionEN, addon.descriptionRU)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-6 bg-slate-950/50 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{getLangValue(lang, 'ჯამი დამატებით', 'Addons Total', 'Итого доп. услуги')}</span>
                  <span className="text-xl font-black text-white">
                    {selectedAddonIds.reduce((sum, id) => sum + (allAddons.find(a => a.id === id)?.price || 0), 0)}₾
                  </span>
                </div>
                <Button 
                  onClick={() => {
                    setShowAddonsPopup(false);
                    setStep(4);
                  }}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20 text-lg flex gap-3"
                >
                  <span>{getLangValue(lang, 'გაგრძელება', 'Continue', 'Продолжить')}</span>
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <p className="text-xl font-bold text-white mb-6 tracking-tight">{t.terms.spaName}</p>

                  {t.terms.sections.map((section, idx) => (
                    <React.Fragment key={idx}>
                      <section className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">{section.title}</h2>
                        {section.subtitle && <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{section.subtitle}</h3>}
                        {section.content && <p className="text-slate-300">{section.content}</p>}
                        {section.listTitle && <p className="mb-2 text-slate-300 font-semibold">{section.listTitle}</p>}
                        {section.items && (
                          <ul className="list-disc pl-6 space-y-2">
                            {section.items.map((item, i) => (
                              <li key={i} className="text-slate-300">
                                {typeof item === 'string' ? item : (
                                  <ul className="list-disc pl-6 mt-2 space-y-1">
                                    {item.subItems.map((sub, j) => <li key={j}>{sub}</li>)}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                      {idx < t.terms.sections.length - 1 && <hr className="border-slate-800 my-8 opacity-50" />}
                    </React.Fragment>
                  ))}
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

      {/* Email Input Popup */}
      <AnimatePresence>
        {emailPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEmailPopup(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-indigo-500/20 rounded-[2.5rem] shadow-2xl overflow-hidden shadow-indigo-500/10"
            >
              <div className="p-8 space-y-6">
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto scale-110">
                  <Mail className="w-8 h-8" />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {getLangValue(lang, 'შეიყვანეთ ელ-ფოსტა', 'Enter Email Address', 'Введите адрес эл. почты')}
                  </h3>
                  <p className="text-slate-400 text-sm font-medium">
                    {getLangValue(lang, 'დადასტურების კოდი გაიგზავნება მითითებულ ელ-ფოსტაზე', 'A verification code will be sent to your email', 'Код подтверждения будет отправлен на вашу эл. почту')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <input 
                      type="email" 
                      placeholder="your@email.com"
                      autoFocus
                      className="w-full bg-slate-950/40 border border-white/10 rounded-2xl p-5 focus:border-indigo-400 outline-none transition-all text-white text-lg shadow-inner text-center"
                      value={bookingData.email || ''}
                      onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && bookingData.email) {
                          sendVerificationCode('email');
                        }
                      }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setEmailPopup(false)}
                      variant="ghost"
                      className="flex-1 py-4 rounded-2xl border border-white/5 font-bold text-slate-400"
                    >
                      {getLangValue(lang, 'გაუქმება', 'Cancel', 'Отмена')}
                    </Button>
                    <Button 
                      onClick={() => sendVerificationCode('email')}
                      disabled={isSendingCode || !bookingData.email}
                      className="flex-[2] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-white shadow-xl shadow-indigo-600/20 flex gap-2 items-center justify-center"
                    >
                      {isSendingCode ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{getLangValue(lang, 'კოდის გაგზავნა', 'Send Code', 'Отправить код')}</span>
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
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
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
        <h1 className="text-4xl font-bold text-white mb-8 font-orbitron">{t.termsTitle}</h1>
        
        <p className="text-xl font-bold text-white mb-6">{t.terms.spaName}</p>

        {t.terms.sections.map((section, idx) => (
          <React.Fragment key={idx}>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
              {section.subtitle && <h3 className="text-xl font-bold text-white mb-2">{section.subtitle}</h3>}
              {section.content && <p>{section.content}</p>}
              {section.listTitle && <p className="mb-2">{section.listTitle}</p>}
              {section.items && (
                <ul className="list-disc pl-6 space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i}>
                      {typeof item === 'string' ? item : (
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                          {item.subItems.map((sub, j) => <li key={j}>{sub}</li>)}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {idx < t.terms.sections.length - 1 && <hr className="border-slate-800 my-8" />}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
}

function AdminDashboard({ onBack, pricing, lang }: { onBack: () => void, pricing: PricingSettings, lang: Language, key?: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability' | 'pricing' | 'reviews' | 'promo' | 'addons' | 'clients'>('bookings');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'createdAt'>('createdAt');
  const [filterStatus, setFilterStatus] = useState<'future' | 'completed' | 'all'>('future');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [showActionsId, setShowActionsId] = useState<string | null>(null);
  const [allAddons, setAllAddons] = useState<Addon[]>([]);

  useEffect(() => {
    const qA = query(collection(db, 'addons'));
    const unsubA = onSnapshot(qA, (snap) => {
      setAllAddons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon)));
    });

    const q = query(collection(db, 'bookings'), orderBy(sortBy, 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(fetchedBookings);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'bookings');
    });
    return () => {
      unsubA();
      unsubscribe();
    };
  }, [sortBy]);

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return booking.status === 'completed';
    if (filterStatus === 'future') return booking.status === 'pending';
    return true;
  });

  const handleEmailNotification = async (email: string, subject: string, message: string) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, message, lang })
      });
    } catch (e) {
      console.error('Failed to send Email notification', e);
    }
  };

  const handleWhatsAppNotification = async (phone: string, message: string) => {
    try {
      // Basic normalization - remove any non-digit characters except possibly a leading +
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message })
      });
    } catch (e) {
      console.error('Failed to send WhatsApp notification', e);
    }
  };

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    const actionText = lang === 'GE' 
      ? (status === 'completed' ? 'დასრულება' : status === 'cancelled' ? 'გაუქმება' : 'განახლება')
      : (status === 'completed' ? 'Complete' : status === 'cancelled' ? 'Cancel' : 'Update');

    const confirmMsg = lang === 'GE'
      ? `ნამდვილად გსურთ ამ ჯავშნის ${actionText}?`
      : `Are you sure you want to ${actionText.toLowerCase()} this booking?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const booking = bookings.find(b => b.id === id);
      await updateDoc(doc(db, 'bookings', id), { status });
      
      if (booking) {
        if (status === 'cancelled') {
          await deleteDoc(doc(db, 'taken_slots', `${booking.date}_${booking.timeSlot}`));
          
          const message = lang === 'GE'
            ? `Luca's AutoSpa: თქვენი ჯავშანი გაუქმებულია. კითხვებისთვის მოგვწერეთ.`
            : `Luca's AutoSpa: Your booking was cancelled. Contact us for any questions.`;

          if (booking.email && pricing.isEmailVerificationEnabled) {
            await handleEmailNotification(booking.email, (lang === 'GE' ? 'ჯავშნის სტატუსი' : 'Booking Status') + ' - Luca\'s AutoSpa', message);
          }
          
          if (booking.phone) {
            await handleWhatsAppNotification(booking.phone, message);
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
        
        const serviceName = getLangValue(lang, 
          'ინტერიერის დეტალური ქიმწმენდა',
          'Detailed Interior Dry Cleaning',
          'Детальная химчистка салона'
        );
          
        const message = lang === 'GE'
          ? `Luca's AutoSpa: ✅ სერვისი დასრულებულია!\n\n🛠 სერვისი: ${serviceName}\n🚗 მანქანა: ${booking.carModel || '-'}\n📅 თარიღი: ${booking.date}\n📍 მისამართი: ${booking.location}\n\nმადლობა ნდობისთვის! გთხოვთ დაგვიტოვეთ შეფასება: ${pricing.reviewLink || 'https://google.com'}`
          : lang === 'RU'
            ? `Luca's AutoSpa: ✅ Услуга завершена!\n\n🛠 Услуга: ${serviceName}\n🚗 Автомобиль: ${booking.carModel || '-'}\n📅 Дата: ${booking.date}\n📍 Адрес: ${booking.location}\n\nСпасибо за доверие! Пожалуйста, оставьте отзыв: ${pricing.reviewLink || 'https://google.com'}`
            : `Luca's AutoSpa: ✅ Service completed!\n\n🛠 Service: ${serviceName}\n🚗 Vehicle: ${booking.carModel || '-'}\n📅 Date: ${booking.date}\n📍 Location: ${booking.location}\n\nThank you for your trust! Please leave us a review: ${pricing.reviewLink || 'https://google.com'}`;
        
        if (booking.email && pricing.isEmailVerificationEnabled) {
          await handleEmailNotification(booking.email, lang === 'GE' ? 'სერვისი დასრულებულია - Luca\'s AutoSpa' : 'Service Completed - Luca\'s AutoSpa', message);
        }
        
        if (booking.phone) {
          // Send completion message even if admin notifications are off
          await handleWhatsAppNotification(booking.phone, message);
        }
      }
      setShowActionsId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const deleteBooking = async (id: string) => {
    const confirmMsg = lang === 'GE'
      ? "ნამდვილად გსურთ ამ ჯავშნის წაშლა? ეს ქმედება შეუქცევადია."
      : "Are you sure you want to delete this booking? This action cannot be undone.";

    if (!window.confirm(confirmMsg)) return;

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
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
              <button 
                onClick={() => setActiveTab('addons')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === 'addons' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800"
                )}
              >
                დამატებითი სერვისები
              </button>
              <button 
                onClick={() => setActiveTab('clients')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === 'clients' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800"
                )}
              >
                კლიენტები
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
                        {booking.service === 'DetailingService' ? getLangValue(lang, 'ქიმწმენდა', 'Detailing', 'Детейлинг') : booking.service}
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
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">სერვისის დეტალები</p>
                              <div className="space-y-1 text-sm text-slate-300">
                                <p><span className="text-slate-500">მანქანა:</span> {booking.carModel || '-'}</p>
                                <p><span className="text-slate-500">თარიღი:</span> {booking.date} {booking.timeSlot}</p>
                                <p><span className="text-slate-500">ფასი:</span> <span className="text-green-400 font-bold">{booking.finalPrice || '-'}₾</span></p>
                                {booking.fuelFee && (
                                  <p><span className="text-slate-500">საწვავი:</span> <span className="text-indigo-400 font-bold">{booking.fuelFee}₾</span> ({booking.distance?.toFixed(1)} კმ)</p>
                                )}
                                {booking.promoCode && (
                                  <p><span className="text-slate-500">პრომო:</span> <span className="text-blue-400 font-medium">{booking.promoCode}</span> (-{booking.discountAmount}₾)</p>
                                )}
                                {booking.addons && booking.addons.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-slate-800">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">დამატებითი სერვისები:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {booking.addons.map(id => {
                                        const addon = allAddons.find(a => a.id === id);
                                        return (
                                          <span key={id} className="text-[9px] bg-blue-600/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-600/20">
                                            {lang === 'GE' ? addon?.nameGE : addon?.nameEN}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">დაჯავშნის თარიღი</p>
                              <p className="text-xs text-slate-500">
                                {booking.createdAt?.seconds 
                                  ? format(new Date(booking.createdAt.seconds * 1000), 'MMM dd, yyyy HH:mm')
                                  : '-'}
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
      ) : activeTab === 'addons' ? (
        <AddonManager onBack={onBack} lang={lang} />
      ) : activeTab === 'clients' ? (
        <ClientManager onBack={onBack} lang={lang} bookings={bookings} pricing={pricing} />
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
            <h3 className="text-xl font-bold text-white">მთავარი გვერდის შეფასებები</h3>
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
                  value={review.imageUrl || ''}
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
                  value={review.link || ''}
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
            <h3 className="text-xl font-bold text-white">სერვისის ფასი</h3>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">ფასი (₾)</label>
                <input 
                  type="number"
                  value={localPricing.price || 0}
                  onChange={(e) => setLocalPricing({ ...localPricing, price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all font-ge"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">აქციის ფასდაკლება (%)</label>
                <input 
                  type="number"
                  value={localPricing.salePercentage || 0}
                  onChange={(e) => setLocalPricing({ ...localPricing, salePercentage: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all font-ge"
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

        {/* Distance & Fuel Fee */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/10 text-indigo-400 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">მანძილი და საწვავის გადასახადი</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-sm text-slate-400">აირჩიეთ საწყისი წერტილი რუკაზე, საიდანაც მოხდება მანძილის გამოთვლა კლიენტის მისამართამდე.</p>
              <AdminBaseMap 
                location={localPricing.baseLocation || { lat: 41.7151, lng: 44.8271 }}
                onChange={(loc) => setLocalPricing({ ...localPricing, baseLocation: loc })}
              />
              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-white/5">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                  Lat: {localPricing.baseLocation?.lat.toFixed(4)}, Lng: {localPricing.baseLocation?.lng.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest ml-1">
                  ფასი 1 კმ-ზე (₾)
                </label>
                <div className="relative group">
                  <input 
                    type="number"
                    step="0.1"
                    value={localPricing.pricePerKm || 0}
                    onChange={(e) => setLocalPricing({ ...localPricing, pricePerKm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] py-4 px-6 text-white text-xl font-black outline-none focus:border-indigo-500 transition-all shadow-inner"
                    placeholder="2.0"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₾/KM</div>
                </div>
              </div>

              <div className="p-5 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10 space-y-3">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">როგორ მუშაობს?</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  დაჯავშნისას სისტემა ავტომატურად გამოთვლის მანძილს არჩეულ ბაზასა და კლიენტის ლოკაციას შორის. 
                  ჯამურ ფასს დაემატება: <span className="text-white font-bold">მანძილი (კმ) × {localPricing.pricePerKm}₾</span>.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[10px] text-indigo-300/60 font-bold italic">
                  <CheckCircle className="w-3 h-3" />
                  ავტომატურად აისახება ჩეკში და ვატსაპ შეტყობინებაში.
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Communication Settings */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/10 text-indigo-500 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">კომუნიკაცია და ვერიფიკაცია</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-950/50 rounded-2xl border border-white/5">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Settings (Resend.com)
              </h4>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Resend API Key</label>
                <input 
                  type="password"
                  value={localPricing.resendApiKey || ''}
                  onChange={(e) => setLocalPricing({ ...localPricing, resendApiKey: e.target.value })}
                  placeholder="re_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-600 transition-all font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">გამგზავნი Email</label>
                <input 
                  type="email"
                  value={localPricing.resendSenderEmail || ''}
                  onChange={(e) => setLocalPricing({ ...localPricing, resendSenderEmail: e.target.value })}
                  placeholder="onboarding@resend.dev"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-600 transition-all font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Messaging Providers */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/10 text-purple-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">პროვაიდერები</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">WhatsApp პროვაიდერი</label>
              <select 
                value={localPricing.smsProvider || 'smsto'}
                onChange={(e) => setLocalPricing({ ...localPricing, smsProvider: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-purple-600 transition-all appearance-none"
              >
                <option value="wasender">WASender (Recommended)</option>
                <option value="smsto">SMS.to</option>
                <option value="twilio">Twilio</option>
              </select>
            </div>

            {localPricing.smsProvider === 'wasender' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">WASender API Key</label>
                  <input 
                    type="password"
                    value={localPricing.waSenderApiKey || ''}
                    onChange={(e) => setLocalPricing({ ...localPricing, waSenderApiKey: e.target.value })}
                    placeholder="API Key"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-purple-600 transition-all font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Instance ID (Optional)</label>
                  <input 
                    type="text"
                    value={localPricing.waSenderInstanceId || ''}
                    onChange={(e) => setLocalPricing({ ...localPricing, waSenderInstanceId: e.target.value })}
                    placeholder="Instance ID"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-purple-600 transition-all font-mono text-sm"
                  />
                </div>
              </div>
            ) : localPricing.smsProvider === 'twilio' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Account SID</label>
                  <input 
                    type="text"
                    value={localPricing.twilioSid || ''}
                    onChange={(e) => setLocalPricing({ ...localPricing, twilioSid: e.target.value })}
                    placeholder="AC..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-purple-600 transition-all font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Auth Token</label>
                  <input 
                    type="password"
                    value={localPricing.twilioToken || ''}
                    onChange={(e) => setLocalPricing({ ...localPricing, twilioToken: e.target.value })}
                    placeholder="Token"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-purple-600 transition-all font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Twilio Number</label>
                  <input 
                    type="text"
                    value={localPricing.twilioFrom || ''}
                    onChange={(e) => setLocalPricing({ ...localPricing, twilioFrom: e.target.value })}
                    placeholder="+1..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-purple-600 transition-all font-mono text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-center">
                <p className="text-xs text-slate-500 font-mono italic">SMS.to selects API Key from General Settings if generic SMS is enabled.</p>
              </div>
            )}
          </div>
        </Card>

        {/* General Settings Card */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600/10 text-amber-500 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">ზოგადი პარამეტრები</h3>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">შეფასების ლინკი</label>
            <input 
              type="text"
              value={localPricing.reviewLink || ''}
              onChange={(e) => setLocalPricing({ ...localPricing, reviewLink: e.target.value })}
              placeholder="https://g.page/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-amber-600 transition-all"
            />
          </div>
        </Card>

        {/* Verification Toggles */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/10 text-green-500 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">ვერიფიკაციის მეთოდების ჩართვა</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-white font-bold">WhatsApp</span>
              </div>
              <button 
                onClick={() => setLocalPricing({ ...localPricing, isWhatsappVerificationEnabled: !localPricing.isWhatsappVerificationEnabled })}
                className={cn(
                  "w-10 h-5 rounded-full transition-all relative",
                  localPricing.isWhatsappVerificationEnabled ? "bg-green-600" : "bg-slate-800"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                  localPricing.isWhatsappVerificationEnabled ? "left-6" : "left-1"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-white font-bold">Email</span>
              </div>
              <button 
                onClick={() => setLocalPricing({ ...localPricing, isEmailVerificationEnabled: !localPricing.isEmailVerificationEnabled })}
                className={cn(
                  "w-10 h-5 rounded-full transition-all relative",
                  localPricing.isEmailVerificationEnabled ? "bg-indigo-600" : "bg-slate-800"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                  localPricing.isEmailVerificationEnabled ? "left-6" : "left-1"
                )} />
              </button>
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

function ClientManager({ onBack, lang, bookings: allBookings, pricing }: { onBack: () => void, lang: Language, bookings: Booking[], pricing: PricingSettings }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'frequent'>('all');

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clients');
    });
    return unsubscribe;
  }, []);

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const clientBookings = allBookings.filter(b => 
      b.phone === c.phone || (c.email && b.email === c.email)
    );

    if (activeFilter === 'recent') {
      const thirtyDaysAgo = subDays(new Date(), 30);
      return clientBookings.some(b => parseISO(b.date) >= thirtyDaysAgo);
    }

    if (activeFilter === 'frequent') {
      return clientBookings.length >= 3;
    }

    return true;
  });

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientData = {
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      notes: formData.get('notes') as string,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const phone = formData.get('phone') as string;
      if (editingClient) {
        await updateDoc(doc(db, 'clients', editingClient.id), {
          ...clientData,
          updatedAt: serverTimestamp(),
        });
        setEditingClient(null);
      } else {
        await setDoc(doc(db, 'clients', phone), clientData);
        setSelectedClientId(phone);
      }
      setIsAddingClient(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'clients');
    }
  };

  const deleteClient = async (id: string) => {
    if (!window.confirm("ნამდვილად გსურთ კლიენტის წაშლა?")) return;
    try {
      await deleteDoc(doc(db, 'clients', id));
      if (selectedClientId === id) setSelectedClientId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    }
  };

  if (selectedClientId) {
    return <ClientProfileView 
      clientId={selectedClientId} 
      onBack={() => setSelectedClientId(null)} 
      lang={lang}
      allBookings={allBookings}
      pricing={pricing}
    />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-300 hover:bg-slate-900">
          <ArrowLeft className="w-4 h-4" /> უკან
        </Button>
        <div className="flex w-full md:w-auto gap-2">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            <button 
              onClick={() => setActiveFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                activeFilter === 'all' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
            >
              ყველა
            </button>
            <button 
              onClick={() => setActiveFilter('recent')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                activeFilter === 'recent' ? "bg-blue-600/20 text-blue-500 shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
            >
              ბოლო (30დღე)
            </button>
            <button 
              onClick={() => setActiveFilter('frequent')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                activeFilter === 'frequent' ? "bg-indigo-600/20 text-indigo-500 shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
            >
              აქტიური
            </button>
          </div>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="ძებნა (სახელი, ტელ...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-white text-sm outline-none focus:border-blue-600 transition-all font-ge"
            />
          </div>
          <Button onClick={() => setIsAddingClient(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> კლიენტის დამატება
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">სახელი</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">საკონტაქტო</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">შექმნილია</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">იტვირთება...</td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">კლიენტები არ მოიძებნა</td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr 
                    key={client.id} 
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold text-sm">
                          {client.fullName.charAt(0)}
                        </div>
                        <span className="font-bold text-white text-sm">{client.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        <div className="text-slate-300 flex items-center gap-2 font-mono"><Phone className="w-3 h-3 text-slate-500" /> {client.phone}</div>
                        {client.email && <div className="text-slate-500 flex items-center gap-2 font-mono"><Mail className="w-3 h-3 text-slate-500" /> {client.email}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">
                        {client.createdAt?.seconds ? format(new Date(client.createdAt.seconds * 1000), 'dd.MM.yyyy') : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => {
                            setEditingClient(client);
                            setIsAddingClient(true);
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteClient(client.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {isAddingClient && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">{editingClient ? 'კლიენტის რედაქტირება' : 'ახალი კლიენტი'}</h3>
                <button onClick={() => { setIsAddingClient(false); setEditingClient(null); }} className="text-slate-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddClient} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">სრული სახელი</label>
                  <input 
                    name="fullName"
                    required
                    defaultValue={editingClient?.fullName || ''}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all font-ge"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">ტელეფონი</label>
                  <input 
                    name="phone"
                    required
                    defaultValue={editingClient?.phone || ''}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input 
                    name="email"
                    type="email"
                    defaultValue={editingClient?.email || ''}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">შენიშვნები კლიენტზე</label>
                  <textarea 
                    name="notes"
                    defaultValue={editingClient?.notes || ''}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all min-h-[100px]"
                  />
                </div>
                <Button type="submit" className="w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500">
                  {editingClient ? 'შენახვა' : 'დამატება'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClientProfileView({ clientId, onBack, lang, allBookings, pricing }: { clientId: string, onBack: () => void, lang: Language, allBookings: Booking[], pricing: PricingSettings }) {
  const [client, setClient] = useState<Client | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'cars' | 'history'>('info');
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  useEffect(() => {
    const unsubClient = onSnapshot(doc(db, 'clients', clientId), (doc) => {
      setClient({ id: doc.id, ...doc.data() } as Client);
    });
    const unsubCars = onSnapshot(collection(db, 'clients', clientId, 'cars'), (snap) => {
      setCars(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car)));
    });
    return () => {
      unsubClient();
      unsubCars();
    };
  }, [clientId]);

  const clientBookings = allBookings.filter(b => 
    b.phone === client?.phone || (client?.email && b.email === client.email)
  );

  const handleAddCar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const carData = {
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      year: formData.get('year') as string,
      licensePlate: formData.get('licensePlate') as string,
      color: formData.get('color') as string,
      notes: formData.get('notes') as string,
    };

    try {
      if (editingCar) {
        await updateDoc(doc(db, 'clients', clientId, 'cars', editingCar.id), carData);
        setEditingCar(null);
      } else {
        await addDoc(collection(db, 'clients', clientId, 'cars'), carData);
      }
      setIsAddingCar(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `clients/${clientId}/cars`);
    }
  };

  const deleteCar = async (carId: string) => {
    if (!window.confirm("ნამდვილად გსურთ მანქანის წაშლა?")) return;
    try {
      await deleteDoc(doc(db, 'clients', clientId, 'cars', carId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${clientId}/cars/${carId}`);
    }
  };

  const handleAddBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const price = pricing.price;

    const bookingData = {
      customerName: client.fullName,
      phone: client.phone,
      email: client.email || '',
      service: 'DetailingService',
      date: formData.get('date') as string,
      timeSlot: formData.get('timeSlot') as string,
      location: formData.get('location') as string,
      carModel: formData.get('carModel') as string,
      price: price,
      finalPrice: price,
      status: formData.get('status') as string,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'bookings'), bookingData);
      setIsAddingBooking(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bookings');
    }
  };

  if (!client) return <div className="text-center py-20 text-slate-500 uppercase font-black tracking-tighter animate-pulse">Loading Identity...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-300 hover:bg-slate-900">
          <ArrowLeft className="w-4 h-4" /> კლიენტებში დაბრუნება
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Mini Profile */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-slate-900 border-slate-800 p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold text-3xl mx-auto mb-4 border border-blue-500/20 shadow-xl shadow-blue-600/10">
              {client.fullName.charAt(0)}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{client.fullName}</h3>
            <p className="text-xs text-slate-500 mb-6">{client.phone}</p>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveSubTab('info')}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3",
                  activeSubTab === 'info' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Info className="w-4 h-4" /> ინფორმაცია
              </button>
              <button 
                onClick={() => setActiveSubTab('cars')}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3",
                  activeSubTab === 'cars' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Car className="w-4 h-4" /> მანქანები <span className="ml-auto bg-slate-950 px-2 py-0.5 rounded-lg text-[10px] font-black">{cars.length}</span>
              </button>
              <button 
                onClick={() => setActiveSubTab('history')}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3",
                  activeSubTab === 'history' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <History className="w-4 h-4" /> ისტორია <span className="ml-auto bg-slate-950 px-2 py-0.5 rounded-lg text-[10px] font-black">{clientBookings.length}</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeSubTab === 'info' && (
              <motion.div 
                key="info"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">საკონტაქტო ნომერი</label>
                        <p className="text-white font-bold flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-500" /> {client.phone}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Email</label>
                        <p className="text-white font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-indigo-500" /> {client.email || 'არ არის მითითებული'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">შექმნის თარიღი</label>
                        <p className="text-slate-300 text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" /> 
                          {client.createdAt?.seconds ? format(new Date(client.createdAt.seconds * 1000), 'MMM dd, yyyy HH:mm') : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">ბოლო განახლება</label>
                        <p className="text-slate-300 text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" /> 
                          {client.updatedAt?.seconds ? format(new Date(client.updatedAt.seconds * 1000), 'MMM dd, yyyy HH:mm') : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-800">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">შენიშვნები კლიენტზე</label>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-sm text-slate-400 min-h-[120px] whitespace-pre-wrap leading-relaxed">
                      {client.notes || 'შენიშვნები არ არის...'}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeSubTab === 'cars' && (
              <motion.div 
                key="cars"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-white">მანქანების სია</h3>
                  <Button variant="outline" size="sm" onClick={() => setIsAddingCar(true)} className="gap-2 border-slate-700 hover:bg-slate-800 text-slate-300">
                    <Plus className="w-4 h-4" /> მანქანის დამატება
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cars.length === 0 ? (
                    <div className="md:col-span-2 text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/50 flex flex-col items-center gap-3">
                      <Car className="w-8 h-8 opacity-20" />
                      <span className="text-sm">მანქანები არ არის დამატებული</span>
                    </div>
                  ) : (
                    cars.map(car => (
                      <Card key={car.id} className="bg-slate-900 border-slate-800 p-5 group hover:border-blue-600/30 transition-all relative overflow-hidden">
                        <div className="absolute top-2 right-2 p-1 flex gap-1 z-10">
                          <button onClick={() => { setEditingCar(car); setIsAddingCar(true); }} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteCar(car.id)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-colors shrink-0">
                            <Car className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-lg text-white leading-tight">{car.brand} {car.model}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{car.licensePlate}</span>
                              {car.year && <span className="text-[10px] font-bold text-slate-500">{car.year}</span>}
                              {car.color && <span className="text-[10px] font-bold text-slate-500 capitalize">{car.color}</span>}
                            </div>
                          </div>
                        </div>

                        {car.notes && (
                          <div className="mt-4 p-3 bg-slate-950 rounded-xl text-xs text-slate-500 italic border border-slate-800/50">
                            "{car.notes}"
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeSubTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">დაჯავშნების ისტორია</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{clientBookings.length} ჯავშანი</div>
                    <Button variant="outline" size="sm" onClick={() => setIsAddingBooking(true)} className="gap-2 border-slate-700 hover:bg-slate-800 text-slate-300">
                      <Plus className="w-4 h-4" /> ჯავშნის დამატება
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {clientBookings.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/50 flex flex-col items-center gap-4">
                      <History className="w-10 h-10 opacity-10" />
                      <span className="text-sm font-bold tracking-widest uppercase">ისტორია ცარიელია</span>
                    </div>
                  ) : (
                    clientBookings.sort((a,b) => b.date.localeCompare(a.date)).map(booking => (
                      <Card key={booking.id} className="bg-slate-900 border-slate-800 p-4 hover:border-slate-700 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-1 h-10 rounded-full",
                            booking.status === 'pending' ? "bg-yellow-500" : booking.status === 'completed' ? "bg-green-500" : "bg-red-500"
                          )} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white text-sm">
                                {booking.service === 'DetailingService' ? 'Exclusive Package' : booking.service}
                              </p>
                              {booking.carModel && (
                                <span className="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{booking.carModel}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <Calendar className="w-3 h-3" /> {format(parseISO(booking.date), 'MMM dd, yyyy')} • {booking.timeSlot}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-white text-sm">{booking.finalPrice}₾</p>
                          <span className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block",
                            booking.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" : booking.status === 'completed' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {booking.status}
                          </span>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isAddingCar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">{editingCar ? 'მანქანის რედაქტირება' : 'ახალი მანქანა'}</h3>
                <button onClick={() => { setIsAddingCar(false); setEditingCar(null); }} className="text-slate-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddCar} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">ბრენდი</label>
                    <input 
                      name="brand"
                      required
                      defaultValue={editingCar?.brand || ''}
                      placeholder="e.g. BMW"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all font-ge"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">მოდელი</label>
                    <input 
                      name="model"
                      required
                      defaultValue={editingCar?.model || ''}
                      placeholder="e.g. X5"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">წელი</label>
                    <input 
                      name="year"
                      defaultValue={editingCar?.year || ''}
                      placeholder="2020"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">ნომერი (Plate)</label>
                    <input 
                      name="licensePlate"
                      required
                      defaultValue={editingCar?.licensePlate || ''}
                      placeholder="AA-123-AA"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">ფერი</label>
                  <input 
                    name="color"
                    defaultValue={editingCar?.color || ''}
                    placeholder="Black"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">შენიშვნები</label>
                  <textarea 
                    name="notes"
                    defaultValue={editingCar?.notes || ''}
                    placeholder="leather interior..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all min-h-[80px]"
                  />
                </div>
                <Button type="submit" className="w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                  {editingCar ? 'შენახვა' : 'დამატება'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">ჯავშნის დამატება</h3>
                <button onClick={() => setIsAddingBooking(false)} className="text-slate-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">თარიღი</label>
                    <input 
                      name="date"
                      type="date"
                      required
                      defaultValue={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">დრო</label>
                    <input 
                      name="timeSlot"
                      required
                      placeholder="e.g. 14:00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">მანქანა</label>
                    <select 
                      name="carModel"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all font-ge"
                    >
                      <option value="">აირჩიეთ მანქანა</option>
                      {cars.map(car => (
                        <option key={car.id} value={`${car.brand} ${car.model} (${car.licensePlate})`}>
                          {car.brand} {car.model} - {car.licensePlate}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">სტატუსი</label>
                    <select 
                      name="status"
                      required
                      defaultValue="completed"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all font-ge"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">მისამართი</label>
                  <input 
                    name="location"
                    required
                    placeholder="ლოკაცია"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all font-ge"
                  />
                </div>

                <Button type="submit" className="w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                  ჯავშნის დამატება
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
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

function AddonManager({ onBack, lang }: { onBack: () => void, lang: Language }) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newAddon, setNewAddon] = useState<Partial<Addon>>({
    nameGE: '',
    nameEN: '',
    nameRU: '',
    descriptionGE: '',
    descriptionEN: '',
    descriptionRU: '',
    price: 0,
    active: true
  });

  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Addon>>({});

  useEffect(() => {
    const q = query(collection(db, 'addons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));
      setAddons(fetched);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'addons');
    });
    return unsubscribe;
  }, []);

  const handleAddAddon = async () => {
    if (!newAddon.nameGE || !newAddon.nameEN || !newAddon.nameRU) return;
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'addons'), {
        ...newAddon,
        createdAt: serverTimestamp()
      });
      setNewAddon({
        nameGE: '',
        nameEN: '',
        nameRU: '',
        descriptionGE: '',
        descriptionEN: '',
        descriptionRU: '',
        price: 0,
        active: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'addons');
    } finally {
      setIsAdding(false);
    }
  };

  const startEditing = (addon: Addon) => {
    setEditingAddonId(addon.id);
    setEditFormData(addon);
  };

  const handleUpdateAddon = async () => {
    if (!editingAddonId || !editFormData.nameGE || !editFormData.nameEN || !editFormData.nameRU) return;
    try {
      await updateDoc(doc(db, 'addons', editingAddonId), {
        ...editFormData,
        updatedAt: serverTimestamp()
      });
      setEditingAddonId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `addons/${editingAddonId}`);
    }
  };

  const toggleAddonStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'addons', id), { active: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `addons/${id}`);
    }
  };

  const deleteAddon = async (id: string) => {
    if (!window.confirm(lang === 'GE' ? 'ნამდვილად გსურთ წაშლა?' : 'Are you sure you want to delete?')) return;
    try {
      await deleteDoc(doc(db, 'addons', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `addons/${id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-300 hover:bg-slate-900">
          <ArrowLeft className="w-4 h-4" /> საიტზე დაბრუნება
        </Button>
        <h2 className="text-2xl font-bold text-white">{lang === 'GE' ? 'დამატებითი სერვისების მართვა' : 'Manage Additional Services'}</h2>
      </div>

      <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">{lang === 'GE' ? 'ახალი სერვისი' : 'New Service'}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">სახელი (GE)</label>
            <input 
              type="text"
              value={newAddon.nameGE}
              onChange={(e) => setNewAddon({ ...newAddon, nameGE: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all font-ge"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">სახელი (EN)</label>
            <input 
              type="text"
              value={newAddon.nameEN}
              onChange={(e) => setNewAddon({ ...newAddon, nameEN: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">სახელი (RU)</label>
            <input 
              type="text"
              value={newAddon.nameRU}
              onChange={(e) => setNewAddon({ ...newAddon, nameRU: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ფასი (₾)</label>
            <input 
              type="number"
              value={newAddon.price}
              onChange={(e) => setNewAddon({ ...newAddon, price: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-1 border-t border-slate-800/50 pt-4">
             <Button 
               onClick={handleAddAddon} 
               disabled={isAdding || !newAddon.nameGE || !newAddon.nameEN || !newAddon.nameRU}
               className="w-full py-3 rounded-xl font-bold"
             >
               {isAdding ? 'ემატება...' : 'დამატება'}
             </Button>
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">აღწერა (GE)</label>
            <textarea 
              value={newAddon.descriptionGE}
              onChange={(e) => setNewAddon({ ...newAddon, descriptionGE: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all min-h-[80px] font-ge"
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">აღწერა (EN)</label>
            <textarea 
              value={newAddon.descriptionEN}
              onChange={(e) => setNewAddon({ ...newAddon, descriptionEN: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all min-h-[80px]"
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">აღწერა (RU)</label>
            <textarea 
              value={newAddon.descriptionRU}
              onChange={(e) => setNewAddon({ ...newAddon, descriptionRU: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-600 transition-all min-h-[80px]"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" /> {lang === 'GE' ? 'არსებული სერვისები' : 'Existing Services'}
        </h3>
        
        {isLoading ? (
          <div className="text-center py-10 text-slate-500">იტვირთება...</div>
        ) : addons.length === 0 ? (
          <Card className="p-10 text-center bg-slate-900 border-slate-800 border-dashed">
            <p className="text-slate-500">სერვისები არ არის დამატებული.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {addons.map(addon => {
              const isEditing = editingAddonId === addon.id;
              
              if (isEditing) {
                return (
                  <Card key={addon.id} className="bg-slate-900 border-blue-600/50 p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">სახელი (GE)</label>
                        <input 
                          type="text"
                          value={editFormData.nameGE || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, nameGE: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm font-ge"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">სახელი (EN)</label>
                        <input 
                          type="text"
                          value={editFormData.nameEN || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, nameEN: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">სახელი (RU)</label>
                        <input 
                          type="text"
                          value={editFormData.nameRU || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, nameRU: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">აღწერა (GE)</label>
                        <textarea 
                          value={editFormData.descriptionGE || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, descriptionGE: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm min-h-[60px] font-ge"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">აღწერა (EN)</label>
                        <textarea 
                          value={editFormData.descriptionEN || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, descriptionEN: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">აღწერა (RU)</label>
                        <textarea 
                          value={editFormData.descriptionRU || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, descriptionRU: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ფასი (₾)</label>
                        <input 
                          type="number"
                          value={editFormData.price || 0}
                          onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button onClick={handleUpdateAddon} className="flex-1">შენახვა</Button>
                        <Button variant="ghost" onClick={() => setEditingAddonId(null)} className="flex-1 bg-slate-800">გაუქმება</Button>
                      </div>
                    </div>
                  </Card>
                );
              }

              return (
                <Card key={addon.id} className="bg-slate-900 border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-all hover:border-slate-700">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0",
                      addon.active ? "bg-blue-600/10 text-blue-500" : "bg-slate-800 text-slate-500"
                    )}>
                      {addon.price}₾
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-white text-lg tracking-tight">{getLangValue(lang, addon.nameGE, addon.nameEN, addon.nameRU)}</h4>
                      <p className="text-xs text-slate-500">{getLangValue(lang, addon.descriptionGE, addon.descriptionEN, addon.descriptionRU)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => startEditing(addon)}
                      className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500/20 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => toggleAddonStatus(addon.id, addon.active)}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        addon.active ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                      )}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteAddon(addon.id)}
                      className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
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

function ConfirmationPage({ onBack, t, lang }: { onBack: () => void, t: any, lang: Language, key?: string }) {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#30c3fc', '#ffffff', '#2563eb']
    });
    window.scrollTo(0, 0);

    // Google Ads Conversion tracking
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'conversion', {'send_to': 'AW-16454245812/j7DHCPb7w54cELS7_6U9'});
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Depth */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20 mx-auto transform rotate-12">
          <Check className="w-12 h-12 text-white -rotate-12" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black mb-4 text-white font-orbitron tracking-tight uppercase leading-tight">
          {t.bookingConfirmed}
        </h1>
        
        <div className="w-16 h-1 bg-blue-600 mx-auto mb-8 rounded-full" />
        
        <p className="text-slate-400 mb-12 max-w-md mx-auto text-base md:text-lg leading-relaxed">
          {t.successDesc}
        </p>

        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <Button 
            onClick={onBack} 
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 rounded-[2rem] text-lg font-black shadow-2xl shadow-blue-600/30 group flex items-center justify-center gap-3"
          >
            <span>{t.backToHome}</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
