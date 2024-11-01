import { Component, effect, inject } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ToolbarModule } from 'primeng/toolbar';
import { AuthService } from '../../../auth/data-access/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UiService } from '../../../core/services/ui-service';
import { AccountService } from '../../../account/data-access/account.service';
import { DropdownModule } from 'primeng/dropdown';
import { map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToolbarModule,
    ButtonModule,
    SplitButtonModule,
    InputTextModule,
    AvatarModule,
    RouterModule,
    DropdownModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private uiService = inject(UiService);

  accounts = this.accountService.accounts;
  currentAccount = this.accountService.currentAccount;
  sidebarToggle = this.uiService.sidebarToggle;

  selectedAccount!: string;
  authState$ = this.authService.authState$;
  items: MenuItem[] = [
    {
      label: 'Manage Accounts',
      icon: 'pi pi-user-edit',
      command: async () => {
        this.router.navigate(['/accounts']);
      },
    },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: async () => {
        await this.authService.signOut();
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: this.router.url },
        });
      },
    },
  ];

  constructor() {
    // this.accountService.state$.pipe(takeUntilDestroyed()).subscribe((state) => {
    //   if (state.currentAccount) {
    //     this.selectedAccount = state.currentAccount.id;
    //   }
    // });
  }

  onAccountChange({ value }: { value: string }) {
    const selectedAccount = this.accountService
      .accounts()
      .find((a) => a.id === value);
    this.confirmationService.confirm({
      header: 'Confirmation',
      icon: 'pi pi-exclamation-circle',
      message: `Are you sure you want to change account to "${
        selectedAccount!.name
      }"?`,
      acceptButtonStyleClass: 'p-button-info',
      accept: () => {
        this.accountService.setCurrentAccount(value);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Successfully changed account',
        });
      },
      reject: () => {
        // revert to previous account
      },
    });
  }

  toggleSideBar($event: Event, visible: boolean) {
    this.uiService.toggleSidebar(!visible);
  }
}
