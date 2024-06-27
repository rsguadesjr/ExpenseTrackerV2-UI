export interface CategoryRequest {
  id?: string | null;
  name: string;
  isActive: boolean;
  order?: number;
}
