# FILE DELETION FIX

## Problem
When editing a cheque payment and deleting existing files, the files were not actually being deleted from the server. The issue was in how the frontend and backend were communicating about which files to keep.

## Root Cause
1. **Frontend**: Was sending full URLs (`http://domain.com/storage/path/file.pdf`) to identify files to keep
2. **Backend**: Was trying to match URLs with file paths (`invoice_payments/file.pdf`) using `str_contains()`
3. **Mismatch**: The comparison was failing because URL structure didn't match file path structure

## Solution

### Backend Changes

#### 1. Updated File Response Structure
**File**: `InvoicePaymentController.php`
```php
// Before
'files' => $chequePayment->files->map(function($file) {
    return [
        'url' => asset('storage/' . $file->file_path),
        'type' => $file->file_type
    ];
})

// After  
'files' => $chequePayment->files->map(function($file) {
    return [
        'id' => $file->id,
        'url' => asset('storage/' . $file->file_path),
        'type' => $file->file_type,
        'file_path' => $file->file_path
    ];
})
```

#### 2. Updated File Deletion Logic
**File**: `PaymentFileService.php`
```php
// Before - Used URL matching
public function deletePaymentFiles(ChequePayment $payment, array $filesToKeep = [])
{
    foreach ($currentFiles as $file) {
        $shouldKeep = false;
        foreach ($filesToKeep as $keepFile) {
            if (str_contains($keepFile, $file->file_path)) {
                $shouldKeep = true;
                break;
            }
        }
        // ... deletion logic
    }
}

// After - Use file ID matching
public function deletePaymentFiles(ChequePayment $payment, array $fileIdsToKeep = [])
{
    foreach ($currentFiles as $file) {
        $shouldKeep = in_array($file->id, $fileIdsToKeep);
        
        if (!$shouldKeep) {
            // Delete physical file and database record
        }
    }
}
```

#### 3. Updated Controller Logic
**File**: `InvoicePaymentController.php`
```php
// Convert file IDs to integers and pass to service
$fileIdsToKeep = array_map('intval', $request->existing_files);
$fileService->deletePaymentFiles($cheque, $fileIdsToKeep);
```

#### 4. Updated Validation Rules
```php
'existing_files' => 'nullable|array',
'existing_files.*' => 'nullable|integer',  // Changed from string to integer
```

### Frontend Changes

#### 1. Updated File Submission
**File**: `company-payments.component.ts`
```typescript
// Before - Send URLs
this.existingFiles.forEach((file, idx) => {
    formData.append(`existing_files[${idx}]`, file.url);
});

// After - Send file IDs
this.existingFiles.forEach((file, idx) => {
    formData.append(`existing_files[${idx}]`, file.id.toString());
});
```

#### 2. Updated File Removal Logic
```typescript
// Before - Filter by URL
this.existingFiles = this.existingFiles.filter(f => f.url !== file.url);

// After - Filter by ID
this.existingFiles = this.existingFiles.filter(f => f.id !== file.id);
```

## How It Works Now

1. **File Loading**: Backend sends files with unique IDs
2. **File Removal**: Frontend removes files from `existingFiles` array by ID
3. **File Submission**: Frontend sends array of file IDs to keep
4. **File Deletion**: Backend deletes all files NOT in the "keep" list
5. **Physical Cleanup**: Both database records and physical files are removed

## Testing Scenarios

### ✅ Scenario 1: Delete Single File
1. Edit payment with 3 files
2. Delete 1 file from frontend
3. Save payment
4. **Result**: 2 files remain, 1 file deleted from server

### ✅ Scenario 2: Delete Multiple Files
1. Edit payment with 3 files
2. Delete 2 files from frontend
3. Save payment
4. **Result**: 1 file remains, 2 files deleted from server

### ✅ Scenario 3: Delete All Files
1. Edit payment with files
2. Delete all files from frontend
3. Save payment
4. **Result**: No files remain, all files deleted from server

### ✅ Scenario 4: Add New Files After Deletion
1. Edit payment with 2 files
2. Delete 1 existing file
3. Add 1 new file
4. Save payment
5. **Result**: 2 files total (1 original + 1 new), 1 file deleted

## Benefits

- ✅ **Reliable Deletion**: Files are actually deleted from server
- ✅ **Precise Control**: Uses unique IDs for exact file identification
- ✅ **Data Integrity**: Database and physical files stay in sync
- ✅ **Performance**: Efficient array operations instead of string matching
- ✅ **Debugging**: Easier to trace file operations with IDs

## Files Modified

- `demo-be/app/Http/Controllers/InvoicePaymentController.php`
- `demo-be/app/Services/PaymentFileService.php`
- `demo-fe/src/app/pages/company-payments/company-payments.component.ts`

The file deletion now works correctly and reliably removes files from both the database and storage when editing cheque payments.
