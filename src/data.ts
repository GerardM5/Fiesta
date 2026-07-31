import type { Activity, AppData, TeamId } from "./types";

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;

export const initialData: AppData = {
  eventName: "La gran fiesta",
  teams: [
    { id: "team_1", name: "Equipo coral", color: "#ff6b5f" },
    { id: "team_2", name: "Equipo azul", color: "#4c86e8" },
  ],
  minigames: [
    { id: "palabra-espalda", title: "Palabra en la espalda", description: "Pegad una palabra en la espalda de cada rival. Gana quien diga en voz alta la palabra del otro; se vale mover al rival para verla.", imageUrl: image("photo-1517245386807-bb43f82c33c4"), enabled: true },
    { id: "maletin", title: "El maletín", description: "Cada jugador recibe un maletín con premio o vacío. Convenced a los demás para que se queden con vuestro maletín… o no.", imageUrl: image("photo-1512418490979-92798cec1380"), enabled: true },
    { id: "palabra-trampa", title: "La palabra trampa", description: "Por turnos, haced preguntas para lograr que el rival pronuncie vuestra palabra. Si adivina cuál es y la dice, perdéis.", imageUrl: image("photo-1456324504439-367cee3b3c32"), enabled: true },
    { id: "sillas-musicales-cartas", title: "Sillas musicales con cartas", description: "Dad vueltas alrededor de la mesa. Cuando pare la música, coged una carta: quien se quede sin ella pierde.", imageUrl: image("photo-1511193311914-0346f16efe90"), enabled: true },
    { id: "escalera-de-botes", title: "Escalera de botes", description: "En el tiempo marcado, encestad botes en un vaso: primero uno, después dos, luego tres… Gana quien llegue más lejos.", imageUrl: image("photo-1513558161293-cdaf765ed2fd"), enabled: true },
    { id: "tres-en-raya-encestado", title: "Tres en raya encestando", description: "Por equipos, encestad pelotas de vuestro color en los 9 vasos para completar tres en raya.", imageUrl: image("photo-1518604666860-9ed391f76460"), enabled: true },
    { id: "medusa", title: "La medusa", description: "Todos miran al suelo. A la señal, mirad a alguien: si os miráis mutuamente, los dos quedáis eliminados. Gana la última persona.", imageUrl: image("photo-1527529482837-4698179dc6ce"), enabled: true },
    { id: "cronometro-a-ciegas", title: "Cronómetro a ciegas", description: "Iniciad un cronómetro y paradlo sin mirar lo más cerca posible del tiempo objetivo.", imageUrl: image("photo-1501139083538-0139583c060f"), enabled: true },
    { id: "contar-hasta-20", title: "Contar hasta 20", description: "Contad hasta 20 sin establecer turnos. Si dos personas hablan a la vez, empezad de nuevo. Tenéis un tiempo límite.", imageUrl: image("photo-1529156069898-49953e39b3ac"), enabled: true },
  ],
  punishments: [
    { id: "chupitos", title: "Dos chupitos", description: "El equipo debe repartir dos chupitos entre sus integrantes.", imageUrl: image("photo-1513558161293-cdaf765ed2fd"), enabled: true },
    { id: "cancion", title: "Canción a coro", description: "Elegid una canción y cantad el estribillo con toda la energía.", imageUrl: image("photo-1493225457124-a3eb161ffa5f"), enabled: true },
    { id: "pasarela", title: "Pasarela relámpago", description: "Desfilad hasta el centro de la sala con vuestra mejor actitud.", imageUrl: image("photo-1515886657613-9f3515b0c78f"), enabled: true },
  ],
  phase: "HOME", selectedMinigameId: null, selectedPunishmentId: null, losingTeamId: null, usedMinigameIds: [], usedPunishmentIds: [],
};

// A new storage version resets the previously deployed game catalogue on every device.
const KEY = "doscientos-fiesta-state-v2";
const LEGACY_KEY = "doscientos-fiesta-state";
export const readData = (): AppData => {
  try {
    localStorage.removeItem(LEGACY_KEY);
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!saved) return initialData;
    const savedMinigames = Array.isArray(saved.minigames) ? saved.minigames : [];
    const missingMinigames = initialData.minigames.filter((game) => !savedMinigames.some((savedGame: Activity) => savedGame.id === game.id));
    return { ...initialData, ...saved, minigames: [...savedMinigames, ...missingMinigames] };
  }
  catch { return initialData; }
};
export const saveData = (data: AppData) => localStorage.setItem(KEY, JSON.stringify(data));

export const selectWithoutRepeats = (items: Activity[], used: string[]) => {
  const active = items.filter((item) => item.enabled);
  const available = active.filter((item) => !used.includes(item.id));
  const choices = available.length ? available : active;
  return choices[Math.floor(Math.random() * choices.length)] ?? null;
};

export const teamById = (data: AppData, id: TeamId | null) => data.teams.find((team) => team.id === id) ?? null;
