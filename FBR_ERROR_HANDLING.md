# FBR Error Handling System

This document explains the implementation of the FBR (Federal Board of Revenue) error handling system in the invoice management application.

## Overview

The FBR error handling system provides comprehensive error management for invoice registration with the FBR API. It includes:

1. **Error Code Database**: A comprehensive database of all FBR error codes with descriptions
2. **Real-time API Integration**: Direct integration with the FBR API endpoint
3. **Detailed Error Reporting**: User-friendly error messages with actionable information
4. **Error Logging**: Complete audit trail of all FBR registration attempts
5. **Validation**: Pre-submission validation to catch common issues

## Database Schema

### FbrErrorCode Model

```prisma
model FbrErrorCode {
  code              String   @id @db.VarChar(50)
  message           String   @db.Text
  briefDescription  String   @db.Text @map("brief_description")
  category          String   @db.VarChar(50) @default("sales") // sales, purchase
  isActive          Boolean  @default(true) @map("is_active")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  // Relations
  invoices          Invoice[]
  
  @@map("fbr_error_codes")
}
```

### Updated Invoice Model

The Invoice model now includes FBR error tracking fields:

```prisma
model Invoice {
  // ... existing fields ...
  fbrErrorCode    String?       @db.VarChar(50) @map("fbr_error_code")
  fbrErrorMessage String?       @db.Text @map("fbr_error_message")
  fbrError        FbrErrorCode? @relation(fields: [fbrErrorCode], references: [code])
  // ... existing fields ...
}
```

## Error Codes

The system includes **117 error codes** covering both sales and purchase scenarios:

### Sales Error Codes (95 codes)
- **0001**: Seller not registered for sales tax
- **0002**: Invalid Buyer Registration No or NTN
- **0003**: Provide proper invoice type
- **0005**: Invalid date format
- **0006**: Sale invoice not exist
- **0007**: Wrong Sale type selected
- **0008**: ST withheld at source validation
- **0009**: Buyer registration number required
- **0010**: Buyer name required
- **0011**: Invoice type required
- **0012**: Buyer registration type required
- **0013**: Valid sale type required
- **0018**: Sales Tax/FED required in ST Mode
- **0019**: HS Code required
- **0020**: Rate required
- **0021**: Value of Sales Excl. ST/Quantity required
- **0022**: ST withheld at Source required
- **0023**: Sales Tax required
- **0024**: ST withheld required
- **0026**: Invoice Reference No. required
- **0027**: Reason required
- **0028**: Reason remarks required
- **0029**: Invoice date validation
- **0030**: Unregistered distributor type restriction
- **0031**: Sales Tax required
- **0032**: STWH for GOV/FTN Holders only
- **0034**: Debit/Credit note time limit
- **0035**: Note date validation
- **0036**: Credit note value validation
- **0037**: ST Withheld value validation
- **0039**: Sale invoice existence check
- **0041**: Invoice number required
- **0042**: Invoice date required
- **0043**: Valid date required
- **0044**: HS Code required
- **0046**: Rate required
- **0050**: Sales Tax withheld validation for Cotton ginners
- **0052**: HS Code validation against sale type
- **0053**: Buyer registration type validation
- **0055**: ST Withheld as WH Agent required
- **0056**: Buyer steel sector validation
- **0057**: Reference invoice existence
- **0058**: Self-invoicing restriction
- **0064**: Reference invoice already exists
- **0067**: Debit note sales tax validation
- **0068**: Credit note sales tax validation
- **0070**: STWH for registered buyers only
- **0071**: Credit note restriction
- **0073**: Sale origination province required
- **0074**: Destination of supply required
- **0077**: SRO/Schedule No. required
- **0078**: Item serial number required
- **0079**: Sales value and rate validation
- **0080**: Further Tax required
- **0081**: Input Credit not Allowed required
- **0082**: Seller sales tax registration
- **0083**: Seller registration number mismatch
- **0085**: Total value of sales required
- **0086**: EFS license holder validation
- **0087**: Petroleum levy rates configuration
- **0088**: Invoice number format validation
- **0089**: FED Charged required
- **0090**: Fixed/notified value required
- **0091**: Extra tax must be empty
- **0092**: Valid sale type required
- **0093**: Sale type manufacturer restriction
- **0095**: Extra Tax required
- **0096**: UOM validation for HS Code
- **0097**: UOM KG required
- **0098**: Quantity/electricity units required
- **0099**: UOM validation
- **0100**: Cotton ginners buyer restriction
- **0101**: Steel sector sale type
- **0102**: 3rd schedule tax calculation
- **0103**: Potassium chlorate tax calculation
- **0104**: Sales tax percentage calculation
- **0105**: Quantity-based tax calculation
- **0106**: Buyer sales tax registration
- **0107**: Buyer registration number mismatch
- **0108**: Seller registration number validation
- **0109**: Invoice type validation
- **0111**: Purchase type validation
- **0113**: Date format parsing
- **0300**: Decimal value validation

### Purchase Error Codes (22 codes)
- **0156**: Invalid NTN/Reg No.
- **0157**: Buyer sales tax registration
- **0158**: Buyer registration number mismatch
- **0159**: FTN holder seller restriction
- **0160**: Buyer name required
- **0161**: Invoice date validation
- **0162**: Sale type required
- **0163**: Sale type manufacturer restriction
- **0164**: HS Code UOM validation
- **0165**: UOM KG required
- **0166**: Quantity/electricity units required
- **0167**: Value of sales excl. ST required
- **0168**: Cotton ginners buyer restriction
- **0169**: STWH for GOV/FTN Holders only
- **0170**: Sales value and rate validation
- **0171**: EFS license holder validation
- **0172**: Petroleum levy rates configuration
- **0173**: Invoice number format validation
- **0174**: Sales tax required
- **0175**: Fixed/notified value required
- **0176**: ST withheld at source required
- **0177**: Further tax required

## API Integration

### FBR API Endpoint

The system integrates with the official FBR API:
```
POST https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb
```

### Request Flow

1. **Validation**: Pre-submission validation of invoice data
2. **Transformation**: Convert invoice data to FBR format
3. **API Call**: Send request to FBR API with timeout handling
4. **Response Parsing**: Parse FBR response for success/error
5. **Error Mapping**: Map FBR error codes to detailed descriptions
6. **Database Update**: Update invoice with success/error information
7. **Logging**: Log all attempts for audit purposes

### Error Handling

The system handles various types of errors:

- **FBR API Errors**: Specific error codes from FBR with detailed descriptions
- **Validation Errors**: Pre-submission validation failures
- **Network Errors**: Connection timeouts and network issues
- **System Errors**: Application-level errors during processing

## Setup Instructions

### 1. Database Migration

Run the Prisma migration to create the new tables:

```bash
npx prisma db push
```

### 2. Seed Error Codes

Populate the FBR error codes database:

```bash
npm run db:seed
```

### 3. Environment Configuration

Ensure the following environment variables are set:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# FBR API Configuration (if needed)
FBR_API_URL="https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb"
FBR_API_TIMEOUT="30000"
```

### 4. User FBR Token

Each user must have an FBR API token configured:

1. Go to Admin → Users
2. Select a user
3. Set the FBR Token field
4. Save changes

## Usage

### 1. Register Invoice with FBR

1. Navigate to an invoice detail page
2. Click "Register with FBR" button
3. System validates invoice data
4. If validation passes, sends to FBR API
5. Displays success or detailed error information

### 2. Error Resolution

When an error occurs:

1. **Read the Error Code**: Note the specific FBR error code
2. **Review Description**: Read the detailed error description
3. **Check Category**: Determine if it's a sales or purchase issue
4. **Fix Issues**: Address the specific problems mentioned
5. **Retry Registration**: Attempt registration again

### 3. Common Error Resolutions

#### Missing Required Fields
- **Error 0009**: Add buyer registration number
- **Error 0010**: Add buyer business name
- **Error 0019**: Add HS code for all items
- **Error 0020**: Add rate for all items

#### Format Issues
- **Error 0005**: Ensure date is in YYYY-MM-DD format
- **Error 0088**: Use alphanumeric invoice numbers with hyphens

#### Business Logic
- **Error 0001**: Ensure seller is registered for sales tax
- **Error 0058**: Verify buyer and seller are different entities
- **Error 0079**: Check sales value vs. tax rate combinations

## Monitoring and Logging

### Error Logs

All FBR registration attempts are logged in the `error_logs` table:

- **Success Logs**: Record successful registrations with IRN
- **Error Logs**: Record failed attempts with error details
- **System Logs**: Record application-level errors

### Admin Dashboard

The admin dashboard shows:

- Total FBR registration attempts
- Success/failure rates
- Recent error logs
- User-specific error statistics

## Troubleshooting

### Common Issues

1. **FBR API Timeout**
   - Check network connectivity
   - Verify FBR API endpoint accessibility
   - Increase timeout if needed

2. **Authentication Errors**
   - Verify user has valid FBR token
   - Check token format and validity
   - Contact administrator for token issues

3. **Data Validation Errors**
   - Review invoice data completeness
   - Check required field values
   - Verify data format compliance

4. **Database Connection Issues**
   - Verify database connectivity
   - Check Prisma client configuration
   - Ensure proper database permissions

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=true
NODE_ENV=development
```

This will provide detailed console output for troubleshooting.

## Security Considerations

1. **API Token Protection**: FBR tokens are stored securely and not exposed in logs
2. **User Permissions**: Only authorized users can register invoices
3. **Data Validation**: All data is validated before submission
4. **Audit Trail**: Complete logging of all operations
5. **Error Sanitization**: Error messages are sanitized to prevent information leakage

## Performance Optimization

1. **Connection Pooling**: Database connections are pooled for efficiency
2. **Request Timeout**: FBR API calls have configurable timeouts
3. **Error Caching**: Frequently occurring errors are cached
4. **Batch Processing**: Multiple invoices can be processed in batches

## Future Enhancements

1. **Retry Mechanism**: Automatic retry for transient errors
2. **Bulk Registration**: Batch processing of multiple invoices
3. **Real-time Status**: WebSocket updates for registration status
4. **Advanced Analytics**: Detailed success/failure analytics
5. **Integration APIs**: REST APIs for external system integration

## Support

For technical support or questions about the FBR error handling system:

1. Check the error logs in the admin dashboard
2. Review the FBR API documentation
3. Contact the development team
4. Submit issues through the project repository

## References

- [FBR Official Documentation](https://fbr.gov.pk/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
