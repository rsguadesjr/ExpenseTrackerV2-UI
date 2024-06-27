export interface TransactionRequest {
  id?: string;
  amount: number;
  description: string;
  categoryId: string;
  transactionDate: string;
  accountId: string;
  tags: string[];
}
