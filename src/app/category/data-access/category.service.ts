import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, take } from 'rxjs';
import { StatusType } from '../../core/constants/status-type';
import { CategoryState } from '../models/category-state.model';
import { CategoryResponse } from '../models/category-response.model';
import { CategoryRequest } from '../models/category-request.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);
  private baseUrl = environment.API_BASE_URL + 'api/categories';

  private _state$ = new BehaviorSubject<CategoryState>({
    status: StatusType.Idle,
    categories: [],
  });

  state$ = this._state$.asObservable();
  get stateValue() {
    return this._state$.value;
  }

  resetState() {
    this._state$.next({
      status: StatusType.Idle,
      categories: [],
    });
  }

  loadCategories() {
    this.updateStatus(StatusType.Loading);
    this.http
      .get<CategoryResponse[]>(this.baseUrl)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Success,
            categories: response,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  loadCategoryById(id: string) {
    this.updateStatus(StatusType.Loading);
    this.http
      .get<CategoryResponse>(`${this.baseUrl}/${id}`)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const state = this._state$.value;
          const index = state.categories.findIndex((x) => x.id === response.id);
          state.categories[index] = response;
          this._state$.next({
            ...state,
            status: StatusType.Success,
            selectedCategory: response,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  createCategory(category: CategoryRequest) {
    this.updateStatus(StatusType.Loading);
    this.http
      .post<CategoryResponse>(this.baseUrl, category)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Success,
            categories: [...this._state$.value.categories, response],
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  updateCategory(category: CategoryRequest) {
    this.updateStatus(StatusType.Loading);
    this.http
      .put<CategoryResponse>(`${this.baseUrl}/${category.id}`, category)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const state = this._state$.value;
          const index = state.categories.findIndex((x) => x.id === response.id);
          state.categories[index] = response;
          this._state$.next({
            ...state,
            status: StatusType.Success,
            selectedCategory: response,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  deleteCategory(id: string) {
    this.updateStatus(StatusType.Loading);
    this.http
      .delete<CategoryResponse>(this.baseUrl + '/' + id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          const state = this._state$.value;
          const categories = state.categories.filter((x) => x.id !== id);
          this._state$.next({
            ...state,
            categories,
            status: StatusType.Success,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  sortCategories(sortedCategories: { id: string; order: number }[]) {
    this.updateStatus(StatusType.Loading);
    this.http
      .post(this.baseUrl + '/sorted-categories', sortedCategories)
      .pipe(take(1))
      .subscribe({
        next: () => {
          const state = this._state$.value;
          // update the order of the sorted categories
          const categories = state.categories.map((x) => {
            const sortedCategory = sortedCategories.find((y) => y.id === x.id);
            if (sortedCategory) {
              return {
                ...x,
                order: sortedCategory.order,
              };
            }
            return x;
          });
          this._state$.next({
            ...this._state$.value,
            categories,
            status: StatusType.Success,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  setCategoryForEdit(
    editMode: 'create' | 'update',
    category: CategoryResponse | null
  ) {
    this._state$.next({
      ...this._state$.value,
      editMode,
      selectedCategory: category,
    });
  }

  private updateStatus(status: StatusType, errors: string[] = []) {
    this._state$.next({
      ...this._state$.value,
      status,
      errors,
    });
  }
}
