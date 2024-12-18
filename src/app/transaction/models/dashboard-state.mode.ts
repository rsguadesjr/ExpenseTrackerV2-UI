import { AccountResponse } from '../../account/models/account-response.model';
import { TransactionResponse } from '../../transaction/models/transaction-response.mode';
import { CategoryTransactionPercentage } from './category-transaction-percentage.mode';
import { DailyTransaction } from './daily-transaction-model';

export interface DashboardState {
  account: AccountResponse | null;

  // // flag if account's dashboard data has already been generated
  // accountDataInitialized: boolean;

  // the current account's data
  transactions: TransactionResponse[];
  // recentTransactions: TransactionResponse[];

  // the total amount of all transactions
  // totalAmount: number;

  // the date range of the transactions
  dateRange: {
    start: Date;
    end: Date;
  } | null;

  // // transactions grouped into each day of the date range
  // dailyTransactions: DailyTransaction[];

  // // highest daily transaction, get value from dailyTransactions property
  // highestDailyTransaction?: DailyTransaction;

  // // transactions grouped into each category
  // categorizedTransactions: CategoryTransactionPercentage[];

  // // highest categorized transaction, get value from categorizedTransactions property
  // highestCategorizedTransaction: CategoryTransactionPercentage;
}
