import { StatusType } from '../../core/constants/status-type';
import { AccountResponse } from './account-response.model';

export interface AccountState {
  status: StatusType;
  errors?: string[];
  accounts: AccountResponse[];
  // selectedAccount will be the one to be used for editing
  selectedAccount?: AccountResponse | null;

  // currentAccount will be the one to be used for fetching transactions
  currentAccount: AccountResponse | null;
}
