"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const SHOPS = ["All Shops", "Hallam", "Dandenong", "Frankston", "Moorabbin"];
const TYPES = ["All Types", "installation", "measure", "delivery", "quote", "other"];
const STATUS_COLORS: Record<string, string> = {
  open:       "#2563eb",
  confirmed:  "#16a34a",
  completed:  "#6b7280",
  cancelled:  "#dc2626",
};

interface Job {
  id: number;
  title: string;
  shop?: string | null;
  status: string;
  jobRef?: string | null;
  siteStreet?: string | null;
  siteTown?: string | null;
  siteState?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  customer?: { id: number; name: string; phone?: string | null } | null;
}

interface Entry {
  id: number;
  jobId: number;
  date: string;
  time?: string | null;
  representative: string;
  details: string;
  type: string;
  status: string;
  job: Job;
}

// ── helpers ──────────────────────────────────────────────────────────────────
const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  const day = r.getDay(); // 0=Sun
  r.setDate(r.getDate() - day + 1); // Mon
  return r;
}

function fmtDay(d: Date) {
  return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function fmtShortDay(d: Date) {
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

const ENTRY_TYPES = ["installation", "measure", "delivery", "quote", "other"];

const blankForm = () => ({
  jobId: "",
  date: iso(new Date()),
  time: "",
  type: "installation",
  representative: "",
  details: "",
  status: "open",
});

export default function SchedulePage() {
  const router = useRouter();
  const [view,    setView]    = useState<"day" | "week">("day");
  const [current, setCurrent] = useState(new Date());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [shop,    setShop]    = useState("All Shops");
  const [typeF,   setTypeF]   = useState("All Types");

  // ── Add entry modal ──────────────────────────────────────────────────────
  const [showAdd,    setShowAdd]    = useState(false);
  const [form,       setForm]       = useState(blankForm());
  const [jobPreview, setJobPreview] = useState<Job | null>(null);
  const [jobLookup,  setJobLookup]  = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const lookupJob = async (id: string) => {
    if (!id.trim()) { setJobPreview(null); setJobLookup("idle"); return; }
    setJobLookup("loading");
    try {
      const r = await fetch(`${API}/jobs/${id.trim()}`);
      if (!r.ok) { setJobPreview(null); setJobLookup("notfound"); return; }
      const j = await r.json();
      setJobPreview(j);
      setJobLookup("found");
    } catch {
      setJobPreview(null);
      setJobLookup("notfound");
    }
  };

  const submitEntry = async () => {
    if (!form.jobId || jobLookup !== "found") { showToast("Enter a valid Job ID first", false); return; }
    if (!form.date) { showToast("Date is required", false); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/jobs/${form.jobId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date:           form.date,
          time:           form.time || null,
          type:           form.type,
          representative: form.representative,
          details:        form.details,
          status:         form.status,
        }),
      });
      if (!r.ok) throw new Error();
      setShowAdd(false);
      setForm(blankForm());
      setJobPreview(null);
      setJobLookup("idle");
      showToast("Entry added", true);
      load();
    } catch {
      showToast("Failed to save entry", false);
    } finally {
      setSaving(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let from: string, to: string;
      if (view === "day") {
        from = to = iso(current);
      } else {
        const mon = startOfWeek(current);
        from = iso(mon);
        to   = iso(addDays(mon, 6));
      }
      const params = new URLSearchParams({ from, to });
      if (shop !== "All Shops") params.set("shop", shop);
      const r = await fetch(`${API}/schedule?${params}`);
      if (r.ok) setEntries(await r.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [view, current, shop]);

  useEffect(() => { load(); }, [load]);

  // Filter by type client-side
  const filtered = typeF === "All Types" ? entries : entries.filter(e => e.type === typeF);

  // Group by date for week view
  const grouped: Record<string, Entry[]> = {};
  filtered.forEach(e => {
    const d = e.date.slice(0, 10);
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(e);
  });

  const prev = () => setCurrent(c => view === "day" ? addDays(c, -1) : addDays(c, -7));
  const next = () => setCurrent(c => view === "day" ? addDays(c,  1) : addDays(c,  7));
  const today = () => setCurrent(new Date());

  const weekDays = view === "week"
    ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(current), i))
    : [];

  const headerTitle = view === "day"
    ? fmtDay(current)
    : `${fmtShortDay(startOfWeek(current))} — ${fmtShortDay(addDays(startOfWeek(current), 6))}`;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans',sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", background: toast.ok ? "#15803d" : "#b91c1c", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Add Entry Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowAdd(false)}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, width: 520, maxWidth: "95vw", padding: "24px 28px", fontFamily: "'DM Sans',sans-serif" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 20 }}>+ Add Schedule Entry</div>

            {/* Job ID lookup */}
            <div style={{ marginBottom: 16 }}>
              <label style={LS}>Job ID</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  placeholder="Enter Job ID…"
                  value={form.jobId}
                  onChange={e => { setForm(p => ({ ...p, jobId: e.target.value })); setJobPreview(null); setJobLookup("idle"); }}
                  onBlur={e => lookupJob(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && lookupJob(form.jobId)}
                  style={{ ...IS, flex: 1 }}
                />
                <button onClick={() => lookupJob(form.jobId)}
                  style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  {jobLookup === "loading" ? "…" : "Fetch"}
                </button>
              </div>
              {jobLookup === "notfound" && <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>Job not found</div>}
              {jobLookup === "found" && jobPreview && (
                <div style={{ marginTop: 8, padding: "10px 12px", background: "#0f172a", borderRadius: 8, border: "1px solid #16a34a" }}>
                  <div style={{ fontWeight: 700, color: "#4ade80", fontSize: 13 }}>✓ Job #{jobPreview.id} — {jobPreview.title}</div>
                  {jobPreview.customer && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>Customer: {jobPreview.customer.name}{jobPreview.customer.phone ? ` · ${jobPreview.customer.phone}` : ""}</div>}
                  {(jobPreview.siteStreet || jobPreview.siteTown) && (
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>Site: {[jobPreview.siteStreet, jobPreview.siteTown, jobPreview.siteState].filter(Boolean).join(", ")}</div>
                  )}
                  {jobPreview.shop && <div style={{ color: "#94a3b8", fontSize: 12 }}>Shop: {jobPreview.shop}</div>}
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={LS}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={IS} />
              </div>
              <div>
                <label style={LS}>Time (optional)</label>
                <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} style={IS} />
              </div>
            </div>

            {/* Type & Status */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={LS}>Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={IS}>
                  {ENTRY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={LS}>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={IS}>
                  {["open", "confirmed", "completed", "cancelled"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Representative */}
            <div style={{ marginBottom: 12 }}>
              <label style={LS}>Representative</label>
              <input placeholder="Name of rep / installer…" value={form.representative} onChange={e => setForm(p => ({ ...p, representative: e.target.value }))} style={IS} />
            </div>

            {/* Details */}
            <div style={{ marginBottom: 20 }}>
              <label style={LS}>Details</label>
              <input placeholder="e.g. Install carpet bedroom 1 & 2…" value={form.details} onChange={e => setForm(p => ({ ...p, details: e.target.value }))} style={IS} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={submitEntry} disabled={saving || jobLookup !== "found"}
                style={{ flex: 1, padding: "10px", fontSize: 13, fontWeight: 700, background: jobLookup === "found" ? "#2563eb" : "#1e3a5f", color: jobLookup === "found" ? "#fff" : "#475569", border: "none", borderRadius: 8, cursor: jobLookup === "found" ? "pointer" : "not-allowed" }}>
                {saving ? "Saving…" : "Add to Schedule"}
              </button>
              <button onClick={() => { setShowAdd(false); setForm(blankForm()); setJobPreview(null); setJobLookup("idle"); }}
                style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ background: "#0f172a", padding: "0 24px", height: 52, display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>Day Schedule</span>

        {/* Day / Week toggle */}
        <div style={{ display: "flex", background: "#1e293b", borderRadius: 6, overflow: "hidden", marginLeft: 8 }}>
          {(["day", "week"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "6px 18px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                background: view === v ? "#eab308" : "transparent",
                color:      view === v ? "#000"    : "#94a3b8" }}>
              {v === "day" ? "Day" : "Weeks"}
            </button>
          ))}
        </div>

        {/* Shop filter */}
        <select value={shop} onChange={e => setShop(e.target.value)}
          style={{ fontSize: 12, background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, padding: "5px 10px" }}>
          {SHOPS.map(s => <option key={s}>{s}</option>)}
        </select>

        {/* Type filter */}
        <select value={typeF} onChange={e => setTypeF(e.target.value)}
          style={{ fontSize: 12, background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, padding: "5px 10px" }}>
          {TYPES.map(t => <option key={t} value={t}>{t === "All Types" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: "5px 14px", fontSize: 12, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
            + Add Entry
          </button>
          <button onClick={today}
            style={{ padding: "5px 14px", fontSize: 12, fontWeight: 600, background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Today
          </button>
          <button onClick={prev}
            style={{ width: 30, height: 30, fontSize: 16, background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, cursor: "pointer" }}>
            ‹
          </button>
          <button onClick={next}
            style={{ width: 30, height: 30, fontSize: 16, background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, cursor: "pointer" }}>
            ›
          </button>
        </div>
      </div>

      {/* Date heading */}
      <div style={{ background: "#0f172a", borderTop: "1px solid #1e293b", padding: "8px 24px" }}>
        <span style={{ color: "#eab308", fontWeight: 700, fontSize: 20 }}>{headerTitle}</span>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b", fontSize: 14 }}>Loading…</div>
        ) : view === "day" ? (
          <DayTable entries={filtered} onRefresh={load} router={router} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {weekDays.map(day => {
              const key = iso(day);
              const dayEntries = grouped[key] || [];
              const isToday = iso(day) === iso(new Date());
              return (
                <div key={key}>
                  <div style={{ background: isToday ? "#1e3a5f" : "#1e293b", padding: "6px 16px", borderBottom: "1px solid #334155" }}>
                    <span style={{ color: isToday ? "#60a5fa" : "#94a3b8", fontWeight: 700, fontSize: 13 }}>
                      {fmtDay(day)} {dayEntries.length > 0 && <span style={{ color: "#eab308" }}>({dayEntries.length})</span>}
                    </span>
                  </div>
                  {dayEntries.length === 0 ? (
                    <div style={{ padding: "10px 16px", color: "#475569", fontSize: 12, background: "#0f172a" }}>No entries</div>
                  ) : (
                    <DayTable entries={dayEntries} onRefresh={load} router={router} compact />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared modal styles ───────────────────────────────────────────────────────
const LS: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 };
const IS: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 13, background: "#0f172a", border: "1.5px solid #334155", borderRadius: 7, color: "#f1f5f9", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif" };

// ── Day table ─────────────────────────────────────────────────────────────────
function DayTable({ entries, onRefresh, router, compact }: {
  entries: Entry[];
  onRefresh: () => void;
  router: ReturnType<typeof useRouter>;
  compact?: boolean;
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

  const del = async (e: Entry) => {
    if (!confirm("Delete this schedule entry?")) return;
    await fetch(`${API_URL}/jobs/${e.jobId}/schedule/${e.id}`, { method: "DELETE" });
    onRefresh();
  };

  if (entries.length === 0) {
    return (
      <div style={{ background: "#0f172a", padding: "40px 16px", textAlign: "center", color: "#475569", fontSize: 13 }}>
        No entries scheduled for this day.
      </div>
    );
  }

  const TH: React.CSSProperties = {
    padding: compact ? "6px 10px" : "8px 12px",
    fontSize: 11, fontWeight: 700, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.05em",
    textAlign: "left", borderBottom: "1px solid #1e293b",
    background: "#0a0f1e", whiteSpace: "nowrap",
  };
  const TD: React.CSSProperties = {
    padding: compact ? "6px 10px" : "10px 12px",
    fontSize: 12, color: "#cbd5e1",
    borderBottom: "1px solid #1e293b",
    verticalAlign: "top",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#0f172a" }}>
        <thead>
          <tr>
            <th style={TH}>Shop</th>
            <th style={TH}>Time</th>
            <th style={TH}>Customer / Location</th>
            <th style={TH}>Job</th>
            <th style={TH}>Details</th>
            <th style={TH}>Representative</th>
            <th style={TH}>Type</th>
            <th style={TH}>Status</th>
            <th style={TH}></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => {
            const customer = e.job.customer?.name || e.job.title || "—";
            const location = [e.job.siteStreet, e.job.siteTown, e.job.siteState].filter(Boolean).join(", ") || "—";
            const statusColor = STATUS_COLORS[e.status] || "#6b7280";
            return (
              <tr key={e.id} style={{ cursor: "default" }}
                onMouseEnter={el => (el.currentTarget.style.background = "#1e293b")}
                onMouseLeave={el => (el.currentTarget.style.background = "transparent")}>

                {/* Shop */}
                <td style={TD}>
                  <span style={{ background: "#1e3a5f", color: "#60a5fa", padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                    {e.job.shop ? e.job.shop.slice(0, 1).toUpperCase() : "—"}
                  </span>
                </td>

                {/* Time */}
                <td style={{ ...TD, color: "#fbbf24", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {e.time || "—"}
                </td>

                {/* Customer / Location */}
                <td style={TD}>
                  <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{customer}</div>
                  <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{location}</div>
                  {e.job.contactPhone && (
                    <div style={{ color: "#64748b", fontSize: 11 }}>{e.job.contactPhone}</div>
                  )}
                </td>

                {/* Job */}
                <td style={TD}>
                  <button onClick={() => router.push(`/jobs/${e.job.id}/schedule`)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#60a5fa", fontWeight: 700, fontSize: 12, padding: 0 }}>
                    #{e.job.id}
                  </button>
                  {e.job.jobRef && <div style={{ color: "#64748b", fontSize: 11 }}>{e.job.jobRef}</div>}
                </td>

                {/* Details */}
                <td style={{ ...TD, maxWidth: 260 }}>
                  <span style={{ color: "#cbd5e1" }}>{e.details || "—"}</span>
                </td>

                {/* Representative */}
                <td style={TD}>
                  <span style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    {e.representative || "—"}
                  </span>
                </td>

                {/* Type */}
                <td style={TD}>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>
                    {e.type.charAt(0).toUpperCase() + e.type.slice(1)}
                  </span>
                </td>

                {/* Status */}
                <td style={TD}>
                  <span style={{ background: statusColor + "22", color: statusColor, border: `1px solid ${statusColor}55`, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ ...TD, whiteSpace: "nowrap" }}>
                  <button onClick={() => router.push(`/jobs/${e.job.id}/schedule`)}
                    style={{ fontSize: 11, background: "#1e3a5f", color: "#60a5fa", border: "1px solid #1d4ed8", borderRadius: 4, padding: "3px 8px", cursor: "pointer", marginRight: 4 }}>
                    Edit
                  </button>
                  <button onClick={() => del(e)}
                    style={{ fontSize: 11, background: "#3f1515", color: "#f87171", border: "1px solid #991b1b", borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}>
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
