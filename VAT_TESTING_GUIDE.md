# VAT Testing Guide

## Quick Test Checklist

Use this guide to verify all VAT features are working correctly after the fixes.

## Prerequisites
1. Ensure the application is running
2. Login as a user with appropriate permissions
3. Have at least 3 vendors with different VAT rates (e.g., 5%, 10%, 15%)

## Test 1: Create Items with Different VAT Status

### Steps:
1. Navigate to Item Management
2. Create Item 1:
   - Name: "Laptop Computer"
   - Category: Electronics
   - Unit: PCS
   - **"Subject to VAT": Checked ✓**
3. Create Item 2:
   - Name: "Office Chair"
   - Category: Office Supplies
   - Unit: PCS
   - **"Subject to VAT": Checked ✓**
4. Create Item 3:
   - Name: "Consulting Services"
   - Category: Services
   - Unit: HOURS
   - **"Subject to VAT": Unchecked ✗**
5. Create Item 4:
   - Name: "Training Materials"
   - Category: Other
   - Unit: SET
   - **"Subject to VAT": Unchecked ✗**

### Expected Result:
- All 4 items are created successfully
- VAT status badge shows "Yes" for Items 1 & 2, "No" for Items 3 & 4

## Test 2: Edit Item VAT Status

### Steps:
1. In Item Management, click Edit on "Laptop Computer"
2. Uncheck "Subject to VAT"
3. Click Save
4. Verify badge changes from "Yes" to "No"
5. Edit again and re-check "Subject to VAT"
6. Click Save
7. Verify badge changes back to "Yes"

### Expected Result:
- VAT status can be toggled successfully
- Changes are reflected immediately in the UI

## Test 3: Create Comparison with Mixed VAT Items

### Steps:
1. Go to Home / Comparison Table
2. Add 3 vendors:
   - Vendor A (VAT: 5%)
   - Vendor B (VAT: 10%)
   - Vendor C (VAT: 15%)
3. Click "Add Row" and add these items:
   - Row 1: Laptop Computer (Vatable)
     - Vendor A: Qty=2, Price=500.000
     - Vendor B: Qty=2, Price=480.000
     - Vendor C: Qty=2, Price=510.000
   - Row 2: Office Chair (Vatable)
     - Vendor A: Qty=5, Price=150.000
     - Vendor B: Qty=5, Price=145.000
     - Vendor C: Qty=5, Price=155.000
   - Row 3: Consulting Services (Non-Vatable)
     - Vendor A: Qty=10, Price=50.000
     - Vendor B: Qty=10, Price=55.000
     - Vendor C: Qty=10, Price=52.000
   - Row 4: Training Materials (Non-Vatable)
     - Vendor A: Qty=3, Price=100.000
     - Vendor B: Qty=3, Price=95.000
     - Vendor C: Qty=3, Price=105.000

### Expected Results:

**With "Show Calculations" enabled:**

**Row 1 - Laptop Computer (Vatable):**
- Vendor A: Subtotal=1000.000, +VAT=50.000 (5%), Total=1050.000
- Vendor B: Subtotal=960.000, +VAT=96.000 (10%), Total=1056.000
- Vendor C: Subtotal=1020.000, +VAT=153.000 (15%), Total=1173.000

**Row 2 - Office Chair (Vatable):**
- Vendor A: Subtotal=750.000, +VAT=37.500 (5%), Total=787.500
- Vendor B: Subtotal=725.000, +VAT=72.500 (10%), Total=797.500
- Vendor C: Subtotal=775.000, +VAT=116.250 (15%), Total=891.250

**Row 3 - Consulting Services (Non-Vatable):**
- Vendor A: Subtotal=500.000, +VAT=0.000, Total=500.000
- Vendor B: Subtotal=550.000, +VAT=0.000, Total=550.000
- Vendor C: Subtotal=520.000, +VAT=0.000, Total=520.000

**Row 4 - Training Materials (Non-Vatable):**
- Vendor A: Subtotal=300.000, +VAT=0.000, Total=300.000
- Vendor B: Subtotal=285.000, +VAT=0.000, Total=285.000
- Vendor C: Subtotal=315.000, +VAT=0.000, Total=315.000

## Test 4: Save and Reload Comparison

### Steps:
1. With the comparison from Test 3, enter a title (e.g., "Mixed VAT Test")
2. Click "Save Draft"
3. Note the Request Number
4. Refresh the browser page
5. Navigate to Comparison History
6. Load the saved comparison

### Expected Result:
- All rows and vendors are preserved
- All quantities and prices are correct
- VAT calculations remain exactly the same
- Non-vatable items still show 0 VAT
- Vatable items show correct VAT per vendor

## Test 5: Print Preview

### Steps:
1. With the comparison loaded, click "Print Preview"
2. Review the printed table

### Expected Result:
- Each vendor column shows Qty, Unit Price, Subtotal, VAT, and Total
- VAT column shows "0.000 BHD" for non-vatable items
- VAT column shows calculated amount for vatable items
- Summary section shows:
  - Subtotal row: sum of all subtotals per vendor
  - VAT row: sum of all VAT per vendor with rate in parentheses (e.g., "87.500 BHD (5%)")
  - Grand Total row: correct total including VAT

**Expected Vendor Totals (from Test 3 data):**

**Vendor A (5% VAT):**
- Subtotal: 2550.000 BHD
- VAT: 87.500 BHD (5%)
- Grand Total: 2637.500 BHD

**Vendor B (10% VAT):**
- Subtotal: 2520.000 BHD
- VAT: 168.500 BHD (10%)
- Grand Total: 2688.500 BHD

**Vendor C (15% VAT):**
- Subtotal: 2630.000 BHD
- VAT: 269.250 BHD (15%)
- Grand Total: 2899.250 BHD

## Test 6: Change Item Mid-Comparison

### Steps:
1. Create a new comparison
2. Add a vendor
3. Add a row with a vatable item, enter quantity and price
4. Note the total with VAT
5. Change the item to a non-vatable item
6. Observe the total

### Expected Result:
- When vatable item is selected, VAT is added to total
- When non-vatable item is selected, total equals subtotal (no VAT)
- Calculation updates automatically when item changes

## Test 7: Change Quantity/Price

### Steps:
1. With a comparison open, have both vatable and non-vatable items
2. Click "Show Calculations"
3. Change quantity for a vatable item
4. Observe calculations update in real-time
5. Change price for a non-vatable item
6. Observe calculations update in real-time

### Expected Result:
- Subtotal updates immediately
- VAT updates immediately (for vatable items only)
- Total updates immediately
- Changes are reflected for all vendors

## Test 8: Submit and Review

### Steps:
1. As a maker, create and save a comparison with mixed VAT items
2. Click "Submit to Checker"
3. Logout and login as a checker
4. Navigate to Checker Review
5. View the submitted comparison
6. Click "View" to see details

### Expected Result:
- Comparison appears in Pending Reviews
- All VAT calculations are preserved
- Print view from checker shows correct VAT per vendor

## Test 9: Edge Cases

### Test 9a: Zero Quantity
- Set quantity to 0
- Expected: Subtotal=0, VAT=0, Total=0

### Test 9b: Zero Price
- Set price to 0
- Expected: Subtotal=0, VAT=0, Total=0

### Test 9c: Vendor with 0% VAT
- Use a vendor with VAT=0
- Use vatable item
- Expected: VAT amount is 0, but item still marked as vatable

### Test 9d: Large Numbers
- Qty=1000, Price=9999.999
- Expected: Calculations are accurate to 3 decimal places

## Common Issues to Watch For

### ❌ Incorrect Behaviors (Should NOT happen):
1. All vendors showing same VAT regardless of their rates
2. Non-vatable items showing VAT amount > 0
3. VAT calculations lost after save/reload
4. Print view showing different totals than comparison table
5. Changing item VAT status doesn't update calculations
6. Total equals subtotal even for vatable items

### ✅ Correct Behaviors (Should happen):
1. Each vendor's specific VAT rate is used
2. Non-vatable items always show VAT = 0
3. Vatable items show VAT based on vendor's rate
4. All calculations persist across save/reload
5. Print view matches comparison table exactly
6. Real-time updates when changing quantities/prices
7. Item VAT status change triggers recalculation

## Quick Calculation Verification

Use this formula to manually verify any calculation:
```
Subtotal = Quantity × Unit Price
VAT Amount = Item.isVatable ? (Subtotal × Vendor.vat / 100) : 0
Total = Subtotal + VAT Amount
```

Example:
- Item: Vatable
- Quantity: 10
- Unit Price: 100.000 BHD
- Vendor VAT: 15%

Calculation:
- Subtotal = 10 × 100.000 = 1000.000 BHD
- VAT Amount = 1000.000 × 15 / 100 = 150.000 BHD
- Total = 1000.000 + 150.000 = 1150.000 BHD

## Reporting Issues

If any test fails, document:
1. Which test failed
2. Expected result
3. Actual result
4. Steps to reproduce
5. Browser and version
6. Screenshots if applicable

## Success Criteria

All tests pass with:
- ✅ Correct VAT calculations for each vendor
- ✅ Proper handling of mixed VAT/non-VAT items
- ✅ Data persistence across save/reload
- ✅ Consistent calculations across all views
- ✅ Real-time updates in UI
- ✅ Accurate print output
