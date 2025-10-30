export type InitResponse = {
  type: "init";
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: "increment";
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: "decrement";
  postId: string;
  count: number;
};

export type CommunityData = {
  id: string;
  name: string;
  displayName: string;
  memberCount: number;
  thoughtEnergy: number;
  evolutionStage: number;
  position: { x: number; y: number; z: number };
};

export type GameStateResponse = {
  type: "gameState";
  postId: string;
  communities: CommunityData[];
  totalEnergy: number;
  battleActive: boolean;
};

export type ContributeRequest = {
  planetId: string;
  energy: number;
  challengeType?: string;
};

export type ContributeResponse = {
  type: "contribute";
  postId: string;
  planetId: string;
  newEnergy: number;
  evolutionStage: number;
  success: boolean;
};
