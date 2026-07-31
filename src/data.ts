import type { Activity, AppData, TeamId } from "./types";

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;

export const initialData: AppData = {
  eventName: "La gran fiesta",
  teams: [
    { id: "team_1", name: "Equipo coral", color: "#ff6b5f" },
    { id: "team_2", name: "Equipo azul", color: "#4c86e8" },
  ],
  minigames: [
    { id: "torre-vasos", title: "Torre de vasos", description: "Construid la torre más alta con los vasos que encontréis. La torre más baja pierde.", imageUrl: image("photo-1521886655570-97530a8d5dfc"), enabled: true },
    { id: "telefono-escacharrado", title: "Teléfono escacharrado", description: "El último jugador deberá decir la frase que ha viajado por todo el equipo.", imageUrl: image("photo-1529156069898-49953e39b3ac"), enabled: true },
    { id: "relevo-baile", title: "Relevo de baile", description: "Cada integrante añade un paso. El equipo que se equivoque primero pierde.", imageUrl: image("photo-1514525253161-7a46d19cd819"), enabled: true },
    { id: "mimica", title: "Mímica imposible", description: "Adivinad el mayor número de palabras sin hablar antes de que el otro equipo termine.", imageUrl: image("photo-1506157786151-b8491531f063"), enabled: true },
    { id: "categorias", title: "Categorías", description: "Elegid una categoría. Por turnos, cada equipo dice un elemento: tenéis 3 segundos y no se puede repetir.", imageUrl: image("photo-1529156069898-49953e39b3ac"), enabled: true },
    { id: "ultima-letra", title: "Última letra", description: "Decid una palabra. El otro equipo responde con otra que empiece por la última letra de la anterior.", imageUrl: image("photo-1499750310107-5fef28a66643"), enabled: true },
    { id: "mimica-relampago", title: "Mímica relámpago", description: "Tenéis 30 segundos para representar una película, famoso o profesión. Cada acierto cuenta.", imageUrl: image("photo-1506157786151-b8491531f063"), enabled: true },
    { id: "acaba-cancion", title: "Acaba la canción", description: "Pon 5 segundos de una canción. El primero que continúe correctamente la letra gana.", imageUrl: image("photo-1493225457124-a3eb161ffa5f"), enabled: true },
    { id: "dos-verdades", title: "Dos verdades y una mentira", description: "Cada jugador dice tres afirmaciones. El otro equipo debe descubrir cuál de ellas es falsa.", imageUrl: image("photo-1511988617509-a57c8a288659"), enabled: true },
    { id: "piedra-papel-tijera", title: "Piedra, papel o tijera mundial", description: "Todos juegan a la vez. Quien pierde anima al ganador hasta que quede un campeón por equipo.", imageUrl: image("photo-1517245386807-bb43f82c33c4"), enabled: true },
    { id: "carta-misteriosa", title: "Carta misteriosa", description: "Cada equipo saca una carta: la más alta gana. Si hay empate, jugad una segunda carta.", imageUrl: image("photo-1511193311914-0346f16efe90"), enabled: true },
    { id: "moneda-al-vaso", title: "Moneda al vaso", description: "Cada jugador tiene un intento para meter una moneda en un vaso desde cierta distancia.", imageUrl: image("photo-1513267048331-5611cad62e41"), enabled: true },
  ],
  punishments: [
    { id: "chupitos", title: "Dos chupitos", description: "El equipo debe repartir dos chupitos entre sus integrantes.", imageUrl: image("photo-1513558161293-cdaf765ed2fd"), enabled: true },
    { id: "cancion", title: "Canción a coro", description: "Elegid una canción y cantad el estribillo con toda la energía.", imageUrl: image("photo-1493225457124-a3eb161ffa5f"), enabled: true },
    { id: "pasarela", title: "Pasarela relámpago", description: "Desfilad hasta el centro de la sala con vuestra mejor actitud.", imageUrl: image("photo-1515886657613-9f3515b0c78f"), enabled: true },
  ],
  phase: "HOME", selectedMinigameId: null, selectedPunishmentId: null, losingTeamId: null, usedMinigameIds: [], usedPunishmentIds: [],
};

const KEY = "doscientos-fiesta-state";
export const readData = (): AppData => {
  try {
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
