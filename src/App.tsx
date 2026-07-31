import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, CircleDot, Dices, ExternalLink, Gamepad2, Home, PartyPopper, Pencil, Plus, RotateCcw, Settings, Smartphone, Trash2, Trophy, Tv, X } from "lucide-react";
import { Wheel as RouletteWheel } from "react-custom-roulette";
import { QRCodeSVG } from "qrcode.react";
import { initialData, isSharedSessionConfigured, loadSharedData, saveSharedData, selectWithoutRepeats, subscribeToSharedData, teamById } from "./data";
import type { Activity, AppData, GamePhase, TeamId } from "./types";

const phases: Record<GamePhase, string> = { HOME: "Preparados", MINIGAME_WHEEL: "Eligiendo reto", MINIGAME_RESULT: "Reto listo", SELECT_LOSER: "¿Quién pierde?", LOSER_RESULT: "Equipo perdedor", PUNISHMENT_WHEEL: "Eligiendo castigo", PUNISHMENT_RESULT: "Castigo listo" };

function useGameData() {
  const [data, setData] = useState<AppData>(initialData);
  const update = (next: AppData | ((state: AppData) => AppData)) => setData((current) => {
    const resolved = typeof next === "function" ? next(current) : next;
    void saveSharedData(resolved).catch((error: unknown) => console.error("No se ha podido sincronizar la partida", error));
    return resolved;
  });
  useEffect(() => {
    let active = true;
    loadSharedData().then((state) => { if (active) setData(state); }).catch((error: unknown) => console.error("No se ha podido cargar la partida", error));
    const unsubscribe = subscribeToSharedData((state) => { if (active) setData(state); });
    return () => { active = false; unsubscribe(); };
  }, []);
  return [data, update] as const;
}

function App() {
  if (!isSharedSessionConfigured) return <main className="tv-shell"><section className="tv-home"><p className="eyebrow">SESIÓN COMPARTIDA</p><h1>Conecta la partida</h1><p className="lead">Añade la conexión de Supabase para usar una única sesión desde el móvil y verla en tiempo real en la TV.</p></section></main>;
  const [data, update] = useGameData();
  const route = location.pathname;
  if (route === "/admin/configuracion") return <Config data={data} update={update} />;
  if (route === "/admin") return <Admin data={data} update={update} />;
  return <TV data={data} update={update} />;
}

export default App;

function Brand({ dark = false }: { dark?: boolean }) { return <a className={`brand ${dark ? "brand-dark" : ""}`} href="/"><span>dos</span><i>·</i><span>cientos</span></a>; }
function OpenAdmin() { return <a className="admin-link" href="/admin">Panel de control <ExternalLink size={15} /></a>; }

function TV({ data, update }: { data: AppData; update: (next: AppData | ((state: AppData) => AppData)) => void }) {
  const [isRevealing, setIsRevealing] = useState(false);
  const revealTimer = useRef<number | null>(null);
  const game = data.minigames.find((x) => x.id === data.selectedMinigameId);
  const punishment = data.punishments.find((x) => x.id === data.selectedPunishmentId);
  const loser = teamById(data, data.losingTeamId);
  // Keep the winner visible while its wheel is finishing, even though it is
  // immediately disabled for all following rounds.
  const wheelItems = data.phase === "PUNISHMENT_WHEEL"
    ? data.punishments.filter(x => x.enabled || x.id === data.selectedPunishmentId)
    : data.minigames.filter(x => x.enabled || x.id === data.selectedMinigameId);
  const activity = data.phase === "PUNISHMENT_RESULT" ? punishment : game;
  useEffect(() => () => { if (revealTimer.current !== null) window.clearTimeout(revealTimer.current); }, []);
  useEffect(() => { if (!data.selectedMinigameId && !data.selectedPunishmentId) setIsRevealing(false); }, [data.selectedMinigameId, data.selectedPunishmentId]);
  const holdWinningOption = () => {
    setIsRevealing(true);
    revealTimer.current = window.setTimeout(() => {
      update(s => s.phase === "MINIGAME_WHEEL" ? { ...s, phase: "MINIGAME_RESULT" } : s.phase === "PUNISHMENT_WHEEL" ? { ...s, phase: "PUNISHMENT_RESULT" } : s);
      setIsRevealing(false);
    }, 5000);
  };
  return <main className="tv-shell">
    <header className="tv-header"><Brand dark /><div className="live"><span /> EN DIRECTO</div></header>
    {data.phase === "HOME" && <section className="tv-home"><p className="eyebrow">NOCHE DE JUEGOS</p><h1>{data.eventName}</h1><p className="lead">Dos equipos. Retos inesperados.<br />Una noche para recordar.</p><PairingCard /><div className="tv-teams">{data.teams.map((team, i) => <TeamCard key={team.id} team={team} number={i + 1} />)}</div><p className="tv-hint"><CircleDot size={18} /> Esperando al panel de control</p></section>}
    {(data.phase === "MINIGAME_WHEEL" || data.phase === "PUNISHMENT_WHEEL") && <section className="wheel-view"><p className="eyebrow">{data.phase === "PUNISHMENT_WHEEL" ? "EL DESTINO DECIDE" : "SIGUIENTE RETO"}</p><h1>{data.phase === "PUNISHMENT_WHEEL" ? "Ruleta de castigos" : "Ruleta de minijuegos"}</h1><SpinWheel items={wheelItems} selectedId={data.phase === "PUNISHMENT_WHEEL" ? data.selectedPunishmentId : data.selectedMinigameId} onFinished={holdWinningOption} isRevealing={isRevealing} /><p className={`tv-hint ${isRevealing ? "wheel-hint-reveal" : ""}`}><CircleDot size={18} /> {isRevealing ? "La opción ganadora se mantiene en pantalla…" : data.selectedMinigameId || data.selectedPunishmentId ? "La suerte está decidiendo…" : "Esperando el giro del panel"}</p></section>}
    {(data.phase === "MINIGAME_RESULT" || data.phase === "PUNISHMENT_RESULT") && activity && <section className="result-view">
      <h1>{activity.title}</h1>
      <p>{activity.description}</p>
    </section>}
    {(data.phase === "SELECT_LOSER" || data.phase === "LOSER_RESULT") && <section className="loser-view"><p className="eyebrow">RESULTADO DEL RETO</p><h1>{data.phase === "SELECT_LOSER" ? "¿Quién ha perdido?" : "Esta vez cae…"}</h1>{loser ? <div className="loser-reveal" style={{ borderColor: loser.color }}><span style={{ background: loser.color }}>{loser.name.slice(0, 1)}</span><strong>{loser.name}</strong><p>El destino tiene algo preparado.</p></div> : <div className="tv-teams">{data.teams.map((team, i) => <TeamCard key={team.id} team={team} number={i + 1} />)}</div>}</section>}
    <footer className="tv-footer"><span>Ronda en curso</span><span>{phases[data.phase]}</span><OpenAdmin /></footer>
  </main>;
}

function TeamCard({ team, number }: { team: AppData["teams"][number]; number: number }) { return <article className="team-card" style={{ "--team": team.color } as React.CSSProperties}><span className="team-number">0{number}</span><span className="team-dot" /><h2>{team.name}</h2><p>¡A por todas!</p></article>; }

function PairingCard() {
  const controllerUrl = `${window.location.origin}/admin`;
  return <aside className="pairing-card" aria-label="Conectar el móvil como mando"><div className="pairing-qr"><QRCodeSVG value={controllerUrl} size={118} level="M" includeMargin /></div><div className="pairing-copy"><p className="pairing-kicker"><Smartphone size={15} /> CONECTA EL MANDO</p><h2>Escanea con el móvil</h2><p>Abre la cámara, apunta al código y usa el panel para controlar esta pantalla en directo.</p><div className="pairing-steps"><span>1. Escanea</span><span>2. Abre el panel</span><span>3. Empieza</span></div></div><a className="pairing-link" href={controllerUrl} target="_blank" rel="noreferrer"><Tv size={16} /> Abrir panel</a></aside>;
}
const lightWheelPalette = ["#e7f5d6", "#fff1c9", "#d9f2ee", "#f9dfe8", "#e9e1fa", "#dceaff", "#fde6c4", "#e2f3d3", "#f5e1ce", "#dcedf6", "#f6e0f2", "#e9f0c9"];
const wheelLabels: Record<string, string> = {
  "Teléfono escacharrado": "Teléfono roto",
  "Mímica imposible": "Mímica",
  "Mímica relámpago": "Mímica flash",
  "Acaba la canción": "Sigue la canción",
  "Dos verdades y una mentira": "Dos verdades",
  "Piedra, papel o tijera mundial": "Piedra, papel, tijera",
};

function shuffledWheelPalette() {
  const palette = [...lightWheelPalette];
  for (let index = palette.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [palette[index], palette[randomIndex]] = [palette[randomIndex], palette[index]];
  }
  return palette;
}

function SpinWheel({ items, selectedId, onFinished, compact = false, isRevealing = false }: { items: Activity[]; selectedId: string | null; onFinished: () => void; compact?: boolean; isRevealing?: boolean }) {
  const [colors, setColors] = useState(shuffledWheelPalette);
  useEffect(() => {
    if (selectedId) setColors(shuffledWheelPalette());
  }, [selectedId]);
  const data = useMemo(() => items.map((item, index) => {
    const label = wheelLabels[item.title] ?? item.title;
    const fontSize = compact ? (label.length > 16 ? 8 : 9) : (label.length > 16 ? 11 : 13);
    return { option: label, style: { backgroundColor: colors[index % colors.length], textColor: "#18311d", fontSize, fontWeight: "800" } };
  }), [items, compact, colors]);
  const prizeNumber = Math.max(0, items.findIndex(item => item.id === selectedId));
  if (!items.length) return <div className="wheel-empty">No hay opciones activas</div>;
  return <div className={`roulette-wrap ${compact ? "roulette-compact" : ""} ${isRevealing ? "roulette-revealing" : ""}`} aria-label={`Ruleta con ${items.map(item => wheelLabels[item.title] ?? item.title).join(", ")}`}><RouletteWheel mustStartSpinning={Boolean(selectedId)} prizeNumber={prizeNumber} data={data} onStopSpinning={onFinished} backgroundColors={colors} textColors={["#18311d"]} outerBorderColor="#ffffff" outerBorderWidth={7} innerRadius={15} innerBorderColor="#f7fbf4" innerBorderWidth={5} radiusLineColor="#5f7860" radiusLineWidth={2} fontFamily="Onest, sans-serif" fontSize={compact ? 9 : 13} fontWeight="800" textDistance={compact ? 64 : 62} spinDuration={compact ? 0.3 : 0.6} disableInitialAnimation /></div>;
}

function Admin({ data, update }: { data: AppData; update: (next: AppData | ((state: AppData) => AppData)) => void }) {
  const [notice, setNotice] = useState("");
  const go = (phase: GamePhase) => update(s => ({ ...s, phase }));
  const spinMinigame = () => { const chosen = selectWithoutRepeats(data.minigames, data.usedMinigameIds); if (!chosen) return setNotice("Activa al menos un minijuego en configuración."); update(s => ({ ...s, selectedMinigameId: chosen.id, minigames: s.minigames.map(x => x.id === chosen.id ? { ...x, enabled: false } : x), usedMinigameIds: [...s.usedMinigameIds, chosen.id] })); setNotice("Girando la ruleta…"); };
  const spinPunishment = () => { const chosen = selectWithoutRepeats(data.punishments, data.usedPunishmentIds); if (!chosen) return setNotice("Activa al menos un castigo en configuración."); update(s => ({ ...s, selectedPunishmentId: chosen.id, punishments: s.punishments.map(x => x.id === chosen.id ? { ...x, enabled: false } : x), usedPunishmentIds: [...s.usedPunishmentIds, chosen.id] })); setNotice("Girando la ruleta…"); };
  const loser = teamById(data, data.losingTeamId);
  const reset = (home = false) => update(s => ({ ...s, phase: home ? "HOME" : "MINIGAME_WHEEL", selectedMinigameId: null, selectedPunishmentId: null, losingTeamId: null }));
  return <main className="admin-shell"><header className="admin-header"><Brand /><div className="admin-session"><span /> TV conectada</div><a href="/admin/configuracion" className="icon-button" aria-label="Configuración"><Settings size={20} /></a></header><section className="admin-content"><div className="admin-kicker"><span>CONTROL DE PARTIDA</span><a href="/" target="_blank">Ver televisión <ExternalLink size={14} /></a></div><h1>{phases[data.phase]}</h1><p className="admin-description">{adminCopy(data.phase, data, loser?.name)}</p>{notice && <div className="notice" role="status"><Check size={17} />{notice}<button onClick={() => setNotice("")} aria-label="Cerrar"><X size={16} /></button></div>}
    <div className="stepper">{["Reto", "Perdedor", "Castigo"].map((label, i) => <div className={stepClass(data.phase, i)} key={label}><span>{i + 1}</span>{label}</div>)}</div>
    <div className="admin-card">
      {data.phase === "HOME" && <><Gamepad2 className="card-icon" /><h2>¿Listos para empezar?</h2><p>La TV mostrará la ruleta de minijuegos.</p><button className="primary-button" onClick={() => update(s => ({ ...s, phase: "MINIGAME_WHEEL", selectedMinigameId: null, selectedPunishmentId: null, losingTeamId: null }))}>Empezar ronda <ChevronRight size={19} /></button></>}
      {data.phase === "MINIGAME_WHEEL" && <><SpinWheel compact items={data.minigames.filter(x => x.enabled || x.id === data.selectedMinigameId)} selectedId={data.selectedMinigameId} onFinished={() => undefined} /><button className="primary-button" disabled={Boolean(data.selectedMinigameId)} onClick={spinMinigame}>{data.selectedMinigameId ? "Girando…" : "Girar ruleta"} <RotateCcw size={19} /></button>{!data.selectedMinigameId && <button className="text-button" onClick={() => go("SELECT_LOSER")}>Saltar minijuego</button>}<button className="text-button" onClick={() => go("HOME")}>Volver al inicio</button></>}
      {data.phase === "MINIGAME_RESULT" && <ActionCard label={data.minigames.find(x => x.id === data.selectedMinigameId)?.title ?? "Minijuego"} image={data.minigames.find(x => x.id === data.selectedMinigameId)?.imageUrl} button="Seleccionar perdedor" onClick={() => go("SELECT_LOSER")} />}
      {data.phase === "SELECT_LOSER" && <><h2>Elige el equipo perdedor</h2><div className="loser-buttons">{data.teams.map(t => <button key={t.id} onClick={() => update(s => ({ ...s, losingTeamId: t.id, phase: "LOSER_RESULT" }))} style={{ "--team": t.color } as React.CSSProperties}><span style={{ background: t.color }}>{t.name.slice(0, 1)}</span>Ha perdido {t.name}</button>)}</div></>}
      {data.phase === "LOSER_RESULT" && loser && <><div className="picked-loser" style={{ borderColor: loser.color }}><span style={{ background: loser.color }}>{loser.name.slice(0, 1)}</span><h2>{loser.name}</h2><p>El castigo está esperando.</p></div><button className="primary-button" onClick={() => go("PUNISHMENT_WHEEL")}>Ir a la ruleta <ChevronRight size={19} /></button><button className="text-button" onClick={() => reset()}>Saltar castigo</button></>}
      {data.phase === "PUNISHMENT_WHEEL" && <><SpinWheel compact items={data.punishments.filter(x => x.enabled || x.id === data.selectedPunishmentId)} selectedId={data.selectedPunishmentId} onFinished={() => undefined} /><button className="primary-button" disabled={Boolean(data.selectedPunishmentId)} onClick={spinPunishment}>{data.selectedPunishmentId ? "Girando…" : "Girar ruleta"} <RotateCcw size={19} /></button></>}
      {data.phase === "PUNISHMENT_RESULT" && <ActionCard label={data.punishments.find(x => x.id === data.selectedPunishmentId)?.title ?? "Castigo"} image={data.punishments.find(x => x.id === data.selectedPunishmentId)?.imageUrl} button="Nueva ronda" onClick={() => reset()} />}
    </div><button className="reset-button" onClick={() => reset(true)}><Home size={16} /> Reiniciar al inicio</button>
  </section></main>;
}

function adminCopy(phase: GamePhase, data: AppData, loser?: string) { const game = data.minigames.find(x => x.id === data.selectedMinigameId); if (phase === "MINIGAME_RESULT") return `El reto seleccionado es “${game?.title}”. Cuando terminéis, marca quién ha perdido.`; if (phase === "LOSER_RESULT") return `${loser} ha perdido. Es hora de dejar que la suerte elija.`; return { HOME: "Inicia una ronda cuando todos estén preparados.", MINIGAME_WHEEL: "Gira la ruleta para descubrir el próximo reto.", SELECT_LOSER: "Elige el equipo que ha perdido el minijuego.", PUNISHMENT_WHEEL: "Un último giro para decidir el castigo.", PUNISHMENT_RESULT: "El castigo está listo. ¡Que se cumpla!" }[phase] || ""; }
function stepClass(phase: GamePhase, index: number) { const value = phase === "HOME" ? -1 : ["MINIGAME_WHEEL", "MINIGAME_RESULT"].includes(phase) ? 0 : ["SELECT_LOSER", "LOSER_RESULT"].includes(phase) ? 1 : 2; return index < value ? "complete" : index === value ? "active" : ""; }
function ActionCard({ label, image, button, onClick }: { label: string; image?: string; button: string; onClick: () => void }) { return <><div className="selection-card">{image && <img src={image} alt="" />}<div><span>SELECCIONADO</span><h2>{label}</h2></div></div><button className="primary-button" onClick={onClick}>{button} <ChevronRight size={19} /></button></>; }

function Config({ data, update }: { data: AppData; update: (next: AppData | ((state: AppData) => AppData)) => void }) {
  const [tab, setTab] = useState<"general" | "minigames" | "punishments">("general");
  const [editing, setEditing] = useState<{ type: "minigames" | "punishments"; item?: Activity } | null>(null);
  const [draft, setDraft] = useState(data);
  const [saved, setSaved] = useState(false);
  const commit = () => { update(draft); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const setTeam = (index: number, key: "name" | "color", value: string) => setDraft(d => ({ ...d, teams: d.teams.map((t, i) => i === index ? { ...t, [key]: value } : t) as AppData["teams"] }));
  const list = tab === "minigames" ? draft.minigames : draft.punishments;
  const toggle = (id: string) => { const key = tab as "minigames" | "punishments"; setDraft(d => ({ ...d, [key]: d[key].map(x => x.id === id ? { ...x, enabled: !x.enabled } : x) })); };
  const remove = (id: string) => { const key = tab as "minigames" | "punishments"; if (confirm("¿Eliminar este elemento?")) setDraft(d => ({ ...d, [key]: d[key].filter(x => x.id !== id) })); };
  return <main className="config-shell"><header className="config-header"><a className="back-link" href="/admin"><ArrowLeft size={19} /> Panel</a><Brand /><button className="save-button" onClick={commit}>{saved ? <><Check size={17} /> Guardado</> : "Guardar cambios"}</button></header><section className="config-content"><div className="config-title"><p className="eyebrow">CONFIGURACIÓN</p><h1>Prepara la fiesta</h1><p>Personaliza los equipos, los retos y los castigos de la noche.</p></div><nav className="tabs" aria-label="Secciones de configuración"><button className={tab === "general" ? "selected" : ""} onClick={() => setTab("general")}>General</button><button className={tab === "minigames" ? "selected" : ""} onClick={() => setTab("minigames")}>Minijuegos <span>{draft.minigames.length}</span></button><button className={tab === "punishments" ? "selected" : ""} onClick={() => setTab("punishments")}>Castigos <span>{draft.punishments.length}</span></button></nav>
    {tab === "general" && <div className="config-panel"><section><label className="field-label" htmlFor="eventName">Nombre del evento</label><input id="eventName" className="text-input" value={draft.eventName} onChange={e => setDraft({ ...draft, eventName: e.target.value })} /></section><section className="team-settings"><div className="section-heading"><h2>Los equipos</h2><p>Siempre habrá dos equipos en la partida.</p></div>{draft.teams.map((team, i) => <div className="team-setting" key={team.id}><div className="color-swatch" style={{ background: team.color }} /><div className="field-grow"><label htmlFor={`team-${i}`}>Equipo {i + 1}</label><input id={`team-${i}`} className="text-input" value={team.name} onChange={e => setTeam(i, "name", e.target.value)} /></div><div><label htmlFor={`color-${i}`}>Color</label><input id={`color-${i}`} className="color-input" type="color" value={team.color} onChange={e => setTeam(i, "color", e.target.value)} /></div></div>)}</section></div>}
    {tab !== "general" && <div className="content-list"><div className="list-header"><div><h2>{tab === "minigames" ? "Minijuegos" : "Castigos"}</h2><p>Activa solo las opciones que quieras que salgan en la ruleta.</p></div><button className="outline-button" onClick={() => setEditing({ type: tab })}><Plus size={18} /> Añadir</button></div>{list.length === 0 ? <div className="empty-state"><PartyPopper size={28} /><p>Aún no hay elementos. Añade el primero.</p></div> : list.map(item => <article className="content-row" key={item.id}><img src={item.imageUrl} alt="" /><div className="row-copy"><h3>{item.title}</h3><p>{item.description}</p></div><label className="switch" aria-label={`Activar ${item.title}`}><input type="checkbox" checked={item.enabled} onChange={() => toggle(item.id)} /><span /></label><button className="row-icon" onClick={() => setEditing({ type: tab, item })} aria-label={`Editar ${item.title}`}><Pencil size={17} /></button><button className="row-icon danger" onClick={() => remove(item.id)} aria-label={`Eliminar ${item.title}`}><Trash2 size={17} /></button></article>)}</div>}
  </section>{editing && <Editor modal={editing} onClose={() => setEditing(null)} onSave={(activity) => { const key = editing.type; setDraft(d => ({ ...d, [key]: editing.item ? d[key].map(x => x.id === activity.id ? activity : x) : [...d[key], activity] })); setEditing(null); }} />}</main>;
}

function Editor({ modal, onClose, onSave }: { modal: { type: "minigames" | "punishments"; item?: Activity }; onClose: () => void; onSave: (activity: Activity) => void }) {
  const [item, setItem] = useState<Activity>(modal.item ?? { id: crypto.randomUUID(), title: "", description: "", imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85", enabled: true });
  const change = (key: keyof Activity, value: string | boolean) => setItem({ ...item, [key]: value });
  return <div className="modal-backdrop" role="presentation"><form className="editor" onSubmit={e => { e.preventDefault(); if (item.title.trim() && item.description.trim()) onSave(item); }}><button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar"><X size={20} /></button><p className="eyebrow">{modal.item ? "EDITAR" : "NUEVO"} {modal.type === "minigames" ? "MINIJUEGO" : "CASTIGO"}</p><h2>{modal.item ? "Ajusta los detalles" : "Añade una opción"}</h2><label>Título<input autoFocus className="text-input" value={item.title} onChange={e => change("title", e.target.value)} required /></label><label>Descripción<textarea value={item.description} onChange={e => change("description", e.target.value)} required /></label><label>URL de imagen<input className="text-input" type="url" value={item.imageUrl} onChange={e => change("imageUrl", e.target.value)} required /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">Guardar</button></div></form></div>;
}
