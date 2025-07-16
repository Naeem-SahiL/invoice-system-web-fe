# FILE MANAGEMENT FIXES FOR CHEQUE PAYMENT EDITING

## Problems Fixed

### 1. Files Not Showing When Editing Payment
**Problem**: When editing a cheque payment, the files section showed empty even though files were attached.

**Solution**: 
- Added `existingFiles` property to track server-side files
- Updated `editChequePayment` method to load existing files from backend response
- Modified template to display existing files with delete functionality

### 2. No Way to Delete Existing Files
**Problem**: Users couldn't delete existing files when editing a payment.

**Solution**:
- Added `removeExistingFile` method with confirmation dialog
- Created UI with delete buttons for each existing file
- Added backend support for file deletion during update

### 3. Backend File Deletion Support
**Problem**: Backend didn't handle file deletion during payment updates.

**Solution**:
- Added `deletePaymentFiles` method to `PaymentFileService`
- Updated `updateMultiple` method to handle file deletion
- Added validation for `existing_files` parameter

## Code Changes

### Frontend Changes (`company-payments.component.ts`)
```typescript
// Added property for existing files
existingFiles: any[] = [];

// Updated editChequePayment method
this.existingFiles = res.files || [];
this.uploadedFiles = []; // Reset new uploaded files

// Added file deletion method
removeExistingFile(file: any) {
    this.confirmationService.confirm({
        message: `Are you sure you want to delete this file?`,
        accept: () => {
            this.existingFiles = this.existingFiles.filter(f => f.url !== file.url);
            this.showSuccess('File removed from list (will be deleted on save)');
        }
    });
}

// Updated savePayments to send existing files info
this.existingFiles.forEach((file, idx) => {
    formData.append(`existing_files[${idx}]`, file.url);
});
```

### Frontend Template (`company-payments.component.html`)
```html
<!-- Existing Files Section -->
<div *ngIf="existingFiles.length > 0" class="mb-4">
    <h6 class="text-sm font-medium mb-2">Existing Files:</h6>
    <div class="flex flex-wrap gap-2">
        <div *ngFor="let file of existingFiles" class="flex items-center gap-2 bg-gray-100 p-2 rounded">
            <a [href]="file.url" target="_blank" class="text-primary underline text-sm">
                {{ file.url.split('/').pop() }}
            </a>
            <p-button 
                icon="pi pi-times" 
                severity="danger" 
                size="small"
                [text]="true"
                (onClick)="removeExistingFile(file)"
                pTooltip="Delete file">
            </p-button>
        </div>
    </div>
</div>
```

### Backend Changes (`PaymentFileService.php`)
```php
public function deletePaymentFiles(ChequePayment $payment, array $filesToKeep = [])
{
    $currentFiles = $payment->files;
    
    foreach ($currentFiles as $file) {
        // Check if this file should be kept
        $shouldKeep = false;
        foreach ($filesToKeep as $keepFile) {
            if (str_contains($keepFile, $file->file_path)) {
                $shouldKeep = true;
                break;
            }
        }
        
        if (!$shouldKeep) {
            // Delete the physical file
            $fullPath = storage_path('app/public/' . $file->file_path);
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }
            
            // Delete the database record
            $file->delete();
        }
    }
}
```

### Backend Controller (`InvoicePaymentController.php`)
```php
// Added validation for existing_files
'existing_files' => 'nullable|array',
'existing_files.*' => 'nullable|string',

// Updated file handling in updateMultiple method
if ($request->hasFile('files') || $request->has('existing_files')) {
    // First, delete files that are not in the existing_files list
    if ($request->has('existing_files')) {
        $fileService->deletePaymentFiles($cheque, $request->existing_files);
    } else {
        // If no existing_files sent, delete all existing files
        $fileService->deletePaymentFiles($cheque, []);
    }
    
    // Then store new files
    if ($request->hasFile('files')) {
        $fileService->storePaymentFiles($cheque, $request->file('files'));
    }
}
```

## User Experience Improvements

### ✅ **File Visibility During Edit**
- Existing files are now displayed with clickable links
- Clear separation between existing and new files
- Files maintain their download links

### ✅ **File Deletion Capability**
- Delete button for each existing file
- Confirmation dialog before deletion
- Visual feedback on file removal
- Actual deletion happens on save

### ✅ **File Upload Integration**
- New files can be added alongside existing ones
- Existing files are preserved unless explicitly deleted
- Clean UI with proper labeling

### ✅ **Data Integrity**
- Physical files are deleted from storage
- Database records are properly cleaned up
- No orphaned files left behind

## Testing Scenarios

1. ✅ **Edit Payment with Files**: Files display correctly with download links
2. ✅ **Delete Existing File**: File is removed from list and deleted on save
3. ✅ **Add New Files**: New files can be uploaded alongside existing ones
4. ✅ **Mixed Operations**: Delete some existing files, add new ones, save successfully
5. ✅ **File Persistence**: Files that aren't deleted remain accessible after save

## Files Modified
- `demo-fe/src/app/pages/company-payments/company-payments.component.ts`
- `demo-fe/src/app/pages/company-payments/company-payments.component.html`
- `demo-be/app/Services/PaymentFileService.php`
- `demo-be/app/Http/Controllers/InvoicePaymentController.php`
