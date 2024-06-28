import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControlOptions,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { AccountService } from '../../data-access/account.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StatusType } from '../../../core/constants/status-type';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { map, skip, take } from 'rxjs';
import { AccountRequest } from '../../models/account-request.model';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ButtonModule } from 'primeng/button';
import { MessagesModule } from 'primeng/messages';
import { Message } from 'primeng/api';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputSwitchModule,
    ButtonModule,
    MessagesModule,
  ],
  templateUrl: './account-form.component.html',
  styleUrl: './account-form.component.scss',
})
export class AccountFormComponent {
  private accountService = inject(AccountService);
  private ref = inject(DynamicDialogRef);

  state$ = this.accountService.state$;
  errorMessages$ = this.state$.pipe(
    map((state) => state.errors || []),
    map((errors) =>
      errors.map(
        (error) => ({ severity: StatusType.Error, detail: error } as Message)
      )
    )
  );

  form = new FormGroup(
    {
      id: new FormControl(),
      name: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      isActive: new FormControl(true),
      isDefault: new FormControl(false),
    },
    {
      validators: this.inActiveMustNotBeDefaultValidator,
    } as AbstractControlOptions
  );

  constructor() {
    this.state$.pipe(take(1)).subscribe((state) => {
      if (state.editMode === 'update' && state.selectedAccount) {
        this.form.patchValue({
          id: state.selectedAccount?.id,
          name: state.selectedAccount?.name,
          description: state.selectedAccount?.description,
          isActive: state.selectedAccount?.isActive,
          isDefault: state.selectedAccount?.isDefault,
        });
      }
    });

    this.state$
      .pipe(
        skip(1),
        map((state) => state.status),
        takeUntilDestroyed()
      )
      .subscribe((status) => {
        if (status === StatusType.Success) {
          this.ref.close();
        }
      });
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (
      this.form.invalid ||
      this.accountService.stateValue.status === StatusType.Loading
    ) {
      return;
    }

    const request: AccountRequest = {
      id: this.form.value.id,
      name: this.form.value.name!,
      description: this.form.value.description!,
      isActive: this.form.value.isActive!,
      isDefault: this.form.value.isDefault!,
    };

    if (request.id) {
      this.accountService.updateAccount(request);
    } else {
      this.accountService.createAccount(request);
    }
  }

  cancel() {
    this.ref.close();
  }

  inActiveMustNotBeDefaultValidator(form: FormGroup) {
    const isActive = !!form.get('isActive')?.value;
    const isDefault = !!form.get('isDefault')?.value;
    if (!isActive && isDefault) {
      form.get('isDefault')?.setErrors({ mustNotBeDefault: true });
    } else {
      form.get('isDefault')?.setErrors(null);
    }
  }
}
