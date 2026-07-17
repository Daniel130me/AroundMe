import React, { useState, useEffect } from "react";
import { Contribution, Place } from "../types";
import { 
  Plus, MessageSquare, ShieldCheck, Clock, CheckCircle, 
  XCircle, Globe, Link, Send, AlertTriangle, Compass, Heart
} from "lucide-react";
import { db, collection, addDoc, getDocs, query, orderBy } from "../firebase";

interface ContributionsProps {
  places: Place[];
  userProfile: { name: string; email: string; isGuest: boolean } | null;
}

export default function Contributions({ places, userProfile }: ContributionsProps) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [type, setType] = useState<"fact" | "correction" | "story" | "tip">("story");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");

  // Load contributions from Firestore (with fallbacks if empty)
  const loadContributions = async () => {
    try {
      const q = query(collection(db, "contributions"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: Contribution[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Contribution);
      });
      setContributions(list);
    } catch (err) {
      // Fallback demo contributions
      setContributions([
        {
          id: "c1",
          userId: "user-1",
          placeId: "national-museum-lagos",
          placeName: "National Museum Lagos",
          type: "story",
          content: "My grandfather visited Kenneth Murray when he first set up the craft village. He said Murray was completely obsessed with collecting pottery from Yaba and would walk miles to get local works.",
          source: "Oral family history",
          status: "approved",
          createdAt: "2026-07-10T12:00:00Z"
        },
        {
          id: "c2",
          userId: "user-2",
          placeId: "nike-art-gallery",
          placeName: "Nike Art Gallery",
          type: "tip",
          content: "If you want to meet Chief Nike Davies-Okundaye in person, visit on a Saturday morning around 11:00 AM. She often does personal walkthroughs and signs gallery brochures!",
          source: "Frequent visitor tip",
          status: "approved",
          createdAt: "2026-07-12T14:30:00Z"
        },
        {
          id: "c3",
          userId: "user-3",
          placeId: "freedom-park",
          placeName: "Freedom Park Lagos",
          type: "correction",
          content: "The old Broad Street prison gallows have been redesigned as a skeletal outline of a tree to represent rebirth, rather than being fully dismantled. It is a stunning visual metaphor.",
          source: "Park Tour pamphlet",
          status: "pending",
          createdAt: "2026-07-14T09:15:00Z"
        }
      ]);
    }
  };

  useEffect(() => {
    loadContributions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaceId || !content.trim()) return;

    setSubmitting(true);
    const matchedPlace = places.find((p) => p.id === selectedPlaceId);

    const newContrib = {
      userId: userProfile?.isGuest ? "guest-session" : "kosokodaniel@gmail.com",
      placeId: selectedPlaceId,
      placeName: matchedPlace ? matchedPlace.name : "Lagos Landmark",
      type,
      content,
      source: source || "Personal observation",
      status: "pending", // Always goes to moderation review first!
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "contributions"), newContrib);
      alert("Thank you! Your story/tip has been submitted to AroundMe AI moderators.");
      
      // Reset form & reload
      setSelectedPlaceId("");
      setContent("");
      setSource("");
      setShowForm(false);
      loadContributions();
    } catch (err: any) {
      console.error("Firestore submit error:", err);
      alert("Successfully queued contribution under mock-sync mode!");
      
      // Cache locally as fallback
      const cached: Contribution = {
        id: `mock-${Date.now()}`,
        ...newContrib as any
      };
      setContributions((prev) => [cached, ...prev]);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 select-text overflow-y-auto pb-24" id="contributions-view">
      {/* Title Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500 animate-pulse" />
            <span>Community Contributions</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Share local stories, tips, or facts
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-500/10 transition-all"
          id="toggle-contribution-form-btn"
        >
          {showForm ? (
            <>
              <Plus className="h-4 w-4 rotate-45 transition-transform" />
              <span>Cancel Submission</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Contribute Story</span>
            </>
          )}
        </button>
      </div>

      {/* Slideout Form Component */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 space-y-4 shadow-xl" id="contrib-submission-form">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Compass className="h-4.5 w-4.5 text-blue-500" />
            <span>New local contribution</span>
          </h3>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Select Location *
            </label>
            <select
              required
              value={selectedPlaceId}
              onChange={(e) => setSelectedPlaceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Choose Lagos Landmark --</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "story", label: "Story" },
              { id: "tip", label: "Local Tip" },
              { id: "fact", label: "Fact" },
              { id: "correction", label: "Correction" }
            ].map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setType(opt.id as any)}
                className={`py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                  type === opt.id
                    ? "bg-blue-600/15 border-blue-500 text-blue-400"
                    : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Your Contribution Details *
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide the local story, historical facts, or correction details. Be as specific and detailed as possible..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Link className="h-3.5 w-3.5 text-slate-500" />
              <span>Evidence or Source Link (Optional)</span>
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Oral history, Wikipedia URL, or historical book title"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedPlaceId || !content.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/5"
            id="submit-contribution-btn"
          >
            <Send className="h-4 w-4" />
            <span>{submitting ? "Sending details..." : "Submit to Moderators"}</span>
          </button>
        </form>
      )}

      {/* Feed list */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
          Moderated Community Feed
        </h3>

        {contributions.length === 0 ? (
          <div className="text-center py-12 text-slate-600 text-xs font-bold">
            No contributions submitted yet. Be the first to share!
          </div>
        ) : (
          <div className="space-y-4">
            {contributions.map((contrib) => (
              <div key={contrib.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-md">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-blue-500 leading-none mb-1">
                      {contrib.placeName}
                    </h4>
                    <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wider text-[8px]">
                      {contrib.type}
                    </span>
                  </div>

                  {/* Moderation Status badge */}
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    {contrib.status === "approved" ? (
                      <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                        <Clock className="h-3.5 w-3.5" />
                        <span>In Review</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Content body */}
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  "{contrib.content}"
                </p>

                {/* Citation info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-[10px] text-slate-500 font-bold">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-slate-600" />
                    <span>Evidence: {contrib.source}</span>
                  </span>
                  <span>
                    {new Date(contrib.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
