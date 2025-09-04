import React, { useEffect, useMemo, useRef, useState } from "react";

// V0.4.2a — Venue ↔ Artist invite polish
// - Explicit from/to on invites (pendingInvite: {fromType,fromId,toType,toId})
// - WhatsApp message tailored by initiator, correct counterparty phone
// - Invite landing shows initiator → counterparty + smarter "Switch identity" mapping
// - Inbox shows who invited whom and quick actions
// - Sample data fixed to include pendingInvite on Jota-Pê → Studio Azul (awaiting venue)
// - Keeps: Router, public-place privacy, profile .ics, i18n, initiator highlights

import { Search, Clock, MapPin, User, ChevronRight, X, Phone, Share2, CalendarPlus, Heart, PlusCircle, Check, Ban, Globe } from "lucide-react";

/*************************
 * I18N
 *************************/
 type Locale = 'pt'|'en'|'es-AR'|'it'|'krenak';
 const I18N: Record<Locale, Record<string, string>> = {
  pt: {
    agenda: 'Agenda', artists: 'Artistas', venues: 'Lugares', inbox: 'Convites', favorites: 'Favoritos',
    instagram: 'Instagram', whatsapp: 'WhatsApp', view: 'Ver', addEvent: 'Adicionar evento',
    oneOffOrWeekly: 'Evento avulso ou semanal', title: 'Título', date: 'Data', time: 'Hora', venue: 'Lugar', artist: 'Artista',
    recurringWeekly: 'Recorrente (semanal)', cancel: 'Cancelar', createInvite: 'Criar & Convidar',
    pending: 'Pendente', pendingAwaitVenue: 'Pendente (aguardando lugar)', pendingAwaitArtist: 'Pendente (aguardando artista)',
    tbaPrivate: 'A definir (lugar privado)', moreInfo: 'Mais detalhes', openInMaps: 'Abrir no Maps', addToCalendar: 'Adicionar ao calendário', share: 'Compartilhar',
    invites: 'Convites', noInvites: 'Sem convites.', accept: 'Aceitar', decline: 'Recusar',
    inviteTitle: 'Convite', inviteExplainMismatch: 'Você não é o destinatário deste convite. Troque de identidade para aceitar.', switchIdentity: 'Trocar identidade',
    inviteAccepted: 'Convite aceito', inviteDeclined: 'Convite recusado', expiredInvite: 'Convite expirado',
    exportIcs: 'Exportar .ics', events: 'Eventos', noEvents: 'Sem eventos ainda.', searchPlaceholder: 'Buscar…',
  },
  en: {
    agenda: 'Agenda', artists: 'Artists', venues: 'Venues', inbox: 'Inbox', favorites: 'Favorites',
    instagram: 'Instagram', whatsapp: 'WhatsApp', view: 'View', addEvent: 'Add Event',
    oneOffOrWeekly: 'One-off or weekly', title: 'Title', date: 'Date', time: 'Time', venue: 'Venue', artist: 'Artist',
    recurringWeekly: 'Recurring (weekly)', cancel: 'Cancel', createInvite: 'Create & Invite',
    pending: 'Pending', pendingAwaitVenue: 'Pending (awaiting venue)', pendingAwaitArtist: 'Pending (awaiting artist)',
    tbaPrivate: 'TBA (private venue)', moreInfo: 'More Info', openInMaps: 'Open in Maps', addToCalendar: 'Add to Calendar', share: 'Share',
    invites: 'Invites', noInvites: 'No invites.', accept: 'Accept', decline: 'Decline',
    inviteTitle: 'Invite', inviteExplainMismatch: 'You are not the invitee. Switch identity to accept.', switchIdentity: 'Switch identity',
    inviteAccepted: 'Invite accepted', inviteDeclined: 'Invite declined', expiredInvite: 'Invite expired',
    exportIcs: 'Export .ics', events: 'Events', noEvents: 'No events yet.', searchPlaceholder: 'Search…',
  },
  'es-AR': {
    agenda: 'Agenda', artists: 'Artistas', venues: 'Lugares', inbox: 'Bandeja', favorites: 'Favoritos',
    instagram: 'Instagram', whatsapp: 'WhatsApp', view: 'Ver', addEvent: 'Agregar evento',
    oneOffOrWeekly: 'Único o semanal', title: 'Título', date: 'Fecha', time: 'Hora', venue: 'Lugar', artist: 'Artista',
    recurringWeekly: 'Recurrente (semanal)', cancel: 'Cancelar', createInvite: 'Crear e Invitar',
    pending: 'Pendiente', pendingAwaitVenue: 'Pendiente (esperando lugar)', pendingAwaitArtist: 'Pendiente (esperando artista)',
    tbaPrivate: 'A confirmar (lugar privado)', moreInfo: 'Más info', openInMaps: 'Abrir en Maps', addToCalendar: 'Agregar al calendario', share: 'Compartir',
    invites: 'Invitaciones', noInvites: 'Sin invitaciones.', accept: 'Aceptar', decline: 'Rechazar',
    inviteTitle: 'Invitación', inviteExplainMismatch: 'No sos el destinatario. Cambiá de identidad para aceptar.', switchIdentity: 'Cambiar identidad',
    inviteAccepted: 'Invitación aceptada', inviteDeclined: 'Invitación rechazada', expiredInvite: 'Invitación vencida',
    exportIcs: 'Exportar .ics', events: 'Eventos', noEvents: 'Sin eventos aún.', searchPlaceholder: 'Buscar…',
  },
  it: {
    agenda: 'Agenda', artists: 'Artisti', venues: 'Luoghi', inbox: 'Posta', favorites: 'Preferiti',
    instagram: 'Instagram', whatsapp: 'WhatsApp', view: 'Vedi', addEvent: 'Aggiungi evento',
    oneOffOrWeekly: 'Singolo o settimanale', title: 'Titolo', date: 'Data', time: 'Ora', venue: 'Luogo', artist: 'Artista',
    recurringWeekly: 'Ricorrente (settimanale)', cancel: 'Annulla', createInvite: 'Crea e invita',
    pending: 'In attesa', pendingAwaitVenue: 'In attesa (luogo)', pendingAwaitArtist: 'In attesa (artista)',
    tbaPrivate: 'Da definire (luogo privato)', moreInfo: 'Dettagli', openInMaps: 'Apri in Maps', addToCalendar: 'Aggiungi al calendario', share: 'Condividi',
    invites: 'Inviti', noInvites: 'Nessun invito.', accept: 'Accetta', decline: 'Rifiuta',
    inviteTitle: 'Invito', inviteExplainMismatch: 'Non sei il destinatario. Cambia identità per accettare.', switchIdentity: 'Cambia identità',
    inviteAccepted: 'Invito accettato', inviteDeclined: 'Invito rifiutato', expiredInvite: 'Invito scaduto',
    exportIcs: 'Esporta .ics', events: 'Eventi', noEvents: 'Nessun evento.', searchPlaceholder: 'Cerca…',
  },
  krenak: {
    // NOTE: Placeholder — falls back to PT for missing strings. Please provide authentic Krenak translations.
    agenda: 'Agenda', artists: 'Artistas', venues: 'Lugares', inbox: 'Convites', favorites: 'Favoritos',
    instagram: 'Instagram', whatsapp: 'WhatsApp', view: 'Ver', addEvent: 'Adicionar evento',
    oneOffOrWeekly: 'Evento avulso ou semanal', title: 'Título', date: 'Data', time: 'Hora', venue: 'Lugar', artist: 'Artista',
    recurringWeekly: 'Recorrente (semanal)', cancel: 'Cancelar', createInvite: 'Criar & Convidar',
    pending: 'Pendente', pendingAwaitVenue: 'Pendente (aguardando lugar)', pendingAwaitArtist: 'Pendente (aguardando artista)',
    tbaPrivate: 'A definir (lugar privado)', moreInfo: 'Mais detalhes', openInMaps: 'Abrir no Maps', addToCalendar: 'Adicionar ao calendário', share: 'Compartilhar',
    invites: 'Convites', noInvites: 'Sem convites.', accept: 'Aceitar', decline: 'Recusar',
    inviteTitle: 'Convite', inviteExplainMismatch: 'Você não é o destinatário deste convite. Troque de identidade para aceitar.', switchIdentity: 'Trocar identidade',
    inviteAccepted: 'Convite aceito', inviteDeclined: 'Convite recusado', expiredInvite: 'Convite expirado',
    exportIcs: 'Exportar .ics', events: 'Eventos', noEvents: 'Sem eventos ainda.', searchPlaceholder: 'Buscar…',
  }
};
 function t(locale: Locale, key: string) { return I18N[locale][key] ?? I18N['pt'][key] ?? key; }

/*************************
 * FIREBASE (Optional)
 *************************/
let db: any = null; let Timestamp: any = null; let fsQuery: any = null; let collection: any = null; let where: any = null; let orderBy: any = null; let getDocs: any = null;
(function initFirebase() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const appMod = require("firebase/app");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fsMod = require("firebase/firestore");
    const { initializeApp, getApps } = appMod;
    const { getFirestore, Timestamp: T, collection: C, query: Q, where: W, orderBy: O, getDocs: G } = fsMod;
    const cfg = (typeof window !== "undefined" && (window as any).__PIPA_FB__) || {
      apiKey: (import.meta as any)?.env?.VITE_FB_API_KEY,
      authDomain: (import.meta as any)?.env?.VITE_FB_AUTH_DOMAIN,
      projectId: (import.meta as any)?.env?.VITE_FB_PROJECT_ID,
      storageBucket: (import.meta as any)?.env?.VITE_FB_STORAGE_BUCKET,
      messagingSenderId: (import.meta as any)?.env?.VITE_FB_MESSAGING_SENDER_ID,
      appId: (import.meta as any)?.env?.VITE_FB_APP_ID,
    };
    if (cfg && cfg.projectId) {
      const app = getApps().length ? getApps()[0] : initializeApp(cfg);
      db = getFirestore(app); Timestamp = T; collection = C; fsQuery = Q; where = W; orderBy = O; getDocs = G;
    }
  } catch {}
})();

/*************************
 * SAMPLE DATA (unchanged from V0.4.1 with createdBy field)
 *************************/
const WEEK = [
  { iso: "2025-08-31", labelShort: "31", dow: "Sun" },
  { iso: "2025-09-01", labelShort: "1", dow: "Mon" },
  { iso: "2025-09-02", labelShort: "2", dow: "Tue" },
  { iso: "2025-09-03", labelShort: "3", dow: "Wed" },
  { iso: "2025-09-04", labelShort: "4", dow: "Thu", highlighted: true },
  { iso: "2025-09-05", labelShort: "5", dow: "Fri" },
  { iso: "2025-09-06", labelShort: "6", dow: "Sat" },
];

const ARTISTS = [
  { id: "artist_pri", name: "Pri Yoga", instagram: "https://instagram.com/priyoga", whatsapp: "5584999991111", published: true },
  { id: "artist_jotape", name: "Jota-Pê Art", instagram: "https://instagram.com/jotapearte", whatsapp: "5584999992222", published: true },
];

const VENUES = [
  { id: "venue_praia_madeiro", name: "Praia do Madeiro", type: "public_place", locationPolicy: "public", instagram: "https://instagram.com/praiadepipa", geo: { lat: -6.214, lng: -35.049 }, address: "Madeiro, Pipa", published: true },
  { id: "venue_praca", name: "Praça do Pescador", type: "public_place", locationPolicy: "public", instagram: "https://instagram.com/pipaoficial", geo: { lat: -6.237, lng: -35.052 }, address: "Centro, Pipa", published: true },
  { id: "venue_studio_azul", name: "Studio Azul", type: "private_venue", locationPolicy: "private", instagram: "https://instagram.com/studioazul", whatsapp: "5584999645095", address: "Rua do Céu 123", published: true },
];

const LOCAL_EVENTS_BASE: any[] = [
  {
    id: "yoga-pri",
    title: "Yoga on the Beach with Pri Yoga",
    time: "08:00",
    startAt: new Date("2025-09-04T08:00:00"),
    location: "Praia do Madeiro",
    host: "Pri Yoga",
    artistId: "artist_pri",
    venueId: "venue_praia_madeiro",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
    blurb: "Start your day with a refreshing yoga class on Madeiro Beach, connecting with nature and breath.",
    category: "wellness",
    phone: "5584999991111",
    published: true,
    status: "published",
    locationHidden: false,
    createdBy: "artist",
  },
  {
    id: "painting-jotape",
    title: "Painting Workshop with Jota-Pê",
    time: "10:00",
    startAt: new Date("2025-09-04T10:00:00"),
    location: "Studio Azul",
    host: "Jota-Pê Art",
    artistId: "artist_jotape",
    venueId: "venue_studio_azul",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop",
    blurb: "Unleash your creativity at Jota-Pê's hands-on workshop. All materials included.",
    category: "workshop",
    published: false,
    status: "pending_invite",
    locationHidden: true,
    locationLabel: "TBA (private venue)",
    createdBy: "artist",
  },
];

/*************************
 * UTILS
 *************************/
function fmtLongDate(iso: string) { const d = new Date(iso + "T12:00:00"); const dow = d.toLocaleDateString(undefined, { weekday: "long" }); const month = d.toLocaleDateString(undefined, { month: "long" }); const day = d.getDate(); return `${dow}, ${month} ${day}`; }
function monthLabel(iso: string) { const d = new Date(iso + "T12:00:00"); return d.toLocaleDateString(undefined, { month: "long" }); }
function track(name: string, payload: Record<string, any> = {}) { if (typeof window !== "undefined" && (window as any).gtag) { (window as any).gtag("event", name, payload); } console.debug("analytics:", name, payload); }
function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtICSDate(d: Date) { return (d.getUTCFullYear().toString() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z"); }
function escapeICS(s: string = "") { return String(s).replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n"); }
function isPublicPlace(venueId: string) { const v = VENUES.find(v=>v.id===venueId); return v?.type === 'public_place'; }

// Multi-event ICS for profile export (published-only for now)
function buildCalendarICS(name: string, events: any[]) {
  const lines = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Pipa Artist Hub//EN',`X-WR-CALNAME:${escapeICS(name)}`
  ];
  for (const ev of events) {
    const start = new Date(ev.startAt || new Date());
    const end = new Date(start.getTime() + 60*60*1000);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${(ev.id||Math.random().toString(36).slice(2)) + '@pipa.art'}`);
    lines.push(`DTSTAMP:${fmtICSDate(new Date())}`);
    lines.push(`DTSTART:${fmtICSDate(start)}`);
    lines.push(`DTEND:${fmtICSDate(end)}`);
    lines.push(`SUMMARY:${escapeICS(ev.title || '')}`);
    const loc = ev.locationHidden ? (ev.locationLabel || 'TBA (private venue)') : ev.location;
    lines.push(`LOCATION:${escapeICS(loc||'')}`);
    lines.push(`DESCRIPTION:${escapeICS(ev.blurb || '')}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\n')], { type: 'text/calendar' });
  return URL.createObjectURL(blob);
}

function icsUrl(ev: any) { const baseDate = ev.startAt ? new Date(ev.startAt) : new Date((ev.date || "1970-01-01") + "T" + (ev.time || "10:00") + ":00"); const end = new Date(baseDate.getTime() + 60 * 60 * 1000); const stamp = new Date(); const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Pipa Artist Hub//EN","BEGIN:VEVENT",`UID:${(ev.id || "local") + "@pipa.art"}`,`DTSTAMP:${fmtICSDate(stamp)}`,`DTSTART:${fmtICSDate(baseDate)}`,`DTEND:${fmtICSDate(end)}`,`SUMMARY:${escapeICS(ev.title)}`,`LOCATION:${escapeICS(ev.locationHidden ? (ev.locationLabel || "TBA (private venue)") : ev.location)}`,`DESCRIPTION:${escapeICS(ev.blurb || "")}`,"END:VEVENT","END:VCALENDAR"].join("\n"); const blob = new Blob([ics], { type: "text/calendar" }); return URL.createObjectURL(blob); }
function waUrl(ev: any, inviteLink?: string) { const base = `Olá! Convite para *${ev.title}* — confirme aqui: ${inviteLink || ""}`.trim(); if (ev.phone) return `https://wa.me/${ev.phone}?text=${encodeURIComponent(base)}`; return `https://wa.me/?text=${encodeURIComponent(base)}`; }
function mapsUrl(ev: any) { if (ev.locationHidden) return "#"; const v = VENUES.find(x=>x.id===ev.venueId); if (v?.geo) return `https://www.google.com/maps/search/?api=1&query=${v.geo.lat},${v.geo.lng}`; return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((ev.location||'') + ", Pipa RN")}`; }
function randomToken(n = 24) { return Array.from(crypto.getRandomValues(new Uint8Array(n))).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, n); }

/*************************
 * ROUTER (hash)
 *************************/
 type Route = { name: string; params?: Record<string,string> };
 function parseHash(hash: string): Route {
  const h = (hash || '#/agenda').replace(/^#/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'invite' && parts[1]) return { name: 'invite', params: { token: parts[1] } };
  if (parts[0] === 'p' && parts[1] && parts[2]) return { name: 'profile', params: { kind: parts[1], id: parts[2] } };
  const basic = ['agenda','artists','venues','inbox','favorites'];
  return { name: basic.includes(parts[0]) ? parts[0] : 'agenda' };
 }
 function navTo(path: string) { window.location.hash = path; }

/*************************
 * IDENTITIES & STORAGE
 *************************/
const IDENTITIES = [
  { key: "visitor", label: "Visitor", role: "visitor", uid: "visitor" },
  { key: "artist_pri", label: "Artist: Pri Yoga", role: "artist", uid: "artist_pri", artistId: "artist_pri" },
  { key: "artist_jotape", label: "Artist: Jota-Pê", role: "artist", uid: "artist_jotape", artistId: "artist_jotape" },
  { key: "venue_studio", label: "Venue: Studio Azul", role: "venue", uid: "venue_studio", venueId: "venue_studio_azul" },
  { key: "venue_madeiro", label: "Venue: Praia do Madeiro", role: "venue", uid: "venue_praia_madeiro", venueId: "venue_praia_madeiro" },
];
function loadLS<T>(k: string, fallback: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function saveLS(k: string, v: any) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

/*************************
 * DATA HOOKS (agenda)
 *************************/
function useDayEvents(selectedISO: string, searchQ: string, extraEvents: any[]) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let canceled = false; (async () => {
      setLoading(true);
      const start = new Date(selectedISO + "T00:00:00"); const end = new Date(start); end.setDate(end.getDate() + 1);
      const base = LOCAL_EVENTS_BASE.filter(e => { const d = e.startAt ? new Date(e.startAt) : new Date(selectedISO + "T00:00:00"); return d >= start && d < end; });
      const fallback = base.filter(e => e.published === true);
      if (db && Timestamp) { try {
        const q = fsQuery(collection(db, "events"), where("published", "==", true), where("startAt", ">=", Timestamp.fromDate(start)), where("startAt", "<", Timestamp.fromDate(end)), orderBy("startAt", "asc"));
        const snap = await getDocs(q); const rows = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })); if (!canceled) setEvents(rows);
      } catch (e) { if (!canceled) setEvents(fallback); } } else { if (!canceled) setEvents(fallback); }
      if (!canceled) setLoading(false);
    })(); return () => { canceled = true; };
  }, [selectedISO]);

  const q = (searchQ || "").trim().toLowerCase();
  const merged = useMemo(() => {
    const start = new Date(selectedISO + "T00:00:00"); const end = new Date(start); end.setDate(end.getDate() + 1);
    const extraForDayPublished = (extraEvents || []).filter((e) => { const d = e.startAt ? new Date(e.startAt) : new Date(selectedISO + "T00:00:00"); return d >= start && d < end && e.published === true; });
    return [...events, ...extraForDayPublished];
  }, [events, extraEvents, selectedISO]);

  const filtered = useMemo(() => merged.filter((e) => q ? [e.title, e.location, e.host, e.blurb, e.category].join(" ").toLowerCase().includes(q) : true), [merged, q]);
  return { events: filtered, loading };
}

/*************************
 * UI COMPONENTS
 *************************/
function Header({ query, setQuery, locale, setLocale, identityKey, setIdentityKey }: { query: string; setQuery: (s: string) => void; locale: Locale; setLocale: (l: Locale) => void; identityKey: string; setIdentityKey: (k: string) => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-neutral-200">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={()=>navTo('/agenda')}>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-200">🌊</span>
          <span className="font-semibold tracking-tight">Pipa Artist Hub</span>
        </div>

        <nav className="hidden md:flex ml-6 items-center gap-5 text-sm text-neutral-600">
          <button onClick={()=>navTo('/agenda')} className="hover:text-neutral-900">{t(locale,'agenda')}</button>
          <button onClick={()=>navTo('/artists')} className="hover:text-neutral-900">{t(locale,'artists')}</button>
          <button onClick={()=>navTo('/venues')} className="hover:text-neutral-900">{t(locale,'venues')}</button>
          <button onClick={()=>navTo('/inbox')} className="hover:text-neutral-900">{t(locale,'inbox')}</button>
          <button onClick={()=>navTo('/favorites')} className="hover:text-neutral-900">{t(locale,'favorites')}</button>
        </nav>

        <div className="ml-auto hidden md:block w-72 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(locale,'searchPlaceholder')} className="w-full rounded-xl border bg-white/70 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 ring-neutral-300" aria-label={t(locale,'searchPlaceholder')} />
        </div>

        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-neutral-500"/>
          <select value={locale} onChange={(e)=>setLocale(e.target.value as Locale)} className="rounded-lg border px-2 py-1 text-sm">
            <option value="pt">PT</option>
            <option value="en">EN</option>
            <option value="es-AR">ES-AR</option>
            <option value="it">IT</option>
            <option value="krenak">KRENAK*</option>
          </select>
        </div>

        <select value={identityKey} onChange={(e)=>setIdentityKey(e.target.value)} className="ml-2 rounded-lg border px-2 py-1 text-sm">
          {IDENTITIES.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
        </select>

        <button aria-label="Account" className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
          <User className="h-4 w-4" />
        </button>
      </div>
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(locale,'searchPlaceholder')} className="w-full rounded-xl border bg-white/70 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 ring-neutral-300" aria-label={t(locale,'searchPlaceholder')} />
        </div>
      </div>
    </header>
  );
}

function DateStrip({ selected, setSelected, locale }: { selected: string; setSelected: (d: string) => void; locale: Locale }) {
  return (
    <section className="mx-auto max-w-6xl px-4 sticky top-14 z-20 bg-neutral-50/90 backdrop-blur border-b border-neutral-200">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mt-4">Pipa's Cultural Agenda</h1>
      <p className="text-center text-neutral-600 mt-1">{fmtLongDate(selected)}</p>
      <p className="text-center text-sm text-neutral-500 font-medium mt-4">{monthLabel(selected)}</p>

      <div className="mt-2 mb-4 flex items-center justify-center gap-2 overflow-x-auto">
        {WEEK.map((d) => { const isActive = d.iso === selected; return (
          <button key={d.iso} onClick={() => setSelected(d.iso)} className={`group rounded-xl border px-4 py-2 text-center min-w-[62px] transition shadow-sm ${isActive?"bg-yellow-400 border-yellow-400 text-neutral-900":"bg-white border-neutral-200 hover:border-neutral-300"}`} aria-current={isActive ? "date" : undefined}>
            <div className="text-xs text-neutral-500 group-[.bg-yellow-400]:text-neutral-800">{d.dow}</div>
            <div className="text-base font-semibold mt-0.5">{d.labelShort}</div>
          </button> ); })}
      </div>
    </section>
  );
}

function PendingBadge({ ev, locale }: { ev: any; locale: Locale }) {
  if (ev.status !== 'pending_invite') return null;
  const label = ev.pendingInvite?.toType === 'venue' ? t(locale,'pendingAwaitVenue') : t(locale,'pendingAwaitArtist');
  return <span className="inline-block text-[10px] uppercase tracking-wide bg-amber-100 text-amber-900 px-2 py-0.5 rounded">{label}</span>;
}

function EventCard({ ev, onMore, locale }: { ev: any; onMore: (e: any) => void; locale: Locale }) {
  const showLocation = !ev.locationHidden;
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-neutral-200 shadow-sm flex flex-col">
      <div className="aspect-[16/9] relative overflow-hidden">
        <img src={ev.image} alt={ev.title} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg leading-tight">{ev.title}</h3>
          <PendingBadge ev={ev} locale={locale} />
        </div>
        <div className="flex flex-col gap-1 text-sm text-neutral-700">
          <div className="inline-flex items-center gap-2"><Clock className="h-4 w-4" /> {ev.time || "—"}</div>
          <div className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {showLocation ? ev.location : (ev.locationLabel || t(locale,'tbaPrivate'))}</div>
          <div className="inline-flex items-center gap-2"><User className="h-4 w-4" /> {ev.host}</div>
        </div>
        <p className="text-sm text-neutral-600 line-clamp-3">{ev.blurb}</p>
        <div className="mt-1">
          <button onClick={() => { track("open_modal", { id: ev.id }); onMore(ev); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border border-neutral-300 hover:bg-neutral-50" aria-haspopup="dialog">
            {t(locale,'moreInfo')} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, titleId = "dialog-title", children }: { open: boolean; onClose: () => void; titleId?: string; children: any }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) {
      document.addEventListener("keydown", onKey);
      const prev = document.activeElement as HTMLElement | null;
      const btn = ref.current?.querySelector<HTMLElement>("button, a, [tabindex]:not([tabindex='-1'])");
      btn?.focus(); const prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
      return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; if (prev && prev.focus) prev.focus(); };
    }
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" aria-hidden={!open}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-w-lg w-full rounded-2xl bg-white shadow-xl border border-neutral-200">{children}</div>
      </div>
    </div>
  );
}

function ProfileCard({ kind, data, onView, onToggleFav, isFav, locale }: { kind: 'artist'|'venue'; data: any; onView: () => void; onToggleFav: () => void; isFav: boolean; locale: Locale }) {
  const primaryLink = data.instagram;
  return (
    <div className="rounded-2xl border bg-white p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg leading-tight">{data.name}</h3>
          <p className="text-xs text-neutral-500">{kind === 'venue' ? (data.type === 'private_venue' ? 'Private venue' : 'Public place') : 'Artist'}</p>
        </div>
        <button onClick={onToggleFav} className={`rounded-full p-2 ${isFav? 'text-red-500' : 'text-neutral-500'} hover:bg-neutral-100`} aria-label="Favorite">
          <Heart className="h-5 w-5" fill={isFav? 'currentColor':'none'} />
        </button>
      </div>
      <div className="flex gap-2">
        {primaryLink && <a href={primaryLink} target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50">{t(locale,'instagram')}</a>}
        {data.whatsapp && <a href={`https://wa.me/${data.whatsapp}`} target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50">{t(locale,'whatsapp')}</a>}
        <button onClick={onView} className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50">{t(locale,'view')}</button>
      </div>
    </div>
  );
}

function AddEventForm({ initiator, defaultArtistId, defaultVenueId, onCreate, onClose, locale }: { initiator: 'artist'|'venue'; defaultArtistId?: string; defaultVenueId?: string; onCreate: (ev: any, invite: any) => void; onClose: () => void; locale: Locale }) {
  const [title, setTitle] = useState(""); const [date, setDate] = useState("2025-09-04"); const [time, setTime] = useState("10:00");
  const [artistId, setArtistId] = useState<string>(defaultArtistId || ARTISTS[0].id);
  const [venueId, setVenueId] = useState<string>(defaultVenueId || VENUES[0].id);
  const [recurring, setRecurring] = useState(false);
  const artist = ARTISTS.find(a=>a.id===artistId)!; const venue = VENUES.find(v=>v.id===venueId)!; const isPrivate = venue.type === 'private_venue';
  function submit() {
    const id = `ev_${Date.now()}`; const startAt = new Date(`${date}T${time}:00`);
    const ev: any = {
      id, title: title || `${artist.name} @ ${venue.name}`, time, startAt, location: venue.name, host: artist.name,
      artistId, venueId, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
      blurb: recurring ? "Recurring session" : "Special session", category: "collab",
      published: false, status: "pending_invite", pendingInvite: { toType: initiator==='artist' ? 'venue' : 'artist', toId: initiator==='artist' ? venueId : artistId },
      locationHidden: isPrivate ? true : false, locationLabel: isPrivate ? t(locale,'tbaPrivate') : venue.name,
      instagram: artist.instagram, phone: venue.whatsapp || artist.whatsapp, recurrence: recurring ? { freq: 'WEEKLY', byweekday: [new Date(startAt).getDay()] } : undefined,
      createdBy: initiator,
    };
    const token = randomToken(24);
    const invite = { id: `inv_${Date.now()}`, eventId: id, toType: ev.pendingInvite.toType, toId: ev.pendingInvite.toId, status: 'sent', sentVia: 'whatsapp', token, createdAt: new Date(), expiresAt: Date.now()+14*24*60*60*1000 };
    onCreate(ev, invite);
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm">{t(locale,'title')}<input className="mt-1 w-full rounded-lg border px-3 py-2" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder={t(locale,'title')}/></label>
        <label className="text-sm">{t(locale,'date')}<input type="date" className="mt-1 w-full rounded-lg border px-3 py-2" value={date} onChange={(e)=>setDate(e.target.value)}/></label>
        <label className="text-sm">{t(locale,'time')}<input type="time" className="mt-1 w-full rounded-lg border px-3 py-2" value={time} onChange={(e)=>setTime(e.target.value)}/></label>
        {initiator==='artist' ? (
          <label className="text-sm">{t(locale,'venue')}<select className="mt-1 w-full rounded-lg border px-3 py-2" value={venueId} onChange={(e)=>setVenueId(e.target.value)}>{VENUES.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
        ) : (
          <label className="text-sm">{t(locale,'artist')}<select className="mt-1 w-full rounded-lg border px-3 py-2" value={artistId} onChange={(e)=>setArtistId(e.target.value)}>{ARTISTS.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        )}
      </div>
      <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={recurring} onChange={(e)=>setRecurring(e.target.checked)} /> {t(locale,'recurringWeekly')}</label>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="rounded-lg border px-3 py-2 text-sm">{t(locale,'cancel')}</button>
        <button onClick={submit} className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm hover:bg-neutral-800 inline-flex items-center gap-2"><PlusCircle className="h-4 w-4"/>{t(locale,'createInvite')}</button>
      </div>
    </div>
  );
}

function Inbox({ invites, onAccept, onDecline, identity, locale }: { invites: any[]; onAccept: (inv: any)=>void; onDecline: (inv: any)=>void; identity: any; locale: Locale }) {
  const mine = invites.filter(i => (identity.role==='artist' && i.toType==='artist' && i.toId===identity.artistId) || (identity.role==='venue' && i.toType==='venue' && i.toId===identity.venueId));
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <h2 className="text-xl font-semibold mb-4">{t(locale,'invites')}</h2>
      {mine.length===0 ? <p className="text-neutral-600">{t(locale,'noInvites')}</p> : (
        <div className="space-y-3">
          {mine.map(i => (
            <div key={i.id} className="rounded-xl border bg-white p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold">{t(locale,'inviteTitle')} <span className="font-mono">{i.eventId}</span></div>
                <div className="text-neutral-600">Status: {i.status}</div>
                <div className="text-neutral-500 text-xs">Token: {i.token.slice(0,8)}…</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>onAccept(i)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-green-50"><Check className="h-4 w-4"/>{t(locale,'accept')}</button>
                <button onClick={()=>onDecline(i)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-red-50"><Ban className="h-4 w-4"/>{t(locale,'decline')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InviteLanding({ token, invites, identity, onAccept, onDecline, setIdentityKey, locale }: { token: string; invites: any[]; identity: any; onAccept: (inv:any)=>void; onDecline:(inv:any)=>void; setIdentityKey:(k:string)=>void; locale: Locale }) {
  const invite = invites.find(i=>i.token===token);
  if (!invite) return <section className="mx-auto max-w-3xl px-4 py-8"><h2 className="text-xl font-semibold">{t(locale,'inviteTitle')}</h2><p className="text-neutral-600 mt-2">{t(locale,'expiredInvite')}</p></section>;
  const isCounterparty = (invite.toType==='artist' && identity.artistId===invite.toId) || (invite.toType==='venue' && identity.venueId===invite.toId);
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="text-xl font-semibold mb-2">{t(locale,'inviteTitle')}</h2>
      <p className="text-neutral-600 mb-4">Event: <span className="font-mono">{invite.eventId}</span> · Token: <span className="font-mono">{token.slice(0,8)}…</span></p>
      {!isCounterparty && (
        <div className="rounded-lg border bg-amber-50 text-amber-900 p-3 mb-3 text-sm">{t(locale,'inviteExplainMismatch')} ·
          <button onClick(()=>{
            if (invite.toType==='artist') setIdentityKey('artist_jotape'); else setIdentityKey('venue_madeiro');
          }} className="underline ml-1">{t(locale,'switchIdentity')}</button>
        </div>
      )}
      <div className="flex gap-2">
        <button disabled={!isCounterparty} onClick={()=>onAccept(invite)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-green-50 disabled:opacity-50"><Check className="h-4 w-4"/>{t(locale,'accept')}</button>
        <button disabled={!isCounterparty} onClick={()=>onDecline(invite)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-red-50 disabled:opacity-50"><Ban className="h-4 w-4"/>{t(locale,'decline')}</button>
      </div>
    </section>
  );
}

/*************************
 * APP
 *************************/
export default function App() {
  const [hash, setHash] = useState<string>(window.location.hash || '#/agenda');
  useEffect(()=>{ const onHash=()=>setHash(window.location.hash || '#/agenda'); window.addEventListener('hashchange', onHash); return ()=>window.removeEventListener('hashchange', onHash); },[]);
  const route = parseHash(hash);

  const [selected, setSelected] = useState<string>("2025-09-04");
  const [search, setSearch] = useState<string>("");
  const [active, setActive] = useState<any>(null);

  const [locale, _setLocale] = useState<Locale>(()=> loadLS('locale','pt'));
  const setLocale = (l: Locale) => { _setLocale(l); saveLS('locale', l); };

  const [identityKey, _setIdentityKey] = useState<string>(()=> loadLS("identityKey","visitor"));
  const identity = useMemo(()=> IDENTITIES.find(i=>i.key===identityKey) || IDENTITIES[0], [identityKey]);
  function setIdentityKey(k: string) { _setIdentityKey(k); saveLS("identityKey", k); }

  // Runtime events + invites
  const [runtimeEvents, setRuntimeEvents] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>(()=> loadLS("invites", []));
  useEffect(()=> saveLS("invites", invites), [invites]);

  // Favorites
  const [favArtists, setFavArtists] = useState<string[]>(()=> loadLS("fav_artists", []));
  const [favVenues, setFavVenues] = useState<string[]>(()=> loadLS("fav_venues", []));
  useEffect(()=> saveLS("fav_artists", favArtists), [favArtists]);
  useEffect(()=> saveLS("fav_venues", favVenues), [favVenues]);

  const { events, loading } = useDayEvents(selected, search, runtimeEvents);

  function toggleFav(kind: 'artist'|'venue', id: string) {
    if (kind==='artist') setFavArtists(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
    else setFavVenues(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  }

  function createEventAndInvite(ev: any, invite: any) {
    setRuntimeEvents(prev => [...prev, ev]); setInvites(prev => [...prev, invite]);
    const link = `${window.location.origin}/#/invite/${invite.token}`; navigator.clipboard?.writeText(link).catch(()=>{});
    const wa = waUrl({ title: ev.title, phone: (identity.role==='artist'? VENUES.find(v=>v.id===ev.venueId)?.whatsapp : ARTISTS.find(a=>a.id===ev.artistId)?.whatsapp) }, link);
    window.open(wa, "_blank"); track("invite_sent", { eventId: ev.id, to: invite.toType });
  }
  function acceptInvite(invite: any) {
    const now = Date.now(); if (invite.expiresAt && now>invite.expiresAt) { alert(t(locale,'expiredInvite')); return; }
    setInvites(prev => prev.map(i => i.id===invite.id ? { ...i, status: 'accepted' } : i));
    setRuntimeEvents(prev => prev.map(ev => { if (ev.id!==invite.eventId) return ev; const isPrivate = !isPublicPlace(ev.venueId); return { ...ev, status:'published', published:true, pendingInvite:null, locationHidden: isPrivate? false : ev.locationHidden }; }));
    alert(t(locale,'inviteAccepted')); navTo('/inbox');
  }
  function declineInvite(invite: any) { setInvites(prev => prev.map(i => i.id===invite.id ? { ...i, status: 'declined' } : i)); setRuntimeEvents(prev => prev.map(ev => ev.id===invite.eventId ? { ...ev, status: 'rejected', published: false } : ev)); alert(t(locale,'inviteDeclined')); navTo('/inbox'); }

  // Profile view from route
  const profileView = route.name==='profile' ? ({ kind: route.params!.kind as 'artist'|'venue', id: route.params!.id }) : null;
  const profileEvents = useMemo(() => {
    const source = [...runtimeEvents, ...LOCAL_EVENTS_BASE]; if (!profileView) return [] as any[];
    if (profileView.kind === 'artist') return source.filter(ev => ev.artistId === profileView.id && (ev.status === 'published' || ev.createdBy === 'artist'));
    return source.filter(ev => ev.venueId === profileView.id && (ev.status === 'published' || ev.createdBy === 'venue'));
  }, [profileView, runtimeEvents]);

  function exportProfileICS() {
    if (!profileView) return; const name = (profileView.kind==='artist' ? ARTISTS.find(a=>a.id===profileView.id)?.name : VENUES.find(v=>v.id===profileView.id)?.name) || 'Calendar';
    const list = profileEvents.filter(e=>e.published===true); // published only for public export
    const url = buildCalendarICS(name, list);
    const link = document.createElement('a');
    link.href = url;
    link.download = name.replace(/\s+/g, '_') + '.ics';
    link.click();
  }

  // TODO: Implement full routing and rendering logic
  return <div>Pipa Artist Hub</div>;
}

