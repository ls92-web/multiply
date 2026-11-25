import { CharacterId } from "./types";

export interface CharacterInfo {
  id: CharacterId;
  label: string;
}

export const CHARACTERS: CharacterInfo[] = [
  { id: "boy-short", label: "Short hair" },
  { id: "boy-curly", label: "Curly hair" },
  { id: "boy-spiky", label: "Spiky hair" },
  { id: "girl-ponytail", label: "Ponytail" },
  { id: "girl-pigtails", label: "Pigtails" },
  { id: "girl-long", label: "Long hair" },
];
