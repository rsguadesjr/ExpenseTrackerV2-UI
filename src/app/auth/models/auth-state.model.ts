export interface AuthState {
  status: 'idle' | 'loading' | 'success' | 'error';
  errors?: string[];
  user?: any;
  token?: string | null;
}
