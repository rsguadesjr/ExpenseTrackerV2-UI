import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardTransactionChartComponent } from './dashboard-transaction-chart.component';

describe('DashboardTransactionChartComponent', () => {
  let component: DashboardTransactionChartComponent;
  let fixture: ComponentFixture<DashboardTransactionChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardTransactionChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardTransactionChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
