import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-transaction-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarModule, ChipModule],
  providers: [],
  templateUrl: './transaction-calendar.component.html',
  styleUrl: './transaction-calendar.component.scss',
})
export class TransactionCalendarComponent {
  @Input() month = new Date();

  // @Input() data: { date: Date; value: number }[] = [];
  calendarData: { [key: string]: number } = {};
  // calendarData: { day: number; month: number; year: number; value: number }[] = [];
  @Input() set data(value: { date: Date; value: number }[]) {
    this.calendarData = {};
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
