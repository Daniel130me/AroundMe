import React, { useState, useEffect } from "react";
import { Place, SavedPlace } from "../types";
import { 
  X, MapPin, Star, Bookmark, Share2, Compass, Cpu, Clock, 
  MessageSquare, Calendar, ShieldCheck, Heart, Volume2, Sparkles, Image as ImageIcon, ExternalLink
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PlaceDetailProps {
  place: Place;
  isSaved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
  onStartChat: (role: string) => void;
  onGenerateImage: (prompt: string, size: string) => Promise<string>;
  isOffline: boolean;
}

export default function PlaceDetail({
  place,
  isSaved,
  onToggleSave,
  onClose,
  onStartChat,
  onGenerateImage,
  isOffline
}: PlaceDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "facts" | "history" | "news" | "photos">("overview");
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [generatingCustomImage, setGeneratingCustomImage] = useState(false);
  const [customImagePrompt, setCustomImagePrompt] = useState("");
  const [customImageSize, setCustomImageSize] = useState("1K"); // 1K, 2K, 4K
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState("Local Tour Guide");

  // Local state for dynamically loaded elements
  const [loadedFacts, setLoadedFacts] = useState<any[]>([]);
  const [loadedHistory, setLoadedHistory] = useState<any[]>([]);
  const [loadedNews, setLoadedNews] = useState<any[]>([]);
  const [summarySource, setSummarySource] = useState<string>(place.source || "cached");
  const [isGroundedSummary, setIsGroundedSummary] = useState<boolean>(place.isGrounded ?? true);

  // Freshness indicators helper functions
  const getFactFreshness = (fact: any) => {
    const src = (fact.source || "").toLowerCase();
    if (src.includes("archive") || src.includes("history") || src.includes("record") || src.includes("museum")) {
      return { text: "Long-standing Fact", style: "text-slate-400 bg-slate-950/40 border border-slate-800" };
    }
    return { text: "Recently Surfaced", style: "text-blue-400 bg-blue-500/10 border border-blue-500/20" };
  };

  const getHistoryFreshness = (yearStr: string) => {
    const year = parseInt(yearStr, 10);
    if (!isNaN(year) && year >= 2020) {
      return { text: "Recent Era", style: "text-blue-400 bg-blue-500/10 border border-blue-500/20" };
    }
    return { text: "Established Background", style: "text-slate-400 bg-slate-950/40 border border-slate-800" };
  };

  const getNewsFreshness = (dateStr: string) => {
    const year = parseInt(dateStr?.split("-")[0], 10);
    if (!isNaN(year) && year >= 2025) {
      return { text: "Recent News", style: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-extrabold animate-pulse" };
    }
    return { text: "Archived News", style: "text-slate-400 bg-slate-950/40 border border-slate-800" };
  };

  // Fetch AI Sourced Summary
  useEffect(() => {
    setAiSummary("");
    setLoadedFacts(place.facts || []);
    setLoadedHistory(place.history || []);
    setLoadedNews(place.news || []);
    setSummarySource(place.source || "cached");
    setIsGroundedSummary(place.isGrounded ?? true);
    setLoadingSummary(true);
    
    fetch("/api/places/generate-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId: place.id,
        placeName: place.name,
        category: place.category,
        address: place.address,
        lat: place.lat,
        lng: place.lng
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setAiSummary(data.summary || data.about);
          if (data.facts && data.facts.length > 0) {
            setLoadedFacts(data.facts);
          }
          if (data.history && data.history.length > 0) {
            setLoadedHistory(data.history);
          }
          if (data.news && data.news.length > 0) {
            setLoadedNews(data.news);
          }
          if (data.source) {
            setSummarySource(data.source);
          }
          if (data.isGrounded !== undefined) {
            setIsGroundedSummary(data.isGrounded);
          }
        } else {
          setAiSummary(place.about);
        }
      })
      .catch(() => {
        setAiSummary(place.about);
      })
      .finally(() => {
        setLoadingSummary(false);
      });
  }, [place]);

  // Audio Guide synthesis (Speech Synthesis)
  const handleListen = () => {
    if ("speechSynthesis" in window) {
      // Cancel active speech
      window.speechSynthesis.cancel();
      
      const textToSpeak = `${place.name}. ${place.quickFact}. ${place.about}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.pitch = 1.0;
      utterance.rate = 0.95;
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const handleCustomImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customImagePrompt.trim()) return;

    setGeneratingCustomImage(true);
    try {
      const url = await onGenerateImage(customImagePrompt, customImageSize);
      if (url) {
        setGeneratedImages(prev => [url, ...prev]);
        setCustomImagePrompt("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingCustomImage(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl relative select-text" id="place-detail-panel">
      {/* Scrollable Panel Area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Banner Image */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-950">
          <img
            src={place.image}
            alt={place.name}
            className="w-full h-full object-cover opacity-85 transition-transform duration-700 hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 to-transparent"></div>

          {/* Close Floating Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 bg-slate-900/90 hover:bg-slate-800 text-slate-100 p-2 rounded-full border border-slate-700/60 transition-all shadow-lg backdrop-blur"
            id="close-place-detail"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Save/Like Toggle */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={onToggleSave}
              className={`bg-slate-900/90 hover:bg-slate-800 text-slate-100 p-2.5 rounded-full border shadow-lg backdrop-blur transition-all ${
                isSaved ? "border-blue-500 text-blue-500" : "border-slate-700/60"
              }`}
              title={isSaved ? "Saved to collections" : "Save landmark"}
              id="save-place-btn"
            >
              <Bookmark className={`h-5 w-5 ${isSaved ? "fill-blue-500" : ""}`} />
            </button>
            <button
              className="bg-slate-900/90 hover:bg-slate-800 text-slate-100 p-2.5 rounded-full border border-slate-700/60 shadow-lg backdrop-blur transition-all"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Place link copied to clipboard!");
              }}
              title="Share Place link"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {/* Sourced Category Badge */}
          <div className="absolute bottom-4 left-6 flex items-center gap-1.5 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
            <Compass className="h-3 w-3" />
            <span>{place.category}</span>
          </div>
        </div>

        {/* Essential Info Section */}
        <div className="px-6 pt-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1 leading-tight">{place.name}</h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              {place.type}
            </span>
            <span className="text-slate-600">•</span>
            <span>{place.distance} away</span>
            {place.rating && (
              <>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {place.rating} ({place.reviewCount})
                </span>
              </>
            )}
          </div>

          {/* Quick Audio Guide Affirmation */}
          <div className="flex gap-2 items-center bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-2xl mb-6">
            <Volume2 className="h-5 w-5 text-blue-500 cursor-pointer animate-pulse" onClick={handleListen} />
            <div className="flex-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Audio Guide</div>
              <p className="text-xs text-slate-300 font-medium leading-normal italic">
                "{place.quickFact}"
              </p>
            </div>
            <button 
              onClick={handleListen}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
            >
              Play Narration
            </button>
          </div>

          {/* Inner Navigation Tabs */}
          <div className="flex border-b border-slate-800/80 mb-6 overflow-x-auto whitespace-nowrap scrollbar-none">
            {[
              { id: "overview", label: "Overview" },
              { id: "facts", label: "Interesting Facts" },
              { id: "history", label: "History Timeline" },
              { id: "news", label: "Recent News" },
              { id: "photos", label: "AI Imagery" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Render Area */}
          <div className="space-y-6">
            {activeTab === "overview" && (
              <div className="space-y-6" id="overview-tab-content">
                {/* About & Sourced Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">About Landmark</h3>
                    {summarySource === "search" && (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold text-[9px] uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Search Grounded</span>
                      </span>
                    )}
                    {summarySource === "cached" && (
                      <span className="flex items-center gap-1 text-blue-400 font-bold text-[9px] uppercase tracking-wider bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Curated Guide</span>
                      </span>
                    )}
                    {summarySource === "model_only" && (
                      <span className="flex items-center gap-1 text-amber-500 font-bold text-[9px] uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <span>AI Generated (Not Verified)</span>
                      </span>
                    )}
                    {summarySource === "unavailable" && (
                      <span className="flex items-center gap-1 text-red-400 font-bold text-[9px] uppercase tracking-wider bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                        <span>Live Info Unavailable</span>
                      </span>
                    )}
                  </div>
                  {loadingSummary ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-full"></div>
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6"></div>
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-4/5"></div>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-xs text-slate-300 leading-relaxed text-sm">
                      <ReactMarkdown>{aiSummary}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Practical info list */}
                <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/80 text-xs space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-slate-500 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-300">Status & Hours</div>
                      <div className="text-slate-400">{place.status || "Daily 8:00 AM - 6:00 PM"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-300">Address</div>
                      <div className="text-slate-400">{place.address}</div>
                    </div>
                  </div>
                </div>

                {/* Ask AI Trigger options */}
                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-4 rounded-2xl relative overflow-hidden">
                  <Sparkles className="absolute -right-2 -bottom-2 h-16 w-16 text-blue-500/5 rotate-12" />
                  <h4 className="text-sm font-extrabold text-blue-400 flex items-center gap-1.5 mb-1.5">
                    <Cpu className="h-4 w-4" />
                    <span>Converse with an AI Guide</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Choose an AI guide personality below to answer complex history, architectural features, or local news questions about this location.
                  </p>
                  
                  {/* Persona selection options */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    {[
                      { role: "Local Tour Guide", desc: "A storyteller full of legends" },
                      { role: "History Professor", desc: "Deeply sourced archives" },
                      { role: "Architecture Expert", desc: "Focuses on design & building structural facts" },
                      { role: "Business Insider", desc: "Market insights & history" }
                    ].map((p) => (
                      <button
                        key={p.role}
                        onClick={() => setSelectedRole(p.role)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedRole === p.role 
                            ? "bg-blue-600/10 border-blue-500 text-blue-400" 
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="font-bold">{p.role}</div>
                        <div className="text-[10px] text-slate-500">{p.desc}</div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => onStartChat(selectedRole)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow transition-all"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Start conversation with {selectedRole}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "facts" && (
              <div className="space-y-4" id="facts-tab-content">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2">Sourced Interesting Facts</h3>
                {loadedFacts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs font-semibold">
                    No facts loaded for this location yet. Let us retrieve them using Gemini.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {loadedFacts.map((fact, i) => {
                      const factUrl = fact.url || `https://www.google.com/search?q=${encodeURIComponent(place.name + " " + fact.text)}`;
                      const freshness = getFactFreshness(fact);
                      const factGrounded = fact.verified && isGroundedSummary;
                      return (
                        <div key={i} className="bg-slate-950/20 border border-slate-800/80 p-4 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${freshness.style}`}>
                              {freshness.text}
                            </span>
                            {factGrounded ? (
                              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px]">
                                Verified Source
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px]">
                                AI-generated, not independently verified
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed font-medium pt-1">"{fact.text}"</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-800/50">
                            <a
                              href={factUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-blue-400 text-slate-400 font-bold transition-colors"
                            >
                              <ShieldCheck className={`h-3.5 w-3.5 ${factGrounded ? "text-emerald-400" : "text-slate-500"}`} />
                              <span>Source: {fact.source}</span>
                              <ExternalLink className="h-3 w-3 inline opacity-70 ml-0.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4" id="history-tab-content">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2">Historical Timeline</h3>
                {loadedHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs font-semibold">
                    No historical timeline records found for this location yet.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
                    {loadedHistory.map((evt, i) => {
                      const freshness = getHistoryFreshness(evt.year);
                      return (
                        <div key={i} className="relative">
                          <div className="absolute -left-[31px] top-1.5 bg-blue-500 rounded-full h-3.5 w-3.5 border-4 border-slate-900 shadow"></div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-xs font-black text-blue-400">{evt.year}</div>
                            <span className={`px-2 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider scale-90 origin-left ${freshness.style}`}>
                              {freshness.text}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed font-medium">{evt.event}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "news" && (
              <div className="space-y-4" id="news-tab-content">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2">Recent News Layers</h3>
                {loadedNews.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs font-semibold animate-pulse">
                    Retrieving real-time news from Google Search...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loadedNews.map((item, i) => {
                      const newsUrl = item.url || `https://www.google.com/search?q=${encodeURIComponent(item.headline + " " + item.publisher)}`;
                      const freshness = getNewsFreshness(item.date);
                      return (
                        <div key={i} className="bg-slate-950/20 border border-slate-800/80 p-4 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <a
                              href={newsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline flex items-center gap-1 font-extrabold"
                            >
                              <span>{item.publisher}</span>
                              <ExternalLink className="h-2.5 w-2.5 inline opacity-75" />
                            </a>
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${freshness.style}`}>
                                {freshness.text}
                              </span>
                              <span className="flex items-center gap-1 text-slate-400">
                                <Calendar className="h-3 w-3" />
                                {item.date}
                              </span>
                            </div>
                          </div>
                          <a
                            href={newsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group/link"
                          >
                            <h4 className="text-sm font-bold text-white group-hover/link:text-blue-400 group-hover/link:underline transition-colors leading-snug">{item.headline}</h4>
                          </a>
                          <p className="text-xs text-slate-400 leading-normal">{item.summary}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "photos" && (
              <div className="space-y-6" id="photos-tab-content">
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    <span>Gemini custom image generator</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Customize your discovery. Enter a descriptive prompt and trigger Gemini Image generation. Specify sizes between 1K, 2K, and 4K.
                  </p>

                  <form onSubmit={handleCustomImageSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Select Render Size
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["1K", "2K", "4K"].map((size) => (
                          <button
                            type="button"
                            key={size}
                            onClick={() => setCustomImageSize(size)}
                            className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                              customImageSize === size
                                ? "bg-blue-600/15 border-blue-500 text-blue-400"
                                : "bg-slate-900 border-slate-800 text-slate-400"
                            }`}
                          >
                            {size} {size === "1K" ? "(1024px)" : size === "2K" ? "(1440px)" : "(2160px)"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Creation Prompt
                      </label>
                      <textarea
                        value={customImagePrompt}
                        onChange={(e) => setCustomImagePrompt(e.target.value)}
                        placeholder="e.g. A gorgeous watercolor sunset over the National Museum Lagos, fine art style..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 h-20 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={generatingCustomImage || isOffline || !customImagePrompt.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow"
                    >
                      {generatingCustomImage ? (
                        <>
                          <Compass className="h-4 w-4 animate-spin" />
                          <span>Generating custom art (Please wait...)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Generate {customImageSize} Custom Image</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Generated custom images list */}
                {generatedImages.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Your generated gallery</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {generatedImages.map((url, index) => (
                        <div key={index} className="relative rounded-xl overflow-hidden aspect-square bg-slate-950 border border-slate-800 shadow">
                          <img
                            src={url}
                            alt="Custom rendered visual"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
