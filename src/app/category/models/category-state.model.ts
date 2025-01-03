import { StatusType } from '../../core/constants/status-type';
import { CategoryActionType } from '../constants/category-action-.type';
import { CategoryResponse } from './category-response.model';

export interface CategoryState {
  status: StatusType;
  errors?: string[];
  categories: CategoryResponse[];
  selectedCategory?: CategoryResponse | null;

  // used for editing
  editMode?: 'create' | 'update';

  action?: CategoryActionType;
}
