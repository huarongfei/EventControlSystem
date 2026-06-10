export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  logoUrl?: string;  /* 后端 logo 字段的表单别名 */
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
