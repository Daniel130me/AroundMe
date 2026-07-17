import React, { useState, useEffect } from "react";
import { 
  Compass, MapPin, Bookmark, Sparkles, BookOpen, User, 
  Search, Filter, Sliders, Volume2, Award, Info, X, WifiOff, Map as MapIcon, 
  MessageSquare, ChevronRight, CornerDownRight, Navigation, Menu, Heart,
  Sun, Moon
} from "lucide-react";
import { Place } from "./types";

// Import custom sub-components
import DiscoveryMap from "./components/DiscoveryMap";
import Onboarding from "./components/Onboarding";
import PlaceDetail from "./components/PlaceDetail";
import AskAIChat from "./components/AskAIChat";
import TravelMode from "./components/TravelMode";
import Contributions from "./components/Contributions";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("aroundme_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("aroundme_theme", theme);
  }, [theme]);

  // Navigation & User session states
  const [onboarded, setOnboarded] = useState<boolean>(() => {
    return localStorage.getItem("aroundme_onboarded") === "true";
  });
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; isGuest: boolean } | null>(() => {
    const cached = localStorage.getItem("aroundme_user_profile");
    return cached ? JSON.parse(cached) : null;
  });
  const [userInterests, setUserInterests] = useState<string[]>(() => {
    const cached = localStorage.getItem("aroundme_user_interests");
    return cached ? JSON.parse(cached) : [];
  });

  // Main UI state
  const [places, setPlaces] = useState<Place[]>([]);
  const [googlePlaces, setGooglePlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Combine local backend places and real-time Google Places, deduplicating by ID
  const combinedPlaces = React.useMemo(() => {
    const merged = [...places, ...googlePlaces];
    const seen = new Set<string>();
    return merged.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [places, googlePlaces]);
  const [activeView, setActiveView] = useState<"map" | "discover" | "saved" | "contributions" | "admin" | "travel">("map");
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Geolocation states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Map preferences
  const [mapLayer, setMapLayer] = useState<"streets" | "satellite">("streets");

  // Transit/Travel states
  const [transitActive, setTransitActive] = useState(false);
  const [transitSpeed, setTransitSpeed] = useState(5); // Simulated velocity

  // Conversational AI States
  const [chattingPlace, setChattingPlace] = useState<Place | null>(null);
  const [chattingRole, setChattingRole] = useState("Local Tour Guide");

  // Bottom Sheet expansion controls (on mobile)
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  // Sync Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Network offline/online listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch current user GPS coordinates (with privacy-aware fallback)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setUserLocation(loc);
          setCurrentLocation(loc);
        },
        () => {
          // Lagos, Nigeria default center
          const fallback = { lat: 6.4447, lng: 3.4045 };
          setUserLocation(fallback);
          setCurrentLocation(fallback);
        }
      );
    } else {
      const fallback = { lat: 6.4447, lng: 3.4045 };
      setUserLocation(fallback);
      setCurrentLocation(fallback);
    }
  }, []);

  // Load nearby places from backend Express API
  useEffect(() => {
    const catParam = categoryFilter !== "All" ? `category=${categoryFilter}` : "";
    const searchParam = debouncedSearch ? `search=${encodeURIComponent(debouncedSearch)}` : "";
    const latParam = currentLocation ? `lat=${currentLocation.lat}` : "";
    const lngParam = currentLocation ? `lng=${currentLocation.lng}` : "";
    const queryStr = [catParam, searchParam, latParam, lngParam].filter(Boolean).join("&");

    fetch(`/api/places/nearby?${queryStr}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.places) {
          setPlaces(data.places);
        }
      })
      .catch((err) => {
        console.error("Failed to load nearby places:", err);
      });
  }, [categoryFilter, debouncedSearch, currentLocation]);

  // Load saved places from localStorage (for offline/guest persistence)
  useEffect(() => {
    const cached = localStorage.getItem("aroundme_saved_places");
    if (cached) {
      setSavedPlaces(JSON.parse(cached));
    }
  }, []);

  const handleOnboardingComplete = (interests: string[], profile: { name: string; email: string; isGuest: boolean } | null) => {
    setOnboarded(true);
    setUserProfile(profile);
    setUserInterests(interests);
    localStorage.setItem("aroundme_onboarded", "true");
    localStorage.setItem("aroundme_user_profile", JSON.stringify(profile));
    localStorage.setItem("aroundme_user_interests", JSON.stringify(interests));
  };

  const handleToggleSave = (place: Place) => {
    const exists = savedPlaces.some((p) => p.id === place.id);
    let updated: Place[] = [];
    if (exists) {
      updated = savedPlaces.filter((p) => p.id !== place.id);
    } else {
      updated = [place, ...savedPlaces];
    }
    setSavedPlaces(updated);
    localStorage.setItem("aroundme_saved_places", JSON.stringify(updated));
  };

  const handleGenerateImage = async (prompt: string, size: string): Promise<string> => {
    try {
      const res = await fetch("/api/places/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size })
      });
      const data = await res.json();
      if (data.status === "success") {
        return data.imageUrl;
      }
      throw new Error(data.message || "Failed image render.");
    } catch (err) {
      console.error(err);
      return "";
    }
  };

  // Safe logout / reset
  const handleSignOut = () => {
    localStorage.clear();
    setOnboarded(false);
    setUserProfile(null);
    setUserInterests([]);
    setSavedPlaces([]);
    setSelectedPlace(null);
    setChattingPlace(null);
    setActiveView("map");
  };

  // Categories helper
  const CATEGORIES = ["All", "History", "Nature", "Culture", "Food", "Hidden Gems"];

  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const savedPlaceIds = savedPlaces.map((p) => p.id);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden relative select-none">
      {/* 1. SIDEBAR (For Desktop/Tablet Layouts) */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-slate-900 border-r border-slate-800 p-5 shrink-0 select-none z-30">
        <div className="space-y-8">
          {/* App Title */}
          <div className="flex items-center gap-2.5">
            <Compass className="h-7 w-7 text-blue-500 animate-pulse" />
            <span className="text-lg font-black font-sans tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              AroundMe AI
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1.5" id="desktop-sidebar-nav">
            {[
              { id: "map", label: "Interactive Map", icon: MapIcon },
              { id: "discover", label: "Discover Feed", icon: Sparkles },
              { id: "saved", label: "Saved Places", icon: Bookmark },
              { id: "travel", label: "Transit Guide", icon: Volume2 },
              { id: "contributions", label: "Contribute Story", icon: BookOpen },
              { id: "admin", label: "Admin Console", icon: Award }
            ].map((link) => {
              const active = activeView === link.id;
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveView(link.id as any);
                    setSelectedPlace(null);
                    setChattingPlace(null);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-extrabold tracking-wide transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`}
                  id={`nav-link-${link.id}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Theme Switcher Segmented Control */}
        <div className="bg-slate-950/60 border border-slate-800 p-1 rounded-xl flex items-center gap-1 my-4 select-none shrink-0">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              theme === "light"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>Light</span>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            <span>Dark</span>
          </button>
        </div>

        {/* User Status Profile Card */}
        {userProfile && (
          <div className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">
                {userProfile.name.charAt(0)}
              </div>
              <div className="truncate flex-1">
                <div className="text-xs font-extrabold text-white leading-tight truncate">
                  {userProfile.name}
                </div>
                <div className="text-[10px] text-slate-500 leading-none truncate">
                  {userProfile.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-white py-2 rounded-xl font-bold transition-all"
            >
              Log Out / Reset
            </button>
          </div>
        )}
      </aside>

      {/* 2. MAIN WORKING PLATFORM */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Offline notification banner */}
        {isOffline && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-center gap-2 font-bold text-xs shadow-md z-40 transition-all">
            <WifiOff className="h-4 w-4 animate-bounce" />
            <span>PWA Offline Mode. Displaying cached map elements and local stories.</span>
          </div>
        )}

        {/* Mobile floating theme switcher for non-map, non-discover views */}
        {activeView !== "map" && activeView !== "discover" && (
          <div className="md:hidden absolute top-4 right-4 z-40">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Toggle color theme"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-400" />}
            </button>
          </div>
        )}

        {/* Global Search and Filter Bar overlay (when in Map/Discover views) */}
        {(activeView === "map" || activeView === "discover") && (
          <header className="absolute top-4 left-4 right-4 md:left-6 md:right-6 z-20 flex flex-col gap-2.5 max-w-xl mx-auto select-none" id="global-search-header">
            {/* Search Input */}
            <div className="relative flex items-center bg-slate-900/95 border border-slate-800/90 backdrop-blur rounded-2xl shadow-2xl pl-4 pr-2 py-1">
              <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search a place or ask what is interesting nearby..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-100 focus:outline-none placeholder:text-slate-500 font-medium"
                id="universal-search-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              
              {/* Dynamic Theme Toggle Shortcut */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-all cursor-pointer ml-1.5 shrink-0"
                title="Toggle color theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-400" />}
              </button>
            </div>

            {/* Horizontal Category Filters list */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 select-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow ${
                    categoryFilter === cat
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900/95 border border-slate-800/80 text-slate-400 hover:text-white backdrop-blur"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </header>
        )}

        {/* View switching panel render */}
        <div className="flex-1 relative w-full h-full">
          {activeView === "map" && (
            <DiscoveryMap
              places={combinedPlaces}
              selectedPlace={selectedPlace}
              onPlaceSelect={(place) => {
                setSelectedPlace(place);
                setIsSheetExpanded(true);
              }}
              userLocation={userLocation}
              categoryFilter={categoryFilter}
              searchQuery={debouncedSearch}
              isOffline={isOffline}
              mapLayer={mapLayer}
              setMapLayer={setMapLayer}
              transitActive={transitActive}
              transitSpeed={transitSpeed}
              onPlacesFetched={setGooglePlaces}
              onCenterChanged={setCurrentLocation}
            />
          )}

          {activeView === "discover" && (
            <div className="h-full bg-slate-950 p-6 pt-28 overflow-y-auto pb-24" id="discover-feed-view">
              <div className="max-w-4xl mx-auto space-y-6 select-text">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <span>Discover Around Me</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Explore a personalized feed of interesting, highly ranked landmarks and stories closest to you.
                  </p>
                </div>

                {/* Location Selection & Engagement Bar */}
                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl space-y-3 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <MapPin className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span>
                        Discovering landmarks near:{" "}
                        <span className="text-blue-400 font-extrabold font-mono">
                          {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : "Lagos"}
                        </span>
                      </span>
                    </div>
                    {userLocation && currentLocation && (Math.abs(currentLocation.lat - userLocation.lat) > 0.001 || Math.abs(currentLocation.lng - userLocation.lng) > 0.001) && (
                      <button
                        onClick={() => setCurrentLocation(userLocation)}
                        className="text-[10px] font-black uppercase tracking-wider text-blue-400 hover:text-blue-300 bg-blue-600/10 border border-blue-500/20 px-2.5 py-1 rounded-lg transition-all"
                      >
                        Reset to GPS Location
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Jump to Area:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: "Victoria Island", lat: 6.4281, lng: 3.4219 },
                        { name: "Lekki Phase 1", lat: 6.4326, lng: 3.4735 },
                        { name: "Ikoyi", lat: 6.4549, lng: 3.4308 },
                        { name: "Lagos Island", lat: 6.4485, lng: 3.3986 },
                        { name: "Ikeja (Mainland)", lat: 6.6018, lng: 3.3515 },
                        { name: "Surulere", lat: 6.5000, lng: 3.3500 },
                      ].map((nh) => {
                        const isCurrent = currentLocation && Math.abs(currentLocation.lat - nh.lat) < 0.01 && Math.abs(currentLocation.lng - nh.lng) < 0.01;
                        return (
                          <button
                            key={nh.name}
                            onClick={() => {
                              setCurrentLocation({ lat: nh.lat, lng: nh.lng });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                              isCurrent
                                ? "bg-blue-600 text-white border-blue-600 shadow"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"
                            }`}
                          >
                            📍 {nh.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {combinedPlaces.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-850 p-12 rounded-3xl text-center">
                    <Info className="h-8 w-8 text-slate-600 mx-auto mb-3 animate-pulse" />
                    <p className="text-xs text-slate-400 font-bold">
                      There may be something interesting here, but we have not found enough verified information yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {combinedPlaces.map((place) => (
                      <div key={place.id} className="bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between">
                        <div>
                          {/* Image */}
                          <div className="h-44 w-full bg-slate-950 relative">
                            <img
                              src={place.image}
                              alt={place.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-3 left-3 bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                              {place.category}
                            </div>
                            <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur text-slate-300 font-bold text-[9px] px-2 py-0.5 rounded-full">
                              {place.distance}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-5 space-y-2">
                            <h3 className="text-base font-extrabold text-white leading-tight">{place.name}</h3>
                            <div className="text-[11px] text-slate-500 font-bold">{place.type} • {place.address}</div>
                            <p className="text-xs text-slate-300 leading-normal line-clamp-3 italic">
                              "{place.quickFact}"
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="px-5 pb-5 pt-2 border-t border-slate-850/50 flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedPlace(place);
                              setActiveView("map");
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl shadow transition-all text-center"
                          >
                            Explore Landmark
                          </button>
                          <button
                            onClick={() => handleToggleSave(place)}
                            className={`p-2 rounded-xl border transition-all ${
                              savedPlaceIds.includes(place.id)
                                ? "border-blue-500 bg-blue-600/10 text-blue-500"
                                : "border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <Bookmark className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === "saved" && (
            <div className="h-full bg-slate-950 p-6 overflow-y-auto pb-24" id="saved-places-view">
              <div className="max-w-4xl mx-auto space-y-6 select-text">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-blue-500" />
                    <span>Your Saved Discoveries</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Keep track of places you want to visit, local legends, and historical landmarks.
                  </p>
                </div>

                {savedPlaces.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-850 p-12 rounded-3xl text-center">
                    <Bookmark className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-300 mb-1">Your collection is empty</h4>
                    <p className="text-xs text-slate-500">Tap the bookmark icon on any landmark detail page to save it here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedPlaces.map((place) => (
                      <div key={place.id} className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-all">
                        {/* Thumbnail */}
                        <div className="h-20 w-20 rounded-xl overflow-hidden bg-slate-950 shrink-0">
                          <img
                            src={place.image}
                            alt={place.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Title & metadata */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider block">
                            {place.category}
                          </span>
                          <h4 className="text-sm font-extrabold text-white truncate mb-0.5">{place.name}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-2 italic">"{place.quickFact}"</p>
                          
                          <div className="flex gap-2.5 mt-2">
                            <button
                              onClick={() => {
                                setSelectedPlace(place);
                                setActiveView("map");
                              }}
                              className="text-[10px] font-black text-blue-400 hover:underline flex items-center gap-0.5"
                            >
                              Open Map <ChevronRight className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleToggleSave(place)}
                              className="text-[10px] font-black text-slate-500 hover:text-red-400"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === "travel" && (
            <TravelMode
              places={combinedPlaces}
              onPlaceSelect={(place) => {
                setSelectedPlace(place);
                setIsSheetExpanded(true);
                setActiveView("map");
              }}
              savedPlaceIds={savedPlaceIds}
              onToggleSave={handleToggleSave}
              transitActive={transitActive}
              setTransitActive={setTransitActive}
              transitSpeed={transitSpeed}
              setTransitSpeed={setTransitSpeed}
            />
          )}

          {activeView === "contributions" && (
            <Contributions places={LAGOS_MOCK_PLACES} userProfile={userProfile} />
          )}

          {activeView === "admin" && (
            <AdminDashboard />
          )}
        </div>

        {/* 3. MOBILE BOTTOM NAVIGATION (Hidden on Desktop) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 py-2.5 px-4 flex justify-around z-30 shadow-2xl select-none" id="mobile-bottom-nav">
          {[
            { id: "map", label: "Map", icon: MapIcon },
            { id: "discover", label: "Discover", icon: Sparkles },
            { id: "saved", label: "Saved", icon: Bookmark },
            { id: "travel", label: "Transit", icon: Volume2 },
            { id: "contributions", label: "Contribute", icon: BookOpen }
          ].map((tab) => {
            const active = activeView === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveView(tab.id as any);
                  setSelectedPlace(null);
                  setChattingPlace(null);
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  active ? "text-blue-500 scale-105" : "text-slate-400 hover:text-slate-200"
                }`}
                id={`mobile-tab-${tab.id}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-bold tracking-tight leading-none">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </main>

      {/* 4. DUAL SLIDEOUT / BOTTOM SHEET CARD WRAPPER */}
      {/* Mobile Bottom Sheet Preview (Shown on mobile when a place is selected and not expanded) */}
      {selectedPlace && !isSheetExpanded && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 rounded-t-[2rem] shadow-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-300 select-none">
          {/* Drag handle line */}
          <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4"></div>
          
          <div className="flex gap-4">
            {/* Image Thumbnail */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800/60">
              <img
                src={selectedPlace.image}
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Content Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider">
                  {selectedPlace.category} • {selectedPlace.type}
                </span>
                <button 
                  onClick={() => {
                    setSelectedPlace(null);
                    setIsSheetExpanded(false);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-sm font-black text-white truncate leading-tight mt-0.5">
                {selectedPlace.name}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{selectedPlace.distance} away</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">Open</span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-2 italic mt-1.5 leading-normal">
                "{selectedPlace.quickFact}"
              </p>
            </div>
          </div>

          {/* Actions Row */}
          <div className="flex gap-3 mt-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name + " " + selectedPlace.address)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
            >
              <Navigation className="h-3.5 w-3.5 rotate-45" />
              <span>Directions</span>
            </a>
            
            <button
              onClick={() => {
                setIsSheetExpanded(true);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>More Info</span>
            </button>

            <button
              onClick={() => handleToggleSave(selectedPlace)}
              className={`p-2.5 rounded-xl border transition-all ${
                savedPlaceIds.includes(selectedPlace.id)
                  ? "border-blue-500 bg-blue-600/10 text-blue-500"
                  : "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <Bookmark className={`h-4.5 w-4.5 ${savedPlaceIds.includes(selectedPlace.id) ? "fill-blue-500" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* Full Detailed Panel (Shown on desktop, and on mobile when expanded) */}
      {selectedPlace && (isSheetExpanded || window.innerWidth >= 768) && (
        <div className={`fixed inset-y-0 right-0 z-40 w-full md:w-[480px] h-full shadow-2xl transition-all duration-300 transform ${
          isSheetExpanded ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}>
          <PlaceDetail
            place={selectedPlace}
            isSaved={savedPlaceIds.includes(selectedPlace.id)}
            onToggleSave={() => handleToggleSave(selectedPlace)}
            onClose={() => {
              if (isSheetExpanded) {
                setIsSheetExpanded(false);
              } else {
                setSelectedPlace(null);
              }
            }}
            onStartChat={(role) => {
              setChattingPlace(selectedPlace);
              setChattingRole(role);
            }}
            onGenerateImage={handleGenerateImage}
            isOffline={isOffline}
          />
        </div>
      )}

      {/* Multi-turn AI Chat Slideout panel overlay */}
      {chattingPlace && (
        <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[480px] h-full shadow-2xl transition-all duration-300 transform translate-x-0">
          <AskAIChat
            placeName={chattingPlace.name}
            roleType={chattingRole}
            onClose={() => setChattingPlace(null)}
          />
        </div>
      )}
    </div>
  );
}

// Mirror places inside App file to avoid import path typos
const LAGOS_MOCK_PLACES: Place[] = [
  {
    id: "national-museum-lagos",
    name: "National Museum Lagos",
    category: "History",
    type: "Museum",
    lat: 6.4447,
    lng: 3.4045,
    rating: 4.5,
    reviewCount: 128,
    address: "Onikan, Lagos Island, Lagos, Nigeria",
    distance: "1.2 km",
    status: "Open • Closes 5:00 PM",
    image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80",
    quickFact: "The museum was established in 1957 and houses thousands of historical artifacts that tell the story of Nigeria's rich heritage.",
    facts: [
      { text: "Houses the famous Nok terracotta sculptures, which date back to 500 BC.", source: "National Museum Archives", verified: true },
      { text: "Contains the bullet-riddled car of former Head of State General Murtala Muhammed.", source: "Historical Society of Nigeria", verified: true },
      { text: "The museum grounds feature an exquisite craft village promoting local craftsmanship.", source: "Lagos Tourism Board", verified: true }
    ],
    about: "The National Museum Lagos in Lagos, Nigeria, is the oldest and largest museum in Nigeria. It preserves and displays priceless art, archaeological discoveries, and ethnographic artifacts that reflect the country's diverse cultural heritage.",
    history: [
      { year: "1957", event: "Founded by English archaeologist Kenneth Murray." },
      { year: "1976", event: "Acquired the historic car of General Murtala Muhammed following his assassination." },
      { year: "2018", event: "Renovated and upgraded with a modern interactive digital gallery." }
    ],
    news: [
      { date: "2026-04-10", headline: "National Museum Lagos partners with British Museum for heritage preservation project", publisher: "The Guardian Nigeria", summary: "A landmark partnership to exchange archaeological skills and digitize legacy collections." }
    ]
  },
  {
    id: "nike-art-gallery",
    name: "Nike Art Gallery",
    category: "Culture",
    type: "Art Center",
    lat: 6.4326,
    lng: 3.4735,
    rating: 4.9,
    reviewCount: 512,
    address: "2 Elegushi Beach Rd, Lekki Phase I, Lekki, Lagos, Nigeria",
    distance: "1.6 km",
    status: "Open • Closes 6:00 PM",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80",
    quickFact: "Owned by Nike Davies-Okundaye, this five-story gallery is the largest of its kind in West Africa and houses over 8,000 diverse artworks.",
    facts: [
      { text: "Spans five floors of pure white architecture filled entirely with contemporary and traditional Nigerian art.", source: "Nike Art Gallery website", verified: true },
      { text: "Offers free entry to encourage the appreciation of local arts.", source: "CNN Travel", verified: true },
      { text: "Nike Davies-Okundaye teaches traditional Adire textile making here to empower local women.", source: "UNESCO Arts", verified: true }
    ],
    about: "Nike Art Gallery is a magnificent multi-story cultural oasis holding West Africa's largest collection of art. It features canvas paintings, sculptures, adire textiles, and beadwork from thousands of Nigerian artists.",
    history: [
      { year: "2009", event: "Opened by Chief Nike Davies-Okundaye in Lekki, Lagos." },
      { year: "2015", event: "Expanded collection to over 8,000 distinct visual artworks." },
      { year: "2024", event: "Launched a virtual tour experience for global art enthusiasts." }
    ],
    news: [
      { date: "2026-06-15", headline: "Chief Nike Davies-Okundaye awarded high French cultural honor", publisher: "Lagos Art Review", summary: "Recognizing her lifetime contribution to preserving African heritage and empowering artists." }
    ]
  },
  {
    id: "freedom-park",
    name: "Freedom Park Lagos",
    category: "History",
    type: "Park & Arts Venue",
    lat: 6.4485,
    lng: 3.3986,
    rating: 4.4,
    reviewCount: 220,
    address: "Hospital Road, Old Broad Street, Lagos Island, Lagos, Nigeria",
    distance: "1.8 km",
    status: "Open • Closes 10:00 PM",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    quickFact: "Built on the ruins of His Majesty's Broad Street Prison, this park stands as a symbol of Nigeria's journey to freedom and cultural liberation.",
    facts: [
      { text: "Formed from the ruins of a colonial prison where prominent nationalists like Herbert Macaulay were jailed.", source: "Freedom Park Archives", verified: true },
      { text: "Redesigned by architect Theo Lawson to turn instruments of oppression into places of artistic expression.", source: "Architectural Record", verified: true },
      { text: "Features a museum, open-air theater, fountains, and cells converted into virtual libraries.", source: "Vanguard News", verified: true }
    ],
    about: "Freedom Park Lagos is a memorial and leisure park area in the middle of Lagos Island. It hosts the city's largest open-air art exhibitions, music festivals, theatrical plays, and intellectual debates.",
    history: [
      { year: "1882", event: "Constructed as the Broad Street Prison by British colonial rulers." },
      { year: "2010", event: "Transformed into a community park and cultural monument to mark Nigeria's 50th Independence anniversary." }
    ],
    news: [
      { date: "2026-07-02", headline: "Freedom Park to host Lagos International Theatre Festival next month", publisher: "ThisDay News", summary: "The historic park expects over 10,000 visitors for a week of performances." }
    ]
  },
  {
    id: "lekki-conservation-centre",
    name: "Lekki Conservation Centre",
    category: "Nature",
    type: "Reserve",
    lat: 6.4421,
    lng: 3.5358,
    rating: 4.5,
    reviewCount: 840,
    address: "Km 19 Lekki - Epe Expressway, Lekki, Lagos, Nigeria",
    distance: "7.3 km",
    status: "Open • Closes 4:30 PM",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    quickFact: "LCC is home to the longest canopy walkway in Africa, suspended 22 feet above the tropical swamp forest floor.",
    facts: [
      { text: "Features a 401-meter-long canopy walkway, offering panoramic bird's-eye views of the coastal reserve.", source: "Nigerian Conservation Foundation", verified: true },
      { text: "Spans 78 hectares of protected swamp forest rich in biodiversity, including monkeys, rare birds, and crocodiles.", source: "NCF Nigeria", verified: true },
      { text: "Features giant floor chessboards and canopy swings inside the active family picnic park.", source: "Travel Africa", verified: true }
    ],
    about: "Managed by the Nigerian Conservation Foundation, LCC is an urban nature paradise offering refuge to West African coastal wildlife and providing eco-tourism trails right within the Lekki peninsula.",
    history: [
      { year: "1990", event: "Established by the Nigerian Conservation Foundation to protect wildlife from rapid coastal urbanization." },
      { year: "2015", event: "Constructed and launched Africa's longest canopy walk trail." }
    ],
    news: [
      { date: "2026-05-12", headline: "LCC welcomes five newborn mona monkeys to the reserve", publisher: "Lagos Eco Watch", summary: "The sanctuary's mona monkey population increases as conservation efforts show positive results." }
    ]
  },
  {
    id: "terra-kulture",
    name: "Terra Kulture",
    category: "Culture",
    type: "Theatre & Restaurant",
    lat: 6.4356,
    lng: 3.4243,
    rating: 4.6,
    reviewCount: 310,
    address: "1376 Tiamiyu Savage St, Victoria Island, Lagos, Nigeria",
    distance: "3.2 km",
    status: "Open • Closes 11:00 PM",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
    quickFact: "Terra Kulture is the premier cultural powerhouse in Nigeria, hosting award-winning stage plays and serving outstanding indigenous foods.",
    facts: [
      { text: "Founded by Austen-Peters to show Nigeria's rich language, literature, cuisine, and drama under one roof.", source: "Terra Kulture Profile", verified: true },
      { text: "The restaurant features authentic bamboo interiors and serves gourmet local delicacies like Jollof and Ofada rice.", source: "Lagos Culinary Guide", verified: true },
      { text: "The Terra Arena hosts Broadway-style Nigerian musicals like Wakaa and Fela's Republic.", source: "BBC Culture", verified: true }
    ],
    about: "Terra Kulture is Victoria Island's cultural hub, combining an art gallery, theater, language school, bookstore, and traditional restaurant celebrating Nigerian heritage.",
    history: [
      { year: "2003", event: "Established by Bolanle Austen-Peters." },
      { year: "2017", event: "Launched Nigeria's first purpose-built private theater, the Terra Arena, with 400 seats." }
    ],
    news: [
      { date: "2026-07-01", headline: "Bolanle Austen-Peters announces new pan-African history musical tour", publisher: "Nigerian Tribune", summary: "Terra Kulture's theatrical cast will travel across five African capital cities." }
    ]
  },
  {
    id: "bogobiri-house",
    name: "Bogobiri House",
    category: "Hidden Gems",
    type: "Boutique Hotel & Music Bar",
    lat: 6.4312,
    lng: 3.4195,
    rating: 4.4,
    reviewCount: 155,
    address: "9 Maitama Sule St, Ikoyi, Lagos, Nigeria",
    distance: "4.1 km",
    status: "Open • Closes 12:00 AM",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    quickFact: "A vibrant bohemian sanctuary in Ikoyi, famous for its live Afro-jazz events, poetry slams, and recycled-art interiors.",
    facts: [
      { text: "Constructed with rustic raw materials, local timber, and recycled craftwork, giving it a unique tribal-chic look.", source: "Bogobiri House", verified: true },
      { text: "Hosts the legendary 'Bogobiri Open Mic' every Thursday, attracting the city's finest acoustic poets and musicians.", source: "Lagos Arts Guide", verified: true }
    ],
    about: "Bogobiri House is a unique boutique hotel and arts hub in Ikoyi. It offers a cozy African sanctuary featuring rustic architecture, local visual art, and expressive performance gatherings.",
    history: [
      { year: "2003", event: "Founded as a 16-room boutique hotel and cultural meeting place." }
    ],
    news: [
      { date: "2026-07-10", headline: "Bogobiri hosts intimate acoustic evening with upcoming Neo-Soul artists", publisher: "Lagos Pulse", summary: "An exclusive acoustic event promoting alternative African soundwaves." }
    ]
  },
  {
    id: "tarkwa-bay",
    name: "Tarkwa Bay Beach",
    category: "Hidden Gems",
    type: "Beach Reserve",
    lat: 6.4168,
    lng: 3.3972,
    rating: 4.2,
    reviewCount: 400,
    address: "Lagos Harbor, Lagos Island, Lagos, Nigeria",
    distance: "6.0 km",
    status: "Open • Closes 7:00 PM",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    quickFact: "Only accessible by boat, Tarkwa Bay is a peaceful, sheltered beach popular among surfers and swimmers looking to escape Lagos city noise.",
    facts: [
      { text: "An artificial island beach created during the construction of the Lagos harbor mole.", source: "Lagos Port Authority", verified: true },
      { text: "Known as the most swimmer-friendly beach in Lagos because of its protected, calm waters.", source: "Beach Guide Nigeria", verified: true }
    ],
    about: "Tarkwa Bay is a beautiful coastal island community accessible via a scenic 15-minute boat ride from Victoria Island. It is a surfer's haven and an excellent weekend camping spot.",
    history: [
      { year: "1910", event: "Created as a natural protective barrier during the development of the Lagos harbor channel." }
    ],
    news: [
      { date: "2026-06-20", headline: "Community Beach Cleanup draws 200 young volunteers to Tarkwa Bay", publisher: "EcoLagos", summary: "A volunteer-led initiative to preserve marine life and keep Tarkwa's white sands clean." }
    ]
  }
];
