/*
 * Home Appliance Card (FR)
 * Carte Home Assistant pour l'électroménager (lave-linge, sèche-linge, réfrigérateur, congélateur, lave-vaisselle) :
 * illustration animée pendant le cycle, état, puissance, infos du dernier cycle, température et alerte « plus de
 * consommation ». Style verre, thème clair/sombre automatique, éditeur visuel, textes en français.
 */
const CARD_VERSION = "1.1.0";

const TYPES = {
  washer: { label: "Lave-linge", on: "En marche", off: "À l'arrêt", icon: "mdi:washing-machine" },
  dryer: { label: "Sèche-linge", on: "En marche", off: "À l'arrêt", icon: "mdi:tumble-dryer" },
  dishwasher: { label: "Lave-vaisselle", on: "En marche", off: "À l'arrêt", icon: "mdi:dishwasher" },
  oven: { label: "Four encastré", on: "En chauffe", off: "Éteint", icon: "mdi:stove" },
  microwave: { label: "Micro-ondes", on: "En marche", off: "À l'arrêt", icon: "mdi:microwave" },
  fridge: { label: "Réfrigérateur 1 porte", on: "Compresseur en marche", off: "Au repos", icon: "mdi:fridge" },
  freezer: { label: "Congélateur 1 porte", on: "Compresseur en marche", off: "Au repos", icon: "mdi:fridge-industrial" },
};
const DEFAULTS = { title: "", theme: "auto", appliances: [] };
const APP_DEFAULTS = { type: "washer", name: "", state_entity: "", power_entity: "", temperature_entity: "", power_threshold: 5, no_power_after: 0, temp_alert: "", on_states: "", image: "", image_mode: "background", image_opacity: 0.35, info_entities: [] };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const num = (st) => (st && st.state !== "unknown" && st.state !== "unavailable" && st.state !== "" && !isNaN(Number(st.state)) ? Number(st.state) : null);
const gone = (st) => !st || st.state === "unavailable";
const ON_DEFAULT = ["marche", "on", "running", "en marche", "run", "washing", "drying", "active", "lavage", "sechage", "cycle"];

function art(type, on) {
  const run = on ? "run" : "";
  const body = (extra = "") => `<rect x="6" y="4" width="68" height="84" rx="9" class="bd"/>${extra}`;
  if (type === "washer" || type === "dryer") {
    const dry = type === "dryer";
    return `<svg viewBox="0 0 80 92" class="art ${run}" aria-hidden="true">${body(`<line x1="6" y1="22" x2="74" y2="22" class="ln"/><circle cx="18" cy="13" r="3" class="dot"/><circle cx="28" cy="13" r="3" class="dot"/><rect x="50" y="10" width="18" height="6" rx="3" class="ln2"/>`)}
      <circle cx="40" cy="56" r="26" class="rim"/><clipPath id="dr${type}"><circle cx="40" cy="56" r="21"/></clipPath>
      <circle cx="40" cy="56" r="21" class="gl"/>
      <g clip-path="url(#dr${type})">${dry ? "" : `<g class="water"><path d="M10 60 q7 -6 15 0 t15 0 t15 0 t15 0 V90 H10Z" class="wt"/></g>`}
        <g class="drum" style="transform-origin:40px 56px">${[0, 120, 240].map((a) => `<rect x="36" y="38" width="8" height="12" rx="3" class="cloth" transform="rotate(${a} 40 56)"/>`).join("")}<circle cx="40" cy="56" r="3" class="cloth"/></g></g>
      ${dry ? `<g class="heat"><path d="M24 80 q-3 -4 0 -8" class="hw"/><path d="M40 82 q-3 -4 0 -8" class="hw"/><path d="M56 80 q-3 -4 0 -8" class="hw"/></g>` : ""}</svg>`;
  }
  if (type === "dishwasher") {
    return `<svg viewBox="0 0 80 92" class="art ${run}" aria-hidden="true">${body(`<line x1="6" y1="22" x2="74" y2="22" class="ln"/><circle cx="18" cy="13" r="3" class="dot"/><rect x="50" y="10" width="18" height="6" rx="3" class="ln2"/>`)}
      <rect x="14" y="30" width="52" height="52" rx="6" class="gl"/>
      <g class="plates">${[0, 1, 2, 3, 4].map((i) => `<rect x="${20 + i * 9}" y="44" width="4" height="26" rx="2" class="cloth"/>`).join("")}</g>
      <g class="spray">${[0, 1, 2].map((i) => `<circle cx="${28 + i * 12}" cy="36" r="2" class="wt dropc d${i}"/>`).join("")}</g></svg>`;
  }
  if (type === "oven") {
    return `<svg viewBox="0 0 80 80" class="art ${run}" aria-hidden="true"><rect x="4" y="4" width="72" height="72" rx="9" class="bd"/><line x1="4" y1="24" x2="76" y2="24" class="ln"/>
      <circle cx="16" cy="14" r="4" class="ln2"/><circle cx="28" cy="14" r="4" class="ln2"/><rect x="42" y="9" width="26" height="10" rx="3" class="gl"/><circle cx="64" cy="14" r="1.6" class="dot"/>
      <rect x="10" y="30" width="60" height="40" rx="6" class="gl"/><rect x="14" y="34" width="52" height="32" rx="4" class="inner"/>
      <g class="els"><path d="M18 40 H62" class="el"/><path d="M18 60 H62" class="el"/></g>
      <path d="M22 50 h36" class="ln"/><rect x="26" y="52" width="28" height="6" rx="3" class="cloth"/></svg>`;
  }
  if (type === "microwave") {
    return `<svg viewBox="0 0 92 66" class="art ${run}" aria-hidden="true"><rect x="2" y="3" width="88" height="60" rx="8" class="bd"/>
      <rect x="8" y="9" width="54" height="48" rx="5" class="gl"/><rect x="11" y="12" width="48" height="42" rx="3" class="inner"/>
      <g class="sway"><ellipse cx="35" cy="47" rx="17" ry="3.5" class="cloth"/><path d="M27 46 q8 -14 16 0Z" class="cloth"/></g>
      <g class="mw"><path d="M20 24 q4 -4 8 0 t8 0 t8 0" class="el"/><path d="M20 32 q4 -4 8 0 t8 0 t8 0" class="el"/></g>
      <rect x="67" y="9" width="17" height="9" rx="3" class="gl"/>${[0, 1, 2].map((i) => [0, 1].map((j) => `<circle cx="${71 + i * 6}" cy="${27 + j * 8}" r="2" class="dot"/>`).join("")).join("")}<rect x="67" y="46" width="17" height="8" rx="4" class="ln2"/></svg>`;
  }
  const fr = type === "freezer";
  return `<svg viewBox="0 0 80 92" class="art ${run}" aria-hidden="true">${body(`<rect x="62" y="14" width="4" height="${fr ? 30 : 24}" rx="2" class="ln2"/>`)}
    ${fr ? `<line x1="6" y1="34" x2="74" y2="34" class="ln"/><line x1="6" y1="60" x2="74" y2="60" class="ln"/><rect x="26" y="45" width="20" height="4" rx="2" class="ln2"/><rect x="26" y="70" width="20" height="4" rx="2" class="ln2"/>
      <g class="snow" style="transform-origin:36px 20px"><path d="M36 10 V30 M28 14 L44 26 M44 14 L28 26" class="hw"/></g>`
    : `<line x1="6" y1="26" x2="74" y2="26" class="ln"/><rect x="20" y="36" width="34" height="12" rx="4" class="gl"/><rect x="20" y="52" width="34" height="12" rx="4" class="gl"/><rect x="20" y="68" width="34" height="12" rx="4" class="gl"/>
      <g class="snow" style="transform-origin:36px 15px"><path d="M36 8 V22 M30 11 L42 19 M42 11 L30 19" class="hw"/></g>`}</svg>`;
}

class HomeApplianceCard extends HTMLElement {
  static getConfigElement() { return document.createElement("home-appliance-card-editor"); }
  static getStubConfig() { return { ...DEFAULTS, appliances: [{ ...APP_DEFAULTS, name: "Lave-linge" }] }; }

  constructor() { super(); this.attachShadow({ mode: "open" }); this._sig = ""; this._np = {}; }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = { ...DEFAULTS, ...config, appliances: (config.appliances || []).map((a) => ({ ...APP_DEFAULTS, ...a, info_entities: a.info_entities || [] })) };
    this._sig = ""; this._np = {};
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const sig = this._ids().map((e) => { const s = hass.states[e]; return s ? s.state + "|" + s.last_changed : "x"; }).join("#") + (this._isDark() ? "d" : "l") + Math.floor(Date.now() / 60000);
    if (sig !== this._sig) { this._sig = sig; this._render(); this._checkNoPower(); }
  }

  getCardSize() { return 4; }

  _ids() { return this._config.appliances.flatMap((a) => [a.state_entity, a.power_entity, a.temperature_entity, ...a.info_entities.map((i) => i.entity)]).filter(Boolean); }

  _isDark() {
    const t = this._config && this._config.theme;
    if (t === "dark") return true;
    if (t === "light") return false;
    const dm = this._hass && this._hass.themes && this._hass.themes.darkMode;
    return typeof dm === "boolean" ? dm : !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  _lang() { return (this._hass && this._hass.locale && this._hass.locale.language) || "fr"; }
  _nf(n, d) { return new Intl.NumberFormat(this._lang(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(n); }
  _more(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: id } })); }
  _ago(iso) {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 1) return "à l'instant";
    if (m < 60) return `il y a ${m} min`;
    const h = Math.floor(m / 60);
    return h < 24 ? `il y a ${h} h ${String(m % 60).padStart(2, "0")}` : `il y a ${Math.floor(h / 24)} j`;
  }

  _isOn(a) {
    const h = this._hass, st = h.states[a.state_entity];
    if (st && !gone(st) && st.state !== "unknown") {
      const list = a.on_states ? String(a.on_states).split(",").map(norm) : ON_DEFAULT;
      return list.includes(norm(st.state));
    }
    const p = num(h.states[a.power_entity]);
    return p !== null && p > Number(a.power_threshold || 5);
  }

  async _checkNoPower() {
    const h = this._hass;
    for (const a of this._config.appliances) {
      const mins = Number(a.no_power_after);
      if (!mins || !a.power_entity) continue;
      const k = a.power_entity;
      if (this._np[k] && Date.now() - this._np[k].at < 5 * 60000) continue;
      this._np[k] = { at: Date.now(), alert: this._np[k] ? this._np[k].alert : false };
      try {
        const start = new Date(Date.now() - mins * 60000).toISOString();
        const r = await h.callWS({ type: "history/history_during_period", start_time: start, end_time: new Date().toISOString(), entity_ids: [k], minimal_response: true, no_attributes: true, significant_changes_only: false });
        const arr = (r && r[k]) || [];
        const thr = Number(a.power_threshold || 5);
        const vals = arr.map((x) => Number(x.s)).filter((x) => !isNaN(x));
        const cur = num(h.states[k]);
        if (cur !== null) vals.push(cur);
        const alert = vals.length > 0 && !vals.some((v) => v > thr);
        if (alert !== this._np[k].alert) { this._np[k].alert = alert; this._sig = ""; this._render(); }
      } catch (e) { /* pas d'historique : pas d'alerte */ }
    }
  }

  _render() {
    const c = this._config, h = this._hass;
    if (!c || !h) return;
    const dark = this._isDark();
    const tiles = c.appliances.map((a, idx) => {
      const T = TYPES[a.type] || TYPES.washer;
      const st = h.states[a.state_entity], on = this._isOn(a), unavailable = a.state_entity && gone(st);
      const name = a.name || (st && st.attributes.friendly_name) || T.label;
      const p = num(h.states[a.power_entity]);
      const temp = num(h.states[a.temperature_entity]);
      const cool = a.type === "fridge" || a.type === "freezer";
      const lim = a.temp_alert !== "" && a.temp_alert !== undefined && !isNaN(Number(a.temp_alert)) ? Number(a.temp_alert) : (a.type === "freezer" ? -15 : 6);
      const tempBad = cool && temp !== null && temp > lim;
      const np = a.no_power_after && this._np[a.power_entity] && this._np[a.power_entity].alert;
      let sub = on ? T.on : T.off;
      if (!on && st && !cool && st.last_changed && Date.now() - new Date(st.last_changed).getTime() < 6 * 3600000 && !gone(st)) sub = `Cycle terminé ${this._ago(st.last_changed)}`;
      else if (on && st && st.last_changed && !cool) sub = `${T.on} · ${this._ago(st.last_changed).replace("il y a ", "depuis ")}`;
      if (unavailable) sub = "Indisponible";
      const tone = unavailable ? "na" : np || tempBad ? "err" : on ? "on" : "off";
      const infos = a.info_entities.filter((i) => i.entity).map((i) => {
        const s = h.states[i.entity];
        const v = !s || gone(s) || s.state === "unknown" ? "—" : isNaN(Number(s.state)) ? s.state : this._nf(Number(s.state), Math.abs(Number(s.state)) >= 100 ? 0 : 2).replace(/,00$/, "") + (s.attributes.unit_of_measurement ? " " + s.attributes.unit_of_measurement : "");
        return `<button class="inf" data-more="${esc(i.entity)}"><span>${esc(i.label || (s && s.attributes.friendly_name) || i.entity)}</span><b>${esc(v)}</b></button>`;
      }).join("");
      const heat = a.type === "oven" && temp !== null;
      const metric = (cool || heat) && temp !== null
        ? `<button class="big ${tempBad ? "bad" : heat && on ? "hot" : ""}" data-more="${esc(a.temperature_entity)}">${this._nf(temp, 1)}<small>°C</small></button>`
        : p !== null ? `<button class="big ${on ? "live" : ""}" data-more="${esc(a.power_entity)}">${this._nf(p, p >= 10 ? 0 : 1)}<small>W</small></button>` : "";
      const alertHtml = np ? `<div class="alert"><ha-icon icon="mdi:alert"></ha-icon>Aucune consommation depuis plus de ${Number(a.no_power_after) >= 60 ? this._nf(Number(a.no_power_after) / 60, Number(a.no_power_after) % 60 ? 1 : 0) + " h" : a.no_power_after + " min"}</div>`
        : tempBad ? `<div class="alert"><ha-icon icon="mdi:thermometer-alert"></ha-icon>Température trop haute (&gt; ${this._nf(lim, 0)} °C)</div>` : "";
      const power2 = (cool || heat) && p !== null ? `<div class="pw"><ha-icon icon="mdi:flash"></ha-icon>${this._nf(p, p >= 10 ? 0 : 1)} W</div>` : "";
      const imgOk = a.image && !/^\s*(javascript|vbscript|data:text)/i.test(String(a.image));
      const mode = ["background", "replace"].includes(a.image_mode) ? a.image_mode : "background";
      const op = Math.max(0, Math.min(1, isNaN(Number(a.image_opacity)) ? 0.35 : Number(a.image_opacity)));
      const bg = imgOk && mode === "background" ? `<img class="bgimg" src="${esc(a.image)}" alt="" loading="lazy" style="opacity:${op}">` : "";
      const artHtml = imgOk && mode === "replace" ? `<img class="phimg ${on && !unavailable ? "live" : ""}" src="${esc(a.image)}" alt="" loading="lazy">` : art(a.type, on && !unavailable);
      return `<div class="tile glass ${tone}">${bg}<button class="artw" data-more="${esc(a.state_entity || a.power_entity)}">${artHtml}</button>
        <div class="tb"><div class="nm">${esc(name)}</div><div class="sb"><i class="dt"></i>${esc(sub)}</div>${metric}${power2}</div>
        ${alertHtml}${infos ? `<div class="infs">${infos}</div>` : ""}</div>`;
    }).join("");

    this.shadowRoot.innerHTML = `<style>
      * { box-sizing:border-box; }
      ha-card.dark { --ap-text:#f4f6fb; --ap-muted:#a9afc0; --ap-bg:linear-gradient(160deg,#1b1e32 0%,#241a2a 55%,#2d1519 100%); --ap-border:rgba(255,255,255,.14); --ap-shadow:0 .6em 2em rgba(0,0,0,.35);
        --ap-glass:rgba(255,255,255,.07); --ap-glass-b:rgba(255,255,255,.13); --ap-acc:#4fb3ff; --ap-ok:#3ddc84; --ap-err:#ff5a5f; --ap-art:#e8ebf5; --ap-art2:rgba(255,255,255,.2); }
      ha-card.light { --ap-text:#1c2030; --ap-muted:#5d6477; --ap-bg:linear-gradient(160deg,#f8f9fd 0%,#eef1f8 55%,#f8eff0 100%); --ap-border:rgba(20,24,40,.12); --ap-shadow:0 .4em 1.4em rgba(20,24,40,.12);
        --ap-glass:rgba(255,255,255,.7); --ap-glass-b:rgba(20,24,40,.1); --ap-acc:#1a76d2; --ap-ok:#1a9d55; --ap-err:#d32f35; --ap-art:#3d4660; --ap-art2:rgba(20,24,40,.14); }
      ha-card { container-type:inline-size; display:flex; flex-direction:column; gap:12px; padding:16px; color:var(--ap-text); border-radius:24px; border:1px solid var(--ap-border); background:var(--ap-bg); box-shadow:var(--ap-shadow); overflow:hidden; }
      ha-icon { --mdc-icon-size:1.15em; flex:none; }
      button { font:inherit; color:inherit; background:none; border:0; padding:0; text-align:left; cursor:pointer; -webkit-tap-highlight-color:transparent; }
      .t { font-weight:700; font-size:1.05em; }
      .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,15.5em),1fr)); gap:10px; }
      .glass { background:var(--ap-glass); border:1px solid var(--ap-glass-b); -webkit-backdrop-filter:blur(18px) saturate(140%); backdrop-filter:blur(18px) saturate(140%); }
      .tile { position:relative; overflow:hidden; display:grid; grid-template-columns:auto 1fr; gap:10px 14px; padding:14px; border-radius:20px; align-items:center; } .tile.on { border-color:color-mix(in srgb, var(--ap-acc) 60%, transparent); } .tile.err { border-color:var(--ap-err); }
      .bgimg { position:absolute; right:0; top:0; height:100%; width:62%; object-fit:contain; object-position:right center; pointer-events:none; z-index:0;
        -webkit-mask-image:radial-gradient(ellipse 70% 80% at 70% 45%,#000 30%,transparent 78%); mask-image:radial-gradient(ellipse 70% 80% at 70% 45%,#000 30%,transparent 78%); }
      .tile > :not(.bgimg) { position:relative; z-index:1; }
      .phimg { width:100%; height:auto; max-height:7.5em; object-fit:contain; display:block; filter:drop-shadow(0 .3em .6em rgba(0,0,0,.35)); } .phimg.live { animation:glowp 2.4s ease-in-out infinite alternate; }
      @keyframes glowp { to { filter:drop-shadow(0 0 .8em var(--ap-acc)); } }
      .artw { width:5.6em; } .art { width:100%; height:auto; display:block; }
      .bd { fill:var(--ap-art2); stroke:var(--ap-art); stroke-width:2; } .ln, .ln2, .hw, .rim { stroke:var(--ap-art); stroke-width:2; fill:none; stroke-linecap:round; } .ln2 { fill:var(--ap-art2); }
      .dot { fill:var(--ap-art); } svg .gl { fill:color-mix(in srgb, var(--ap-art) 10%, transparent); stroke:var(--ap-art); stroke-width:1.6 }
      .cloth { fill:var(--ap-art); opacity:.85; } .wt { fill:var(--ap-acc); opacity:.5; } .hw { stroke:#ff8a4a; opacity:.15; } .snow, .snow2 { opacity:.9; } .snow .hw, .snow2 .hw { stroke:var(--ap-acc); opacity:.8; }
      .inner { fill:color-mix(in srgb, var(--ap-art) 6%, transparent); stroke:none; } .el { fill:none; stroke:var(--ap-art); stroke-width:2.2; stroke-linecap:round; opacity:.5; }
      .run .inner { animation:oven 2s ease-in-out infinite alternate; } @keyframes oven { from { fill:rgba(255,120,40,.18); } to { fill:rgba(255,150,40,.5); } }
      .run .el { stroke:#ff7a2f; opacity:1; animation:elp 1.4s ease-in-out infinite alternate; } @keyframes elp { to { opacity:.45; } }
      .run .mw .el { stroke:#ffb347; animation:mwv 1.1s linear infinite; stroke-dasharray:6 3; } @keyframes mwv { to { stroke-dashoffset:-18; } }
      .run .sway { animation:sw 2.4s ease-in-out infinite alternate; } @keyframes sw { from { transform:translateX(-3px); } to { transform:translateX(3px); } }
      .run .drum { animation:spin 2.4s linear infinite; } @keyframes spin { to { transform:rotate(360deg); } }
      .run .water { animation:slosh 1.6s ease-in-out infinite alternate; } @keyframes slosh { to { transform:translateX(-8px); } }
      .run .hw { animation:heat 1.4s ease-in-out infinite; opacity:.9; } @keyframes heat { 0% { opacity:.2; transform:translateY(2px); } 50% { opacity:1; } 100% { opacity:.2; transform:translateY(-3px); } }
      .run .plates { animation:wob 1.2s ease-in-out infinite alternate; } @keyframes wob { to { transform:translateY(-1.5px); } }
      .run .dropc { animation:drip 1s linear infinite; } .d1 { animation-delay:.3s; } .d2 { animation-delay:.6s; } @keyframes drip { 0% { transform:translateY(0); opacity:1; } 100% { transform:translateY(16px); opacity:0; } }
      .run .snow, .run .snow2 { animation:sn 6s linear infinite; } @keyframes sn { to { transform:rotate(360deg); } }
      .nm { font-weight:700; } .sb { display:flex; align-items:center; gap:.45em; font-size:.8em; color:var(--ap-muted); margin:.1em 0 .4em; }
      .dt { width:.55em; height:.55em; border-radius:50%; background:var(--ap-muted); flex:none; } .tile.on .dt { background:var(--ap-ok); box-shadow:0 0 .6em var(--ap-ok); } .tile.err .dt { background:var(--ap-err); }
      .big { font-size:2em; font-weight:750; line-height:1; font-variant-numeric:tabular-nums; } .big small { font-size:.45em; font-weight:600; color:var(--ap-muted); margin-left:.15em; } .big.live { color:var(--ap-acc); } .big.bad { color:var(--ap-err); } .big.hot { color:#ff8a3d; }
      .pw { display:flex; align-items:center; gap:.25em; font-size:.82em; color:var(--ap-muted); margin-top:.3em; } .pw ha-icon { color:var(--ap-acc); }
      .alert { grid-column:1/-1; display:flex; align-items:center; gap:.5em; font-size:.82em; font-weight:600; color:var(--ap-err); padding:.5em .7em; border-radius:12px; background:color-mix(in srgb, var(--ap-err) 14%, transparent); border:1px solid var(--ap-err); }
      .infs { grid-column:1/-1; display:flex; flex-direction:column; border-top:1px solid var(--ap-glass-b); } .inf { display:flex; justify-content:space-between; gap:10px; padding:.5em 0; font-size:.84em; border-top:1px solid var(--ap-glass-b); width:100%; } .inf:first-child { border-top:0; } .inf span { color:var(--ap-muted); } .inf b { text-align:right; }
      @media (prefers-reduced-motion: reduce) { .run *, .phimg { animation:none !important; } }
    </style>
    <ha-card class="${dark ? "dark" : "light"}">${c.title ? `<div class="t">${esc(c.title)}</div>` : ""}<div class="grid">${tiles || `<div class="sb">Ajoute un appareil dans l'éditeur.</div>`}</div></ha-card>`;
    this.shadowRoot.querySelectorAll("[data-more]").forEach((el) => el.addEventListener("click", () => this._more(el.dataset.more)));
  }
}

/* ---------- Éditeur visuel ---------- */
const LABELS = { title: "Titre (facultatif)", theme: "Thème", type: "Type d'appareil", name: "Nom", state_entity: "Entité d'état (marche / arrêt)", power_entity: "Entité de puissance (W)",
  temperature_entity: "Température (réfrigérateur, congélateur, four)", power_threshold: "Seuil de marche (W)", no_power_after: "Alerte si aucune consommation depuis (min, 0 = aucune)",
  temp_alert: "Alerte si température supérieure à (°C)", on_states: "États « en marche » (séparés par des virgules, facultatif)", entity: "Entité", label: "Libellé", image: "Photo de l'appareil (URL, ex. /local/lave-linge.png)", image_mode: "Affichage de la photo", image_opacity: "Opacité de la photo de fond (0 à 1)" };
const MAIN = [{ type: "grid", name: "", schema: [{ name: "title", selector: { text: {} } },
  { name: "theme", selector: { select: { mode: "dropdown", options: [{ value: "auto", label: "Automatique" }, { value: "light", label: "Clair" }, { value: "dark", label: "Sombre" }] } } }] }];
const APP = [
  { type: "grid", name: "", schema: [
    { name: "type", selector: { select: { mode: "dropdown", options: Object.entries(TYPES).map(([value, t]) => ({ value, label: t.label })) } } },
    { name: "name", selector: { text: {} } } ] },
  { name: "image", selector: { text: {} } },
  { type: "grid", name: "", schema: [
    { name: "image_mode", selector: { select: { mode: "dropdown", options: [{ value: "background", label: "Grande, en arrière-plan" }, { value: "replace", label: "À la place du dessin animé" }] } } },
    { name: "image_opacity", selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } } ] },
  { name: "state_entity", selector: { entity: {} } },
  { name: "power_entity", selector: { entity: { domain: "sensor" } } },
  { name: "temperature_entity", selector: { entity: { domain: "sensor" } } },
  { type: "expandable", title: "Réglages avancés", name: "", schema: [
    { type: "grid", name: "", schema: [{ name: "power_threshold", selector: { number: { min: 0, max: 1000, mode: "box" } } }, { name: "no_power_after", selector: { number: { min: 0, max: 1440, mode: "box" } } }] },
    { name: "temp_alert", selector: { number: { min: -40, max: 30, mode: "box", step: "any" } } },
    { name: "on_states", selector: { text: {} } } ] },
];
const INFO = [{ name: "entity", selector: { entity: {} } }, { name: "label", selector: { text: {} } }];

class HomeApplianceCardEditor extends HTMLElement {
  _sig(c) { return c.appliances.length + ":" + c.appliances.map((a) => a.info_entities.length).join(","); }
  setConfig(config) {
    const next = { ...DEFAULTS, ...config, appliances: (config.appliances || []).map((a) => ({ ...APP_DEFAULTS, ...a, info_entities: (a.info_entities || []).map((i) => ({ ...i })) })) };
    const same = this._config && this._built && this._sig(next) === this._sig(this._config);
    this._config = next;
    if (!same) return this._build();
    this._forms.forEach((f) => { f.el.data = f.get(this._config); });
  }
  set hass(h) { this._hass = h; (this._forms || []).forEach((f) => (f.el.hass = h)); }
  _emit() {
    const cfg = { ...this._config, appliances: this._config.appliances.map((a) => { const o = { ...a }; Object.keys(o).forEach((k) => { if (o[k] === "" || o[k] === undefined) delete o[k]; }); return o; }) };
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
  }
  _form(schema, get, set, parent) {
    const el = document.createElement("ha-form");
    el.hass = this._hass; el.data = get(this._config); el.schema = schema; el.computeLabel = (s) => LABELS[s.name] || s.name;
    el.addEventListener("value-changed", (ev) => { ev.stopPropagation(); set(this._config, ev.detail.value); this._emit(); });
    this._forms.push({ el, get }); parent.appendChild(el);
  }
  _build() {
    this._built = true; this._forms = []; this.innerHTML = "";
    const st = document.createElement("style");
    st.textContent = `.bx{border:1px solid var(--divider-color);border-radius:12px;padding:10px;margin:12px 0}.h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-weight:600}.sub{border-left:2px solid var(--divider-color);padding-left:8px;margin:6px 0}
      button{cursor:pointer;border:1px solid var(--divider-color);background:var(--secondary-background-color);color:var(--primary-text-color);border-radius:8px;padding:6px 10px}.add{width:100%;margin:4px 0}`;
    this.appendChild(st);
    this._form(MAIN, (c) => c, (c, v) => { const keep = c.appliances; Object.assign(c, v); c.appliances = keep; }, this);
    this._config.appliances.forEach((a, i) => {
      const box = document.createElement("div"); box.className = "bx";
      box.innerHTML = `<div class="h"><span>Appareil ${i + 1}</span><span><button data-a="up" data-i="${i}">↑</button> <button data-a="down" data-i="${i}">↓</button> <button data-a="del" data-i="${i}">✕</button></span></div>`;
      this._form(APP, (c) => c.appliances[i], (c, v) => { const info = c.appliances[i].info_entities; c.appliances[i] = { ...v, info_entities: info }; }, box);
      const sub = document.createElement("div"); sub.className = "sub"; sub.innerHTML = `<div class="h"><span>Informations (dernier cycle…)</span></div>`;
      a.info_entities.forEach((it, j) => {
        const row = document.createElement("div"); row.innerHTML = `<div class="h"><span>Info ${j + 1}</span><button data-a="delinfo" data-i="${i}" data-j="${j}">✕</button></div>`;
        this._form(INFO, (c) => c.appliances[i].info_entities[j], (c, v) => { c.appliances[i].info_entities[j] = { ...v }; }, row); sub.appendChild(row);
      });
      const add = document.createElement("button"); add.className = "add"; add.textContent = "+ Ajouter une information"; add.dataset.a = "addinfo"; add.dataset.i = i; sub.appendChild(add);
      box.appendChild(sub); this.appendChild(box);
    });
    const add = document.createElement("button"); add.className = "add"; add.textContent = "+ Ajouter un appareil"; add.dataset.a = "add"; this.appendChild(add);
    this.querySelectorAll("button[data-a]").forEach((b) => b.addEventListener("click", () => this._click(b)));
  }
  _click(b) {
    const d = b.dataset, apps = this._config.appliances, i = Number(d.i);
    if (d.a === "add") apps.push({ ...APP_DEFAULTS, info_entities: [] });
    else if (d.a === "del") apps.splice(i, 1);
    else if (d.a === "up" || d.a === "down") { const j = i + (d.a === "up" ? -1 : 1); if (j >= 0 && j < apps.length) [apps[i], apps[j]] = [apps[j], apps[i]]; }
    else if (d.a === "addinfo") apps[i].info_entities.push({ entity: "", label: "" });
    else if (d.a === "delinfo") apps[i].info_entities.splice(Number(d.j), 1);
    this._emit(); this._build();
  }
}

customElements.define("home-appliance-card", HomeApplianceCard);
customElements.define("home-appliance-card-editor", HomeApplianceCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "home-appliance-card", name: "Home Appliance Card (FR)", description: "Électroménager : lave-linge, sèche-linge, réfrigérateur, congélateur, lave-vaisselle (état, puissance, dernier cycle, alertes).", preview: true });
console.info(`%c HOME-APPLIANCE-CARD %c v${CARD_VERSION} `, "color:#fff;background:#1a76d2;font-weight:700;border-radius:3px 0 0 3px;padding:2px 4px", "color:#1a76d2;background:#fff;font-weight:700;border-radius:0 3px 3px 0;padding:2px 4px");
