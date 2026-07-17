import React, { useState, useEffect } from "react";
import { Place } from "../types";
import { 
  Car, Bike, Compass, Heart, Navigation, Play, Pause, 
  SkipForward, Volume2, Bookmark, Check, ShieldAlert, ArrowRight, Eye
} from "lucide-react";

interface TravelModeProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
  savedPlaceIds: string[];
  onToggleSave: (place: Place) => void;
  transitActive: boolean;
  setTransitActive: (active: boolean) => void;
  transitSpeed: number;
  setTransitSpeed: (speed: number) => void;
}

export default function TravelMode({
  places,
  onPlaceSelect,
  savedPlaceIds,
  onToggleSave,
  transitActive,
  setTransitActive,
  transitSpeed,
  setTransitSpeed
}: TravelModeProps) {
  const [travelMethod, setTravelMethod] = useState<"walking" | "driving" | "cycling" | "transit">("driving");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(true);

  // Available travel methods config
  const TRAVEL_METHODS = [
    { id: "walking", label: "Walking", icon: Bike, multiplier: 1 },
    { id: "cycling", label: "Cycling", icon: Bike, multiplier: 2 },
    { id: "driving", label: "Driving", icon: Car, multiplier: 5 },
    { id: "transit", label: "Public Transit", icon: Car, multiplier: 4 }
  ];

  // Rotate nearby places in simulation when transit mode is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (transitActive) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % places.length);
        setIsPlayingAudio(false); // Stop audio on transition
      }, 15000 / transitSpeed); // Rotation speed depends on multiplier
    }
    return () => clearInterval(interval);
  }, [transitActive, transitSpeed, places.length]);

  const activePlace = places[currentIndex] || null;

  const handleTogglePlayAudio = () => {
    if ("speechSynthesis" in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        if (activePlace) {
          const text = `${activePlace.name}. Near you now. Category: ${activePlace.category}. Here is an interesting local fact: ${activePlace.quickFact}`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => setIsPlayingAudio(false);
          utterance.onerror = () => setIsPlayingAudio(false);
          window.speechSynthesis.speak(utterance);
          setIsPlayingAudio(true);
        }
      }
    } else {
      alert("Voice narrative is not supported in this browser.");
    }
  };

  const handleSkip = () => {
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setCurrentIndex((prev) => (prev + 1) % places.length);
  };

  const isSaved = activePlace ? savedPlaceIds.includes(activePlace.id) : false;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 select-none justify-between overflow-y-auto pb-24" id="travel-mode-view">
      {/* Upper Area - Status & Travel Config */}
      <div className="space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-500 animate-spin" style={{ animationDuration: "10s" }} />
              <span>Hands-Free Travel Mode</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Let the city tell you its story
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${transitActive ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`}></span>
            <span className="text-xs font-semibold text-slate-400">
              {transitActive ? "Tracking Route" : "On Hold"}
            </span>
          </div>
        </div>

        {/* Safety Banner */}
        {showSafetyWarning && (
          <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-2xl flex items-start gap-2.5 relative">
            <ShieldAlert className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-[10px] text-blue-300 leading-normal font-semibold">
              <span className="font-bold text-white uppercase block mb-0.5">Safety Notice</span>
              If driving, place your mobile device in a dashboard mount and focus solely on the road. Avoid manual clicking. Use text-to-speech audio narration hands-free.
            </div>
            <button 
              onClick={() => setShowSafetyWarning(false)}
              className="text-slate-500 hover:text-slate-300 absolute top-1 right-2 p-1 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Travel Method Selector */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">
            Choose Transit Profile
          </label>
          <div className="grid grid-cols-4 gap-2">
            {TRAVEL_METHODS.map((method) => {
              const active = travelMethod === method.id;
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => {
                    setTravelMethod(method.id as any);
                    setTransitSpeed(method.multiplier);
                  }}
                  className={`py-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    active
                      ? "bg-blue-600 border-blue-600 text-white font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span className="text-[9px] font-bold tracking-tight leading-none">
                    {method.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Playback Controls & Action toggles */}
        <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl shadow">
          <div className="text-xs">
            <span className="text-slate-500 font-bold uppercase block text-[9px] tracking-wider">Simulation</span>
            <span className="text-slate-200 font-black">Lagos Discovery Route</span>
          </div>

          <button
            onClick={() => setTransitActive(!transitActive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
              transitActive
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
            }`}
          >
            {transitActive ? "Stop Simulation" : "Start Simulation"}
          </button>
        </div>
      </div>

      {/* Center Area - Beautiful Distraction Free Place Card */}
      {activePlace ? (
        <div className="my-auto py-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow">
              {activePlace.category}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block">
                SURFACING LANDMARK
              </span>
              <h3 className="text-2xl font-black text-white leading-tight">
                {activePlace.name}
              </h3>
              <p className="text-slate-500 text-xs font-bold">
                About {activePlace.distance} from route
              </p>
            </div>

            {/* Thumbnail */}
            <div className="h-40 rounded-2xl overflow-hidden bg-slate-950 shadow border border-slate-800/50">
              <img
                src={activePlace.image}
                alt={activePlace.name}
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Distraction Free Fact Box */}
            <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-2xl text-center">
              <p className="text-sm font-extrabold text-slate-200 leading-relaxed italic">
                "{activePlace.quickFact}"
              </p>
            </div>

            {/* Card Buttons Overlay */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={handleTogglePlayAudio}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isPlayingAudio
                    ? "bg-blue-600/10 border border-blue-500 text-blue-400"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10"
                }`}
                id="travel-listen-btn"
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="h-4.5 w-4.5" />
                    <span>Mute Narration</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4.5 w-4.5 animate-bounce" />
                    <span>Listen Sourced Story</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onToggleSave(activePlace)}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isSaved
                    ? "border-blue-500 bg-blue-600/10 text-blue-400"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                }`}
                title="Save Place"
                id="travel-save-btn"
              >
                <Bookmark className={`h-4.5 w-4.5 ${isSaved ? "fill-blue-400" : ""}`} />
              </button>

              <button
                onClick={handleSkip}
                className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 transition-all"
                title="Skip Landmark"
                id="travel-skip-btn"
              >
                <SkipForward className="h-4.5 w-4.5" />
              </button>
            </div>

            <button
              onClick={() => onPlaceSelect(activePlace)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 font-bold pt-1 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View full place details</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 text-slate-600 text-sm font-semibold">
          No explore items loaded inside transit route.
        </div>
      )}

      {/* Lower Area - Visual Route Progression Indicator */}
      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
        <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">
          <span>Route Progress</span>
          <span>
            Landmark {currentIndex + 1} of {places.length}
          </span>
        </div>
        <div className="h-2 bg-slate-950 rounded-full overflow-hidden flex">
          {places.map((p, idx) => (
            <div
              key={p.id}
              className={`h-full border-r border-slate-950/20 transition-all duration-500 ${
                idx <= currentIndex ? "bg-blue-500" : "bg-slate-800"
              }`}
              style={{ width: `${100 / places.length}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
