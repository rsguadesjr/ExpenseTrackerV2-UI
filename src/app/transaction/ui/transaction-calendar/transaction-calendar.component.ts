import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { CalendarModule } from 'primeng/calendar';
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-transaction-calendar',
  standalone: true,
  imports: [CommonModule, CalendarModule, ChipModule],
  providers: [DecimalPipe],
  templateUrl: './transaction-calendar.component.html',
  styleUrl: './transaction-calendar.component.scss',
})
export class TransactionCalendarComponent {
  private decimalPipe = inject(DecimalPipe);

  // @Input() data: { date: Date; value: number }[] = [];
  calendarData: { [key: string]: number } = {};
  // calendarData: { day: number; month: number; year: number; value: number }[] = [];
  @Input() set data(value: { date: Date; value: number }[]) {
    value.forEach((v) => {
      const day = v.date.getDate();
      const month = v.date.getMonth();
      const year = v.date.getFullYear();
      if (this.calendarData[`${year}-${month}-${day}`]) {
        this.calendarData[`${year}-${month}-${day}`] += v.value;
      } else {
        this.calendarData[`${year}-${month}-${day}`] = v.value;
      }
    });

    // Object.keys(this.calendarData).forEach((key) => {
    //   this.calendarData[key] = this.decimalPipe.transform(v.total, '1.0')
    // });
    // this.calendarData = value.map((v) => {
    //   const day = v.date.getDate();
    //   const month = v.date.getMonth() + 1;
    //   const year = v.date.getFullYear();
    //   return { day, month, year, value: v.value };
    // });
  }
}
