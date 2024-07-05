import { TransactionResponse } from '../../transaction/models/transaction-response.mode';

export interface DailyTransaction {
  date: Date;
  totalAmount: number;
  transactions: TransactionResponse[];
}
