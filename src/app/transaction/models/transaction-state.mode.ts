import { StatusType } from '../../core/constants/status-type';
import { TransactionActionType } from '../constants/transaction-action-type';
import { TransactionResponse } from './transaction-response.mode';

export interface TransactionState {
  status: StatusType;
  errors?: string[];
  transactions: TransactionResponse[];
  selectedTransaction?: TransactionResponse;
  dateRange?: {
    start: Date;
    end: Date;
  };
  action?: TransactionActionType;

  editMode?: 'create' | 'update';
}
