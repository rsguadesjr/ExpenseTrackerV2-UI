export interface AuthState {
  status: 'pending' | 'loading' | 'success' | 'error';
  errors?: string[];
  user?: any;
  token?: string;
}
