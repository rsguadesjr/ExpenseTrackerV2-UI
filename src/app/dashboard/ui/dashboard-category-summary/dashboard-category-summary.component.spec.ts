import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCategorySummaryComponent } from './dashboard-category-summary.component';

describe('DashboardCategorySummaryComponent', () => {
  let component: DashboardCategorySummaryComponent;
  let fixture: ComponentFixture<DashboardCategorySummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCategorySummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCategorySummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
