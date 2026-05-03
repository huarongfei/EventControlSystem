export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  players?: Player[];
  createdAt?: string;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number?: number;
  position?: string;
  createdAt?: string;
}
