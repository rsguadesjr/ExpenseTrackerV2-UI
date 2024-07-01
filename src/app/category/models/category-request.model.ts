export interface CategoryRequest {
  id?: string | null;
  name: string;
  description?: string;
  isActive: boolean;
  order?: number;
}
