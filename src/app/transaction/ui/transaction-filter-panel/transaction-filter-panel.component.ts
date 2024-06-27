import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-transaction-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToolbarModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    CalendarModule,
    FloatLabelModule,
  ],
  templateUrl: './transaction-filter-panel.component.html',
  styleUrl: './transaction-filter-panel.component.scss',
})
export class TransactionFilterPanelComponent {
  viewModes: { name: string; value: string }[] = [
    { name: 'Month', value: 'Month' },
    // TODO: add custom range in the future, currently not supported
    // { name: 'Custom Range', value: 'CustomRange' },
  ];
  monthList: {
    name: string;
    startDate: Date;
    endDate: Date;
    default: boolean;
  }[] = [];

  filterForm = new FormGroup({
    viewMode: new FormControl(this.viewModes[0]),
    month: new FormControl(new Date()),
    startDate: new FormControl(),
    endDate: new FormControl(),
  });

  @Input() showLoading = false;

  @Output() dateFilter = new EventEmitter<{ startDate: Date; endDate: Date }>();

  constructor() {
    this.generateMonthList();

    this.filterForm
      .get('viewMode')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((viewMode) => {
        if (!viewMode) {
          return;
        }
        if (viewMode.value === 'Month') {
          this.filterForm.get('month')?.setValidators(Validators.required);
          this.filterForm
            .get('startDate')
            ?.removeValidators(Validators.required);
          this.filterForm.get('endDate')?.removeValidators(Validators.required);
        } else {
          this.filterForm.get('month')?.removeValidators(Validators.required);
          this.filterForm.get('startDate')?.setValidators(Validators.required);
          this.filterForm.get('endDate')?.setValidators(Validators.required);
        }
      });

    this.filterForm
      .get('month')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((monthDate) => {
        if (!monthDate) {
          return;
        }

        // get startDate and endDate of monthDate
        const startDate = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          1
        );
        const endDate = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0
        );
        this.filterForm
          .get('startDate')
          ?.setValue(startDate, { emitEvent: false });
        this.filterForm.get('endDate')?.setValue(endDate, { emitEvent: false });
      });
  }

  ngOnInit(): void {
    this.filterForm.get('month')?.updateValueAndValidity();
  }

  generateMonthList() {
    for (let i = 1; i <= 12; i++) {
      const year = new Date().getFullYear();
      const startDate = new Date(year, i - 1, 1);
      const endDate = new Date(year, i, 0);
      this.monthList.push({
        name: startDate.toLocaleString('default', { month: 'long' }),
        startDate,
        endDate,
        default: i === new Date().getMonth() + 1,
      });
    }
  }

  applyFilter() {
    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid || this.showLoading) {
      return;
    }
    console.log(this.filterForm.value);
    this.dateFilter.emit({
      startDate: this.filterForm.get('startDate')?.value,
      endDate: this.filterForm.get('endDate')?.value,
    });
  }
}
