import { StatusType } from '../../core/constants/status-type';
import { AccountActionType } from '../constants/account-action-type';
import { AccountResponse } from './account-response.model';

export interface AccountState {
  status: StatusType;
  errors?: string[];
  accounts: AccountResponse[];
  // selectedAccount will be the one to be used for editing
  selectedAccount?: AccountResponse | null;

  // currentAccount will be the one to be used for fetching transactions
  currentAccount: AccountResponse | null;

  // used for editing account
  editMode?: 'create' | 'update' | null;

  action?: AccountActionType;
}
