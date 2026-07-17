import React, { useState, useEffect } from "react";
import { 
  Users, Eye, MessageSquare, ShieldCheck, Check, X, 
  TrendingUp, Trash2, ShieldAlert, Cpu, Award, RefreshCw 
} from "lucide-react";
import { Contribution } from "../types";
import { db, collection, getDocs, doc, setDoc, updateDoc } from "../firebase";

export default function AdminDashboard() {
  const [pendingList, setPendingList] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    users: 412,
    views: 1845,
    questions: 310,
    tokenUsage: "41.2K",
    citations: 189
  });

  // Load pending list
  const loadPending = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "contributions"));
      const list: Contribution[] = [];
      snap.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() } as Contribution;
        if (item.status === "pending") {
          list.push(item);
        }
      });
      setPendingList(list);
    } catch (err) {
      // Mock list if Firestore fails
      setPendingList([
        {
          id: "c3",
          userId: "user-3",
          placeId: "freedom-park",
          placeName: "Freedom Park Lagos",
          type: "correction",
          content: "The old Broad Street prison gallows have been redesigned as a skeletal outline of a tree to represent rebirth, rather than being fully dismantled. It is a stunning visual metaphor.",
          source: "Park Tour pamphlet",
          status: "pending",
          createdAt: new Date().toISOString()
        },
        {
          id: "c4",
          userId: "user-5",
          placeId: "tarkwa-bay",
          placeName: "Tarkwa Bay Beach",
          type: "story",
          content: "There's an annual coastal clean-up festival in December which features local surfing competitions. Most tourists have no idea this surf competition happens every year.",
          source: "Tarkwa Bay surfers association",
          status: "pending",
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    try {
      const docRef = doc(db, "contributions", id);
      await updateDoc(docRef, { status: action });
      alert(`Contribution status updated to ${action}!`);
      loadPending();
    } catch (err) {
      // Simulate action locally on failure
      alert(`Simulation mode: status updated to ${action}!`);
      setPendingList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 select-text overflow-y-auto pb-24" id="admin-dashboard-view">
      {/* Title */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-500 animate-pulse" />
            <span>Admin Moderation Dashboard</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Manage discoveries, trust indices, and tokens
          </p>
        </div>

        <button
          onClick={loadPending}
          className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2 rounded-xl border border-slate-800 transition-all"
          title="Refresh Data"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Metrics bento-grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-8">
        {[
          { label: "Total active users", val: metrics.users, icon: Users, color: "text-blue-400 bg-blue-500/10" },
          { label: "Places viewed", val: metrics.views, icon: Eye, color: "text-emerald-400 bg-emerald-500/10" },
          { label: "AI questions asked", val: metrics.questions, icon: MessageSquare, color: "text-purple-400 bg-purple-500/10" },
          { label: "API Token Usage", val: metrics.tokenUsage, icon: Cpu, color: "text-blue-400 bg-blue-500/10" },
          { label: "Sourced citations", val: metrics.citations, icon: ShieldCheck, color: "text-indigo-400 bg-indigo-500/10" }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800/85 p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider max-w-[80px]">
                  {item.label}
                </span>
                <div className={`p-1.5 rounded-lg ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <span className="text-xl font-black text-white leading-none">
                  {item.val}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% wk
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending moderation container */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-blue-500" />
          <span>Pending Contributions ({pendingList.length})</span>
        </h3>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs font-semibold animate-pulse">
            Loading database contributions...
          </div>
        ) : pendingList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center">
            <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-white mb-1">Queue Completed</h4>
            <p className="text-xs text-slate-400">All community submissions are fully moderated and live.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingList.map((contrib) => (
              <div key={contrib.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-blue-400 mb-0.5">
                      {contrib.placeName}
                    </h4>
                    <span className="text-[9px] bg-slate-950 border border-slate-850 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                      {contrib.type}
                    </span>
                  </div>

                  {/* Approve / Reject buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAction(contrib.id, "approved")}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-1.5 rounded-lg font-bold transition-all"
                      title="Approve & Publish Live"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleAction(contrib.id, "rejected")}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-1.5 rounded-lg font-bold transition-all"
                      title="Reject & Flag"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  "{contrib.content}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-t border-slate-850/50 pt-2.5">
                  <span>Author: {contrib.userId}</span>
                  <span>Source: {contrib.source}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
