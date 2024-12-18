import { StatusType } from '../../core/constants/status-type';
import { TransactionActionType } from '../constants/transaction-action-type';
import { FilterTrasactionQuery } from './filter-transaction-query.model';
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
  filter: FilterTrasactionQuery;

  // for dashboard??
  dashboard: {
    isInitialized: boolean;
    transactions: TransactionResponse[];
    filter: FilterTrasactionQuery;
  };
}
