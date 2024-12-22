import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-category-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-category-summary.component.html',
  styleUrl: './dashboard-category-summary.component.scss',
})
export class DashboardCategorySummaryComponent {
  @Input() title = '';
  @Input() data: {
    name: string;
    totalAmount: number;
    percentage: number;
  }[] = [];
}
