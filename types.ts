
export interface WishResponse {
  sentiment: string;
  glowColor: string;
  message: string;
  ornamentType: 'star' | 'heart' | 'crystal' | 'sphere';
}

export enum AppState {
  LOADING = 'LOADING',
  IDLE = 'IDLE',
  WISHING = 'WISHING',
  CELEBRATING = 'CELEBRATING'
}
