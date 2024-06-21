export interface ErrorResponse {
  // problem details
  title: string;
  status: number;
  instance: string;
  detail: string;
  traceId: string;
  errorCode?: string;
  errors?: any[];
}
