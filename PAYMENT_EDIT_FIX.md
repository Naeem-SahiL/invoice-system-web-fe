# Fix for Cheque Payment Edit Total Amount Issue

## Problem
When editing a cheque payment, the total amount was not populating in the form. The user would see the payment details but the total amount field would be empty or show 0.

## Root Cause
In the `editChequePayment` method in `company-payments.component.ts`, after fetching the payment details and setting the selected invoices, the code was not calling `calculateTotalReceived()` to update the `total_amount_received` field that's bound to the readonly input field in the template.

## Solution Applied

### Frontend Changes (company-payments.component.ts)

1. **Added `calculateTotalReceived()` call** in the `editChequePayment` method:
   ```typescript
   editChequePayment(group){
       // ... existing code ...
       this.paymentService.getPayment(group.id).subscribe({
           next: (res:any)=>{
               this.showAddPaymentCard = true;
               this.selectedInvoicesForPayment = res.payments;
               this.remarks = res.remarks;
               this.chequeNumber = res.cheque_number;
               this.paymentDate = new Date(res.payment_date);
               this.selectedPaymentMethod = res.payment_method;

               // Set the selected company
               this.formGroup.patchValue({
                   selectedCompanyId: res.company_id
               });

               // Calculate total amount from selected invoices
               this.calculateTotalReceived(); // <-- This was missing!

               this.editingChequePayment = false;
           },
           // ... error handling ...
       });
   }
   ```

2. **Added proper edit state management**:
   - Added `editingChequePaymentId` property to track which payment is being edited
   - Updated `savePayments()` method to handle both create and update scenarios
   - Added company selection during edit
   - Updated cleanup methods to reset the editing state

### Backend Changes

1. **Added `updateMultiple` method** to `InvoicePaymentController.php`:
   - Handles updating existing cheque payments
   - Properly reverses old payment amounts before applying new ones
   - Deletes old individual payments and creates new ones
   - Maintains data integrity

2. **Added API route** in `routes/api.php`:
   ```php
   Route::post('/invoice-payments/multiple/{id}', [InvoicePaymentController::class, 'updateMultiple']);
   ```

3. **Added service method** in `payments.service.ts`:
   ```typescript
   updateChequePayment(id: number, formData: FormData) {
       return this.http.post(this.baseUrl + '/invoice-payments/multiple/' + id, formData);
   }
   ```

## How It Works Now

1. **Create Mode**: When adding a new payment, `editingChequePaymentId` is `null`, so the system uses `submitMultiplePayments()`
2. **Edit Mode**: When editing an existing payment, `editingChequePaymentId` contains the payment ID, so the system uses `updateChequePayment()`
3. **Total Amount**: The `calculateTotalReceived()` method properly calculates the total from selected invoices and updates the bound field

## Key Files Modified

- `demo-fe/src/app/pages/company-payments/company-payments.component.ts`
- `demo-fe/src/app/pages/service/payments.service.ts`
- `demo-be/app/Http/Controllers/InvoicePaymentController.php`
- `demo-be/routes/api.php`

## Testing

To verify the fix:
1. Navigate to Company Payments page
2. Edit an existing cheque payment
3. The total amount should now populate correctly in the readonly field
4. Make changes and save to verify the update functionality works

The fix ensures that when editing a cheque payment, all fields including the total amount are properly populated and the save operation correctly updates the existing payment instead of creating a new one.
