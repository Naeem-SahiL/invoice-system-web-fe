import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditInvoiceItemComponent } from './add-edit-invoice-item.component';

describe('AddEditInvoiceItemComponent', () => {
  let component: AddEditInvoiceItemComponent;
  let fixture: ComponentFixture<AddEditInvoiceItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditInvoiceItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditInvoiceItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
