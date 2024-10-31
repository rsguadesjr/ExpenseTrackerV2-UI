import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { TableModule } from 'primeng/table';
import { CategoryService } from '../../data-access/category.service';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { CategoryResponse } from '../../models/category-response.model';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject, debounce, debounceTime, filter, map, take } from 'rxjs';
import { StatusType } from '../../../core/constants/status-type';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { CategoryActionType } from '../../constants/category-action-.type';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ChipModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    InputSwitchModule,
    TooltipModule,
  ],
  providers: [DialogService, ConfirmationService],
  templateUrl: './category-management.component.html',
  styleUrl: './category-management.component.scss',
})
export class CategoryManagementComponent {
  private categoryService = inject(CategoryService);
  private dialogService = inject(DialogService);
  private confirmationService = inject(ConfirmationService);

  // state$ = this.categoryService.state$;
  categories = this.categoryService.categories;
  status = this.categoryService.status;
  action = this.categoryService.action;

  canSaveSortingChange = computed(
    () => this.sortingChanged() && this.enableSorting()
  );
  enableSorting = signal<boolean>(false);
  sortingChanged = signal<boolean>(false);
  sortedCategories = signal<{ id: string; order: number }[]>([]);

  sortCategoriesEffect = effect(() => {
    const sortCategories = this.sortedCategories();
    untracked(() => {
      this.categoryService.sortCategories(sortCategories);
    });
  });

  onSortingChangeSaveEffect = effect(() => {
    const status = this.status();
    const action = this.action();

    untracked(() => {
      if (status === StatusType.Success && action === CategoryActionType.Sort) {
        this.sortingChanged.set(false);
      }
    });
  });

  createCategory() {
    this.categoryService.setCategoryForEdit('create', null);
    this.dialogService.open(CategoryFormComponent, {
      header: 'Create',
      width: '420px',
      closeOnEscape: true,
    });
  }

  editCategory(category: CategoryResponse) {
    this.categoryService.setCategoryForEdit('update', category);
    this.dialogService.open(CategoryFormComponent, {
      header: 'Update',
      width: '420px',
    });
  }

  deleteCategory(category: CategoryResponse) {
    this.confirmationService.confirm({
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      message: `Are you sure you want to delete "${category.name}"?`,
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.categoryService.deleteCategory(category.id);
      },
      reject: () => {},
    });
  }

  onRowReorder(event: any) {
    this.sortingChanged.set(true);
  }

  reorderCategories() {
    if (!this.canSaveSortingChange || this.status() === StatusType.Loading) {
      return;
    }

    this.sortedCategories.set(
      this.categories().map((x, i) => ({
        id: x.id,
        order: i + 1,
      }))
    );
  }

  enableSortingChange(enable: boolean) {
    this.enableSorting.set(enable);
  }
}
