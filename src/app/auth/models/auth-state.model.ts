import { StatusType } from '../../core/constants/status-type';

export interface AuthState {
  status: StatusType;
  errors?: string[];
  user?: any;
  token?: string | null;
}
