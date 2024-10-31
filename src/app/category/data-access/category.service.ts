import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, take } from 'rxjs';
import { StatusType } from '../../core/constants/status-type';
import { CategoryState } from '../models/category-state.model';
import { CategoryResponse } from '../models/category-response.model';
import { CategoryRequest } from '../models/category-request.model';
import { parseError } from '../../core/helpers/error-helper';
import { HttpClientService } from '../../core/services/http-client.service';
import { CategoryActionType } from '../constants/category-action-.type';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClientService);
  private baseUrl = environment.API_BASE_URL + 'api/categories';

  // private _state$ = new BehaviorSubject<CategoryState>({
  //   status: StatusType.Idle,
  //   categories: [],
  // });

  // state$ = this._state$.asObservable();
  // get stateValue() {
  //   return this._state$.value;
  // }

  private _state = signal<CategoryState>({
    status: StatusType.Idle,
    categories: [],
  });

  categories = computed(() => this._state().categories);
  selectedCategory = computed(() => this._state().selectedCategory);
  status = computed(() => this._state().status);
  errors = computed(() => this._state().errors ?? []);
  isEditMode = computed(() => this._state().editMode === 'update');

  resetState() {
    this._state.set({
      status: StatusType.Idle,
      categories: [],
    });
  }

  loadCategories(skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    this.http
      .get<CategoryResponse[]>(
        this.baseUrl,
        {},
        (skipGlobalErrorHandling = false)
      )
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this._state.update((state) => ({
            ...state,
            status: StatusType.Success,
            categories: response,
            action: CategoryActionType.LoadAll,
            errors: [],
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
          console.error(error);
        },
      });
  }

  loadCategoryById(id: string, skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    this.http
      .get<CategoryResponse>(
        `${this.baseUrl}/${id}`,
        {},
        skipGlobalErrorHandling
      )
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this._state.update((state) => {
            const index = state.categories.findIndex(
              (x) => x.id === response.id
            );
            state.categories[index] = response;
            return {
              ...state,
              status: StatusType.Success,
              selectedCategory: response,
              action: CategoryActionType.LoadById,
              errors: [],
            };
          });
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
          console.error(error);
        },
      });
  }

  createCategory(category: CategoryRequest, skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    this.http
      .post<CategoryResponse>(this.baseUrl, category, skipGlobalErrorHandling)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this._state.update((state) => ({
            ...state,
            status: StatusType.Success,
            categories: [...state.categories, response],
            action: CategoryActionType.Create,
            errors: [],
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
          console.error(error);
        },
      });
  }

  updateCategory(category: CategoryRequest, skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    this.http
      .put<CategoryResponse>(
        `${this.baseUrl}/${category.id}`,
        category,
        skipGlobalErrorHandling
      )
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this._state.update((state) => {
            const index = state.categories.findIndex(
              (x) => x.id === response.id
            );
            state.categories[index] = response;
            return {
              ...state,
              status: StatusType.Success,
              selectedCategory: response,
              action: CategoryActionType.Update,
              errors: [],
            };
          });
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
          console.error(error);
        },
      });
  }

  deleteCategory(id: string, skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    this.http
      .delete<CategoryResponse>(
        this.baseUrl + '/' + id,
        skipGlobalErrorHandling
      )
      .pipe(take(1))
      .subscribe({
        next: () => {
          this._state.update((state) => ({
            ...state,
            status: StatusType.Success,
            categories: state.categories.filter((x) => x.id !== id),
            action: CategoryActionType.Delete,
            errors: [],
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
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
          this._state.update((state) => ({
            ...state,
            status: StatusType.Success,
            categories: state.categories.map((x) => {
              const sortedCategory = sortedCategories.find(
                (y) => y.id === x.id
              );
              if (sortedCategory) {
                return {
                  ...x,
                  order: sortedCategory.order,
                };
              }
              return x;
            }),
            errors: [],
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
          console.error(error);
        },
      });
  }

  setCategoryForEdit(
    editMode: 'create' | 'update',
    category: CategoryResponse | null
  ) {
    this._state.update((state) => ({
      ...state,
      editMode,
      selectedCategory: category,
      status: StatusType.Idle,
    }));
  }

  private updateStatus(status: StatusType, errors: string[] = []) {
    this._state.update((state) => ({
      ...state,
      status,
      errors,
    }));
  }
}
