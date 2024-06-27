export interface TransactionRequest {
  id?: string | null;
  amount: number;
  description: string;
  categoryId: string;
  transactionDate: string;
  accountId: string;
  tags: string[];
}
