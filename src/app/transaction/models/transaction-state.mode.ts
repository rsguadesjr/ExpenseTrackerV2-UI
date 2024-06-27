import { StatusType } from '../../core/constants/status-type';
import { TransactionResponse } from './transaction-response.mode';

export interface TransactionState {
  status: StatusType;
  errors?: string[];
  transactions: TransactionResponse[];
  selectedTransaction?: TransactionResponse;

  editMode?: 'create' | 'update';
}
