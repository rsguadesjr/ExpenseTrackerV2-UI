import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionCalendarComponent } from './transaction-calendar.component';

describe('TransactionCalendarComponent', () => {
  let component: TransactionCalendarComponent;
  let fixture: ComponentFixture<TransactionCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
