import React, { useState } from "react";
import { Compass, MapPin, Eye, Bell, Check, User, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

interface OnboardingProps {
  onComplete: (interests: string[], userProfile: { name: string; email: string; isGuest: boolean } | null) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  
  // Custom interests list
  const INTEREST_OPTIONS = [
    { id: "History", label: "Local History", icon: "🏛️" },
    { id: "Architecture", label: "Architecture", icon: "🏢" },
    { id: "Food", label: "Culinary & Food", icon: "🍲" },
    { id: "Nature", label: "Nature & Parks", icon: "🌳" },
    { id: "Culture", label: "Arts & Culture", icon: "🎨" },
    { id: "Technology", label: "Tech Hubs", icon: "💻" },
    { id: "Hidden Gems", label: "Hidden Gems", icon: "💎" },
    { id: "Local News", label: "Recent News", icon: "📰" }
  ];

  const handleInterestToggle = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationGranted(true);
          setStep(3);
        },
        () => {
          setLocationGranted(false);
          setStep(3);
        }
      );
    } else {
      setLocationGranted(false);
      setStep(3);
    }
  };

  const handleFinish = (isGuest: boolean, email = "", name = "") => {
    onComplete(selectedInterests, {
      name: name || (isGuest ? "Guest Explorer" : "Daniel Kosoko"),
      email: email || (isGuest ? "guest@aroundme.ai" : "kosokodaniel@gmail.com"),
      isGuest
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100 flex flex-col justify-between z-50 p-6 md:p-12 overflow-y-auto">
      {/* Header/Brand */}
      <div className="flex items-center gap-2 justify-center mt-4">
        <Compass className="h-8 w-8 text-blue-600 animate-pulse" />
        <span className="text-xl font-bold font-sans tracking-tight bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
          AroundMe AI
        </span>
      </div>

      {/* Main Content Areas */}
      <div className="my-auto max-w-md w-full mx-auto py-8">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
            id="onboarding-welcome-screen"
          >
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-blue-600/10 flex items-center justify-center mx-auto border border-blue-500/20">
                <Compass className="h-12 w-12 text-blue-600" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600"></span>
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-4">
              Discover the stories around you.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Explore interesting facts, local history, nearby news, businesses, buildings, and hidden places wherever you go.
            </p>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all group h-14"
              id="start-onboarding-btn"
            >
              <span>Start Exploring</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
            id="onboarding-location-permission"
          >
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6 border border-blue-500/20 text-blue-400">
              <MapPin className="h-10 w-10 animate-bounce" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Let's start with your location
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Your location helps us show you interesting places, local stories, and news nearby. You remain in control of how your location is used.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={requestLocation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all h-14"
                id="grant-location-btn"
              >
                Use My Current Location
              </button>
              <button
                onClick={() => {
                  setLocationGranted(false);
                  setStep(3);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-2xl border border-slate-700/50 transition-all h-14"
                id="manual-location-btn"
              >
                Choose on Map Manually
              </button>
              <button
                onClick={() => {
                  setLocationGranted(false);
                  setStep(3);
                }}
                className="text-slate-500 hover:text-slate-400 text-xs font-semibold mt-2 transition-colors"
                id="skip-location-btn"
              >
                Continue Without Location
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
            id="onboarding-interests-selection"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              What are you interested in?
            </h2>
            <p className="text-slate-400 text-xs mb-6">
              Choose topics you enjoy. We will personalize discoveries for you. You can change these later.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {INTEREST_OPTIONS.map((opt) => {
                const selected = selectedInterests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleInterestToggle(opt.id)}
                    className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-left transition-all ${
                      selected
                        ? "bg-blue-600/10 border-blue-600 text-blue-400 shadow-md shadow-blue-500/5"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-xs font-bold leading-none">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={selectedInterests.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 px-6 rounded-2xl transition-all h-14"
              id="interests-continue-btn"
            >
              Continue
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
            id="onboarding-notifications"
          >
            <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6 border border-purple-500/20 text-purple-400">
              <Bell className="h-10 w-10 animate-swing" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Stay updated your way
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Receive smart notices when passing landmarks, trending history, or recent community alerts.
            </p>

            <div className="space-y-3 mb-8 text-left">
              {[
                "Interesting places nearby",
                "Local stories & news updates",
                "Travel Mode notifications"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
                  <div className="bg-blue-500/20 text-blue-500 p-1 rounded-full">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(5)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all h-14"
              id="notifications-continue-btn"
            >
              Continue
            </button>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
            id="onboarding-account-creation"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 text-emerald-400">
              <User className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              One last step
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Sign in to save your discovered places, create custom travel boards, and contribute your local tips.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleFinish(false, "kosokodaniel@gmail.com", "Daniel Kosoko")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold py-3 rounded-2xl border border-slate-700/80 flex items-center justify-center gap-2.5 transition-all h-14"
                id="sign-in-google-btn"
              >
                <img src="https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=32&q=80" alt="Google" className="h-5 w-5 rounded-full" />
                <span>Continue with Google</span>
              </button>

              <button
                onClick={() => handleFinish(false, "kosokodaniel@gmail.com", "Daniel Kosoko")}
                className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold py-3 rounded-2xl border border-blue-500/30 transition-all h-14"
                id="sign-in-email-btn"
              >
                Continue with Email
              </button>

              <button
                onClick={() => handleFinish(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-2xl border border-slate-700/50 transition-all h-14"
                id="onboarding-guest-btn"
              >
                Continue as Guest
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer legal disclaimer */}
      <div className="text-center text-[10px] text-slate-600">
        By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
      </div>
    </div>
  );
}
