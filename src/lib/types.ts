export type Phase = "lobby" | "guessing" | "reveal";

export type Player = {
  id: string;
  name: string;
  score: number;
  guess: number | null;
};

export type Round = {
  index: number;
  prompt: string;
  decision: "yes" | "no";
  confidence: number;
  reasoning: string;
  source: "openai" | "mock";
};

export type Room = {
  code: string;
  hostId: string;
  phase: Phase;
  players: Player[];
  round: Round | null;
  createdAt: number;
  usedPromptIndexes: number[];
};

/** Public room view — hides confidence/reasoning until reveal. */
export type PublicRoom = {
  code: string;
  hostId: string;
  phase: Phase;
  players: Array<{
    id: string;
    name: string;
    score: number;
    hasGuessed: boolean;
    guess: number | null;
  }>;
  round: {
    index: number;
    prompt: string;
    decision: "yes" | "no" | null;
    confidence: number | null;
    reasoning: string | null;
    source: "openai" | "mock";
  } | null;
  results: Array<{
    id: string;
    name: string;
    guess: number;
    distance: number;
    winner: boolean;
  }> | null;
};
