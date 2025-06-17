import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyPaymentsComponent } from './company-payments.component';

describe('CompanyPaymentsComponent', () => {
  let component: CompanyPaymentsComponent;
  let fixture: ComponentFixture<CompanyPaymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyPaymentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyPaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
