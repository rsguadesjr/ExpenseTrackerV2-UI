import { StatusType } from '../../core/constants/status-type';
import { TransactionActionType } from '../constants/transaction-action-type';
import { TransactionResponse } from './transaction-response.mode';

export interface TransactionState {
  status: StatusType;
  errors: string[];
  transactions: TransactionResponse[];
  selectedTransaction: TransactionResponse | null;
  dateRange: {
    start: Date;
    end: Date;
  };
  action: TransactionActionType | null;
  editMode: 'create' | 'update' | null;

  // TODO: this is temporary for now
  filter: {
    year: number;
    month: number;
    timezoneOffset: number;
    accountId: string | undefined;
  };

  // for dashboard??
  dashboard: {
    isInitialized: boolean;
    transactions: TransactionResponse[];
    filter: {
      year: number;
      month: number;
      timezoneOffset: number;
      accountId: string | undefined;
    };
  };
  // dashboardFilter: {
  //   year: number;
  //   month: number;
  //   timezoneOffset: number;
  //   accountId: string | undefined;
  // };
  // dashboardTransactions: TransactionResponse[] | undefined;
}
