# FBR Integration Guide

This document explains how the enhanced FBR (Federal Board of Revenue) integration works in the invoice management system.

## Overview

The FBR integration system provides a complete workflow for registering invoices with the Federal Board of Revenue API, including comprehensive validation, error handling, and user guidance.

## System Architecture

### 1. Database Schema

#### User Table
- `fbrApiToken`: Stores the FBR API token for each user
- Users must have this token configured to register invoices with FBR

#### Invoice Table
- `fbrResponse`: JSON field storing FBR API responses
- `fbrErrorCode`: Links to specific FBR error codes
- `fbrErrorMessage`: Stores detailed error messages
- `irn`: Invoice Reference Number (assigned by FBR on success)

#### FbrErrorCode Table
- Contains 117 predefined error codes from FBR
- Categorized as "sales" or "purchase"
- Includes detailed descriptions and solutions

#### ErrorLog Table
- Tracks all FBR registration attempts
- Records success/failure with context
- Provides audit trail for compliance

### 2. API Endpoints

#### `/api/fbr/register` (POST)
- Main endpoint for FBR invoice registration
- Validates invoice data before submission
- Calls real FBR API endpoint
- Handles responses and errors comprehensively

#### `/api/fbr/check-token` (GET)
- Checks if current user has FBR token configured
- Used by frontend to show/hide FBR registration options

## Workflow

### 1. Pre-Registration Validation

Before sending data to FBR, the system performs comprehensive validation:

#### Required Fields Check
- Buyer NTN/CNIC (7, 9, or 13 digits)
- Buyer business name
- Buyer registration type
- Invoice number (alphanumeric with hyphens)
- Invoice date (YYYY-MM-DD format)
- Invoice type
- HS Code for all items
- Rate for all items
- Quantity for all items
- UOM (Unit of Measure)
- Sales tax amount
- ST withheld at source
- Further tax
- Fixed/notified value
- Buyer province
- SRO/Schedule number

#### Business Logic Validation
- Tax calculation verification
- Quantity validation
- Format compliance checks

### 2. FBR API Call

#### Request Format
```json
{
  "sellerNTN": "123456789",
  "sellerBusinessName": "Company Name",
  "buyerNTN": "987654321",
  "buyerBusinessName": "Customer Name",
  "invoiceNumber": "INV-001",
  "invoiceDate": "2025-01-15",
  "items": [
    {
      "hsCode": "123456",
      "productDescription": "Product Name",
      "quantity": 10,
      "rate": 100,
      "uom": "PCS"
    }
  ]
}
```

#### API Endpoint
- **URL**: `https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb`
- **Method**: POST
- **Headers**: Authorization Bearer token
- **Timeout**: 30 seconds

### 3. Response Handling

#### Success Response
- Updates invoice status to "registered"
- Stores IRN (Invoice Reference Number)
- Logs success in ErrorLog
- Returns success message to user

#### Error Response
- Extracts error code and message from FBR response
- Looks up detailed error information from database
- Provides actionable solutions to user
- Updates invoice with error details
- Logs error for audit purposes

## Error Handling

### 1. Error Code Mapping

The system maps FBR error codes to detailed descriptions:

#### Common Error Examples
- **0001**: Seller not registered for sales tax
- **0002**: Invalid buyer NTN format
- **0009**: Missing buyer registration number
- **0019**: Missing HS Code
- **0020**: Missing rate information
- **0074**: Missing destination province
- **0088**: Invalid invoice number format

### 2. Error Resolution

For each error, the system provides:
- **Error Code**: Specific FBR error identifier
- **Error Message**: FBR's error description
- **Brief Description**: User-friendly explanation
- **Solution**: Step-by-step resolution guide
- **Category**: Sales or purchase classification

### 3. Smart Error Matching

When exact error code matching fails, the system uses intelligent matching:
- Analyzes error message content
- Matches key terms (buyer, seller, tax, etc.)
- Scores similarity between error and database entries
- Provides best possible match for user guidance

## User Experience

### 1. FBR Token Status

#### Without Token
- Shows blue info message about needing FBR token
- Disables FBR registration button
- Provides clear guidance to contact administrator

#### With Token
- Shows green success message about being FBR ready
- Enables FBR registration button
- Allows invoice registration process

### 2. Registration Process

1. User clicks "Register with FBR"
2. System validates invoice data
3. If validation fails, shows specific field requirements
4. If validation passes, sends to FBR API
5. Shows success or detailed error information

### 3. Error Display

#### Validation Errors
- Lists all missing/invalid fields
- Shows specific error codes
- Provides field-by-field guidance

#### FBR API Errors
- Displays FBR error code and message
- Shows detailed description and solution
- Links to relevant help documentation

## Security Features

### 1. Token Protection
- FBR tokens stored securely in database
- Not exposed in logs or error messages
- User-specific token validation

### 2. Permission Control
- Only invoice owners or admins can register
- Token validation before API calls
- Comprehensive audit logging

### 3. Data Validation
- Pre-submission validation prevents invalid data
- Sanitizes all inputs before FBR submission
- Validates response data before processing

## Monitoring and Logging

### 1. Success Tracking
- Records successful registrations with IRN
- Tracks response times and performance
- Maintains success rate statistics

### 2. Error Tracking
- Logs all failed attempts with context
- Records FBR error codes and messages
- Tracks error patterns for system improvement

### 3. Audit Trail
- Complete history of all FBR interactions
- User activity tracking
- Compliance and reporting support

## Troubleshooting

### 1. Common Issues

#### FBR Token Not Configured
- **Symptom**: "FBR API token not configured" error
- **Solution**: Contact administrator to configure token

#### Validation Failures
- **Symptom**: "Invoice validation failed" error
- **Solution**: Review and complete all required fields

#### API Timeouts
- **Symptom**: "FBR API request timed out" error
- **Solution**: Check network connectivity and retry

### 2. Debug Information

The system provides detailed debugging:
- Console logs for development
- Error context in database
- Raw FBR API responses
- Validation error details

## Best Practices

### 1. Invoice Preparation
- Ensure all required fields are completed
- Verify HS codes are correct for items
- Check tax calculations are accurate
- Use proper date formats (YYYY-MM-DD)

### 2. Error Resolution
- Read error codes and descriptions carefully
- Follow provided solution steps
- Verify data changes before retrying
- Contact support for persistent issues

### 3. System Maintenance
- Regularly update FBR error codes
- Monitor error patterns and trends
- Maintain FBR API token security
- Keep validation rules current

## Future Enhancements

### 1. Planned Features
- Automatic retry for transient errors
- Bulk invoice registration
- Real-time status updates
- Advanced error analytics

### 2. Integration Options
- REST API for external systems
- Webhook notifications
- Batch processing capabilities
- Advanced reporting tools

## Support and Resources

### 1. Documentation
- FBR API specifications
- Error code reference guide
- Validation rule documentation
- User manual and tutorials

### 2. Technical Support
- Development team contact
- Issue reporting system
- Community forums
- Training materials

This enhanced FBR integration provides a robust, user-friendly system for invoice registration with comprehensive error handling and guidance.
