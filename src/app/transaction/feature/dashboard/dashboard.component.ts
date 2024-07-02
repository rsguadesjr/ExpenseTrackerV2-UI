import { Component, inject } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { TransactionService } from '../../data-access/transaction.service';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { map } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { AccountService } from '../../../account/data-access/account.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MenuModule, CalendarModule, TagModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  transactionService = inject(TransactionService);
  accountService = inject(AccountService);

  currentAccount$ = this.accountService.state$.pipe(
    map((state) => state.currentAccount)
  );

  state$ = this.transactionService.state$;
}
