
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TasteForm } from './components/TasteForm';
import { RestaurantCard } from './components/RestaurantCard';
import { MapView } from './components/MapView';
import { Login } from './components/Login';
import { ChefGully } from './components/ChefGully'; // This will now be the unified bot
import { BookingModal } from './components/BookingModal';
import { GastroStories } from './components/GastroStories';
import { BottomNav, TabId } from './components/BottomNav';
import { ProfileView } from './components/ProfileView';
import { QuickActionsFAB } from './components/QuickActionsFAB';
import { OrderTracker } from './components/OrderTracker';
import { TutorialOverlay } from './components/TutorialOverlay';
import { FlavorGame } from './components/FlavorGame'; // New import for FlavorGame
import { findRestaurants, generateSpeech, getCityName, ScoutError, getMockRestaurants } from './services/geminiService';
import { Restaurant, TasteProfile, Booking, User, GroundingSource, Review } from './types';

const WELLNESS_TIPS = [
  "Mindful Tip: Starting with a salad can reduce calorie intake by up to 12%. 🥗",
  "Wellness Insight: High-protein street food exists! Look for grilled tikka nodes. 💪",
  "Flavor Hack: Umami flavors can increase satiety, helping you feel fuller longer. 🍄",
  "Daily Goal: Aim for a 'Soul Food' match of 90%+ for maximum sensory joy. ✨"
];

const MOODS = [
  { id: 'romantic', label: 'Romantic', emoji: '🕯️' },
  { id: 'productive', label: 'Productive', emoji: '💻' },
  { id: 'comfort', label: 'Comfort', emoji: '🧸' },
  { id: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { id: 'celebrate', label: 'Celebrate', emoji: '🥳' }
];

const DEMO_MISSIONS = [
  { title: "Healthy Mumbai", query: "High protein street food in Mumbai", icon: "🇮🇳" },
  { title: "Tokyo Night", query: "Romantic Sushi in Shibuya with city views", icon: "🇯🇵" },
  { title: "Vegan Paris", query: "Plant-based fine dining in Le Marais", icon: "🇫🇷" },
  { title: "Keto NY", query: "Steakhouse with keto sides in Manhattan", icon: "🇺🇸" }
];

export const DEFAULT_PROFILE: TasteProfile = {
  dietaryPreferences: [],
  preferredTextures: [],
  preferredCuisines: [],
  features: ['Healthy Choice', 'Low Sugar', 'High Protein'], // Defaulting these to pre-selected to satisfy new compulsory requirements
  atmosphere: "Lively",
  diningTheme: "Casual",
  budget: "₹₹",
  customNotes: "",
  occasion: '',
  maxDistance: "25km",
  ageGroup: '',
  comfortPreference: '',
  healthGoal: '',
  preferredFlourTypes: [], // New default
  seatingPreferences: [], // New default
  facilities: [], // New default
  musicVibe: 'Soft Background', // New default
  specialDecor: [], // New default
  noiseLevel: 'Moderate', // New default
  lightingStyle: 'Bright Casual', // New default
  favoriteFlavors: [], // Default for game results
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('explore');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ScoutError | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeProfile, setActiveProfile] = useState<TasteProfile>(DEFAULT_PROFILE);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showFlavorGame, setShowFlavorGame] = useState(false); // New state for FlavorGame
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [activeBookingRestaurant, setActiveBookingRestaurant] = useState<Restaurant | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sortMethod, setSortMethod] = useState<'match' | 'rating'>('match');
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<{name: string, status: string, progress: number} | null>(null);
  const [hasInteractedWithBot, setHasInteractedWithBot] = useState(false); // New state for bot interaction

  // Demo: Local Review Cache to simulate interaction
  const [localReviews, setLocalReviews] = useState<Record<string, Review[]>>({});

  useEffect(() => {
    const storedUser = localStorage.getItem('tastetrail_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      const hasSeenTutorial = localStorage.getItem('tastetrail_tutorial_seen');
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      } else {
        const hasCompletedFlavorGame = localStorage.getItem('tastetrail_flavor_game_completed');
        if (!hasCompletedFlavorGame) {
          setShowFlavorGame(true);
        }
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        try { const city = await getCityName(coords.lat, coords.lng); setCityName(city); } catch (e) {}
      });
    }

    // Mock order for UX feedback
    setTimeout(() => {
      setActiveOrder({ name: "Sushi Zen", status: "Chef preparing your order...", progress: 65 });
    }, 15000);
  }, []);

  const handleSearch = useCallback(async (profile: TasteProfile, photoBase64?: string, voiceQuery?: string, isFastDemo = false) => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setActiveProfile(profile);
    setActiveTab('explore');
    setSelectedRestaurant(null);
    
    try {
      let result;
      if (isFastDemo) {
        await new Promise(r => setTimeout(r, 1500));
        result = { restaurants: getMockRestaurants(profile.customNotes), sources: [], rawResponse: "Demo results loaded." };
      } else {
        result = await findRestaurants(profile, location, photoBase64, currentUser, voiceQuery);
      }

      if (result.errorCode) {
        setError(result.errorCode);
      } else {
        setRestaurants(result.restaurants);
        setGroundingSources(result.sources || []);
        generateSpeech(`Scouted ${result.restaurants.length} gourmet nodes for you. Ready for sync!`);
      }
    } catch (err) { setError('LOGIC_CRASH'); } 
    finally { setIsLoading(false); }
  }, [currentUser, location]);

  const runDemoMission = (mission: typeof DEMO_MISSIONS[0]) => {
    const demoProfile: TasteProfile = {
      ...DEFAULT_PROFILE,
      features: ['trending', 'Healthy Choice', 'Low Sugar', 'High Protein'], // Ensure compulsory health filters are set
      customNotes: mission.query,
      maxDistance: "Global",
    };
    handleSearch(demoProfile, undefined, undefined, true);
  };

  const addLocalReview = (restaurantName: string, review: Review) => {
    setLocalReviews(prev => ({
      ...prev,
      [restaurantName]: [review, ...(prev[restaurantName] || [])]
    }));
  };

  const goBack = () => {
    if (selectedRestaurant) {
      setSelectedRestaurant(null);
    } else if (hasSearched) {
      setHasSearched(false);
      setRestaurants([]);
      setGroundingSources([]);
    } else {
      setActiveTab('explore');
    }
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleFlavorGameComplete = (gameProfile: Partial<TasteProfile>) => {
    // Merge game profile with default values, ensuring compulsory health filters are retained
    setActiveProfile(prev => ({ 
      ...prev, 
      ...gameProfile,
      features: Array.from(new Set([...prev.features, ...(gameProfile.features || []), 'Healthy Choice', 'Low Sugar', 'High Protein']))
    }));
    localStorage.setItem('tastetrail_flavor_game_completed', 'true');
    setShowFlavorGame(false);
  };

  const sortedRestaurants = useMemo(() => {
    const list = [...restaurants];
    if (sortMethod === 'match') return list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [restaurants, sortMethod]);

  if (!currentUser) return <Login onLogin={(user) => { setCurrentUser(user); localStorage.setItem('tastetrail_user', JSON.stringify(user)); setShowTutorial(true); }} />;

  if (showTutorial) return <TutorialOverlay onComplete={() => { setShowTutorial(false); setShowFlavorGame(true); }} />;

  if (showFlavorGame) return <FlavorGame onComplete={handleFlavorGameComplete} />;

  return (
    <div className={`min-h-screen pb-48 transition-colors duration-500 ${isDarkMode ? 'bg-deepPlum text-slate-100 dark' : 'bg-[#fafafa]'}`}>
      
      {/* Wellness Ticker */}
      <div className="bg-lightCoral text-white py-1.5 overflow-hidden whitespace-nowrap relative border-b border-white/10 z-[1100]">
        <div className="flex animate-scroll-text gap-12 items-center">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-12 items-center text-[10px] font-black uppercase tracking-widest">
              {WELLNESS_TIPS.map((tip, idx) => (
                <span key={idx} className="flex items-center gap-2">
                  <span className="google-symbols text-[14px]">health_and_safety</span> {tip}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation Header */}
      <nav className="sticky top-0 z-[1100] glass px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {(selectedRestaurant || hasSearched || activeTab !== 'explore') && (
            <button onClick={goBack} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 border border-slate-200 dark:border-slate-700">
              <span className="google-symbols">arrow_back</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primaryRed rounded-xl flex items-center justify-center shadow-lg border-2 border-white/20">
              <span className="text-xl">🐒</span>
            </div>
            <div>
              <h1 className="font-serif font-black text-xl text-primaryRed leading-none tracking-tight">TasteTrail</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="google-symbols text-[10px] text-slate-400">location_on</span>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{cityName || 'Syncing Location...'}</p>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="google-symbols p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-md text-slate-500 border border-slate-100 dark:border-slate-700">
          {isDarkMode ? 'light_mode' : 'dark_mode'}
        </button>
      </nav>

      <main className="container mx-auto py-8">
        <>
            {selectedRestaurant ? (
              <div className="px-6 animate-in slide-in-from-right-10 duration-500">
                <RestaurantCard 
                  restaurant={{
                    ...selectedRestaurant,
                    reviews: [...(localReviews[selectedRestaurant.name] || []), ...selectedRestaurant.reviews]
                  }} 
                  currentUser={currentUser} 
                  userProfile={activeProfile} 
                  onBook={() => setActiveBookingRestaurant(selectedRestaurant)}
                  onViewOnMap={() => { setActiveTab('map'); setSelectedRestaurant(null); }}
                  onAddReview={(rev) => addLocalReview(selectedRestaurant.name, rev)}
                />
              </div>
            ) : activeTab === 'explore' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                {!hasSearched ? (
                  <>
                    <GastroStories />

                    {/* Demo Missions Hub */}
                    <section className="px-6 space-y-4">
                      <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
                        <span className="google-symbols text-sm text-primaryRed">rocket_launch</span> Demo Missions
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {DEMO_MISSIONS.map((mission, idx) => (
                          <button 
                            key={idx}
                            onClick={() => runDemoMission(mission)}
                            className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-primaryRed flex items-center gap-3 transition-all active:scale-95 text-left group shadow-sm"
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{mission.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-300 leading-none">{mission.title}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <div className="px-6 flex gap-3 overflow-x-auto no-scrollbar">
                      {MOODS.map(mood => (
                        <button key={mood.id} onClick={() => setActiveMood(mood.id === activeMood ? null : mood.id)} className={`flex-shrink-0 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-2 transition-all ${activeMood === mood.id ? 'bg-primaryRed border-primaryRed text-white shadow-xl scale-105' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                          <span>{mood.emoji}</span> {mood.label}
                        </button>
                      ))}
                    </div>
                    <TasteForm onSearch={handleSearch} isLoading={isLoading} initialProfile={activeProfile} />
                  </>
                ) : (
                  <div className="space-y-12 px-6">
                    {/* ScoutSearchBot replaced by ChefGully below */}
                    {isLoading ? (
                      <div className="flex flex-col items-center py-32 gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primaryRed blur-3xl opacity-20 animate-pulse"></div>
                          <span className="google-symbols text-6xl animate-spin text-primaryRed">sync</span>
                        </div>
                        <div className="text-center space-y-2">
                           <p className="text-[12px] font-black uppercase tracking-[0.4em] text-primaryRed">Grounding Live Node...</p>
                           <p className="text-[10px] font-medium text-slate-400">Deep-linking Zomato, Swiggy & Health data.</p>
                        </div>
                      </div>
                    ) : error ? (
                       <div className="text-center py-20 space-y-6">
                          <span className="google-symbols text-6xl text-rose-500">error</span>
                          <h3 className="text-2xl font-serif font-black">Sync Failure</h3>
                          <p className="text-slate-400 font-medium">The discovery grid hit a snag. Let's recalibrate.</p>
                          <button onClick={() => setHasSearched(false)} className="px-8 py-3 bg-primaryRed text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Reset Scout</button>
                       </div>
                    ) : (
                      <div className="max-w-6xl mx-auto space-y-12">
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-slate-100 dark:border-slate-800 pb-8">
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primaryRed mb-2">Sync Report Established</p>
                              <h2 className="text-4xl font-serif font-black">{restaurants.length} Proper Nodes Found.</h2>
                           </div>
                           <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full shadow-inner">
                              {['match', 'rating'].map(m => (
                                <button key={m} onClick={() => setSortMethod(m as any)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${sortMethod === m ? 'bg-white dark:bg-slate-700 text-primaryRed shadow-md' : 'text-slate-400'}`}>
                                  {m}
                                </button>
                              ))}
                           </div>
                        </header>

                        {/* Grounding Attribution Hub */}
                        {groundingSources.length > 0 && (
                          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 space-y-4 shadow-sm overflow-hidden">
                             <div className="flex items-center gap-2">
                                <span className="google-symbols text-emerald-500 filled">verified</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grounded Evidence Log</span>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {groundingSources.map((s, idx) => (
                                  <a key={idx} href={s.uri} target="_blank" className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[9px] font-black text-slate-500 hover:text-primaryRed border border-transparent hover:border-primaryRed/20 transition-all flex items-center gap-2 no-underline">
                                     <span className="google-symbols text-sm">link</span>
                                     {s.title || 'Source Node'}
                                  </a>
                                ))}
                             </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          {sortedRestaurants.map((r, i) => (
                            <div key={i} onClick={() => setSelectedRestaurant(r)} className="cursor-pointer group transition-all duration-500">
                              <RestaurantCard 
                                restaurant={{
                                  ...r,
                                  reviews: [...(localReviews[r.name] || []), ...r.reviews]
                                }} 
                                currentUser={currentUser} 
                                userProfile={activeProfile} 
                                onBook={() => { 
                                  // Compulsory bot interaction before booking
                                  if (!hasInteractedWithBot) {
                                    generateSpeech("Hold on! You need to interact with Chef Gully first. Tap his mic for a quick chat!");
                                    return;
                                  }
                                  setActiveBookingRestaurant(r);
                                }}
                                onViewOnMap={() => { setActiveTab('map'); setSelectedRestaurant(null); }}
                                onAddReview={(rev) => addLocalReview(r.name, rev)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === 'map' ? (
              <div className="px-6">
                <MapView 
                  restaurants={restaurants} 
                  userLocation={location} 
                  selectedId={null}
                  onSelectRestaurant={(idx) => setSelectedRestaurant(restaurants[idx])}
                />
              </div>
            ) : activeTab === 'orders' ? (
              <div className="px-6 space-y-12">
                <header className="text-center py-12">
                   <h2 className="text-4xl font-serif font-black">Booking Logs</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primaryRed mt-2">Historical Synchronizations</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                   {bookings.length > 0 ? bookings.map((b) => (
                     <div key={b.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] scout-card-shadow border border-slate-50 dark:border-slate-800 flex items-center justify-between group hover:border-primaryRed transition-all">
                        <div className="space-y-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-lightCoral bg-lightCoral/5 px-2 py-1 rounded-lg">Confirmed ✨</span>
                           <h3 className="text-xl font-black group-hover:text-primaryRed transition-colors">{b.restaurantName}</h3>
                           <p className="text-[11px] font-bold text-slate-400">{b.date} • {b.time}</p>
                        </div>
                        <span className="google-symbols text-slate-300 group-hover:text-primaryRed transition-colors">calendar_today</span>
                     </div>
                   )) : (
                     <div className="col-span-full py-32 text-center opacity-30 grayscale flex flex-col items-center">
                       <span className="google-symbols text-7xl">history</span>
                       <p className="text-xs font-black uppercase tracking-widest mt-4">No logs found.</p>
                     </div>
                   )}
                </div>
              </div>
            ) : (
              <ProfileView user={currentUser} onLogout={() => { localStorage.clear(); window.location.reload(); }} />
            )}
         </>
        )}
      </main>

      <ChefGully 
        context={isLoading ? 'loading' : (hasSearched ? 'results' : 'form')} 
        userName={currentUser.name} 
        onVoiceSearch={(query) => handleSearch(activeProfile, undefined, query)}
        isLoadingApp={isLoading}
        onBotInteraction={() => setHasInteractedWithBot(true)} // Mark bot as interacted
      />

      {activeBookingRestaurant && (
        <BookingModal 
          restaurant={activeBookingRestaurant} 
          onClose={() => setActiveBookingRestaurant(null)}
          onConfirm={(booking) => setBookings([booking, ...bookings])}
        />
      )}

      {activeOrder && (
        <OrderTracker 
          restaurantName={activeOrder.name} 
          status={activeOrder.status} 
          progress={activeOrder.progress} 
        />
      )}

      <QuickActionsFAB onAction={() => {}} />

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setSelectedRestaurant(null); }} 
        onQuickScout={() => { setHasSearched(false); setActiveTab('explore'); setSelectedRestaurant(null); }} 
      />
    </div>
  );
};