export interface TransactionResponse {
  id: string;
  amount: number;
  description: string;
  category: {
    id: string;
    value: string;
  };
  transactionDate: string;
  createdDate: string;
  modifiedDate: string;
  accountId: string;
  tags: string[];
}
