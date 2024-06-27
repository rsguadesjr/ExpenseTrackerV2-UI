export interface AccountRequest {
  id?: string | null;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
}
