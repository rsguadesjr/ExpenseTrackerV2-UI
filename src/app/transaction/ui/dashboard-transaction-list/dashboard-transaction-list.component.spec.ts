import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardTransactionListComponent } from './dashboard-transaction-list.component';

describe('DashboardTransactionListComponent', () => {
  let component: DashboardTransactionListComponent;
  let fixture: ComponentFixture<DashboardTransactionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardTransactionListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardTransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
