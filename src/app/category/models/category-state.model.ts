import { StatusType } from '../../core/constants/status-type';
import { CategoryResponse } from './category-response.model';

export interface CategoryState {
  status: StatusType;
  errors?: string[];
  categories: CategoryResponse[];
  selectedCategory?: CategoryResponse | null;
}
