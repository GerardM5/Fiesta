export type TeamId = "team_1" | "team_2";
export type GamePhase =
  | "HOME"
  | "MINIGAME_WHEEL"
  | "MINIGAME_RESULT"
  | "SELECT_LOSER"
  | "LOSER_RESULT"
  | "PUNISHMENT_WHEEL"
  | "PUNISHMENT_RESULT";

export interface Team { id: TeamId; name: string; color: string }
export interface Activity {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  enabled: boolean;
}
export interface AppData {
  eventName: string;
  teams: [Team, Team];
  minigames: Activity[];
  punishments: Activity[];
  phase: GamePhase;
  selectedMinigameId: string | null;
  selectedPunishmentId: string | null;
  losingTeamId: TeamId | null;
  usedMinigameIds: string[];
  usedPunishmentIds: string[];
}
