import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TransactionResponse } from '../../models/transaction-response.mode';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-dashboard-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TagModule],
  templateUrl: './dashboard-transaction-list.component.html',
  styleUrl: './dashboard-transaction-list.component.scss',
})
export class DashboardTransactionListComponent {
  @Input() title = '';
  @Input() transactions: TransactionResponse[] = [];
}
