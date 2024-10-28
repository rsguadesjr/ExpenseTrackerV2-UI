import { Component, computed, effect, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CategoryService } from '../../data-access/category.service';
import { CategoryRequest } from '../../models/category-request.model';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { from, map, of, skip } from 'rxjs';
import { ChipsModule } from 'primeng/chips';
import { CalendarModule } from 'primeng/calendar';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AccountService } from '../../../account/data-access/account.service';
import { InputSwitchModule } from 'primeng/inputswitch';
import { Message } from 'primeng/api';
import { StatusType } from '../../../core/constants/status-type';
import { MessagesModule } from 'primeng/messages';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ReactiveFormsModule,
    ChipsModule,
    CalendarModule,
    ButtonModule,
    InputSwitchModule,
    MessagesModule,
  ],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss',
})
export class CategoryFormComponent {
  private categoryService = inject(CategoryService);
  private accountService = inject(AccountService);
  private ref = inject(DynamicDialogRef);

  categories = this.categoryService.categories;
  status = this.categoryService.status;
  selectedCategory = this.categoryService.selectedCategory;
  isEditMode = this.categoryService.isEditMode;
  errorMessages = computed(() =>
    this.categoryService
      .errors()
      .map(
        (error) => ({ severity: StatusType.Error, detail: error } as Message)
      )
  );

  form = new FormGroup({
    id: new FormControl<string | null>(null),
    name: new FormControl<string>('', Validators.required),
    description: new FormControl<string | null>(''),
    isActive: new FormControl(true),
    order: new FormControl(),
  });

  constructor() {
    if (this.selectedCategory() && this.isEditMode()) {
      this.form.patchValue({
        id: this.selectedCategory()?.id,
        name: this.selectedCategory()?.name,
        description: this.selectedCategory()?.description,
        isActive: this.selectedCategory()?.isActive,
        order: this.selectedCategory()?.order,
      });
    }

    effect(() => {
      if (this.status() === StatusType.Success) {
        this.ref.close();
      }
    });
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.status() === StatusType.Loading) {
      return;
    }

    const request: CategoryRequest = {
      id: this.form.value.id,
      name: this.form.value.name!,
      description: this.form.value.description ?? '',
      isActive: this.form.value.isActive!,
      order: this.form.value.order,
    };

    if (request.id) {
      this.categoryService.updateCategory(request, true);
    } else {
      this.categoryService.createCategory(request, true);
    }
  }

  cancel() {
    this.ref.close();
  }

  getDay() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
