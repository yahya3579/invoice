/**
 * FBR API Utilities
 * Functions to transform invoice data to FBR format and handle responses
 */

/**
 * Transform invoice data to FBR API format
 * @param {Object} invoice - Invoice data from database
 * @param {Object} organization - Organization data
 * @returns {Object} - Data formatted for FBR API
 */
export function transformInvoiceToFBR(invoice, organization) {
  // Transform invoice items to FBR format
  const items = invoice.items.map((item, index) => ({
    itemNo: index + 1,
    hsCode: item.hsCode || '',
    productDescription: item.productDescription || item.itemDescription || '',
    rate: item.rate || '',
    uom: item.uom || item.uoM || '',
    quantity: parseFloat(item.quantity) || 0,
    valueSalesExcludingST: parseFloat(item.valueSalesExcludingST || item.unitPrice || 0),
    totalValues: parseFloat(item.totalValues || 0),
    fixedNotifiedValueOrRetailPrice: parseFloat(item.fixedNotifiedValueOrRetailPrice || 0),
    salesTaxApplicable: parseFloat(item.salesTaxApplicable || item.taxRate || 0),
    salesTaxWithheldAtSource: parseFloat(item.salesTaxWithheldAtSource || 0),
    extraTax: item.extraTax || '',
    furtherTax: parseFloat(item.furtherTax || 0),
    sroScheduleNo: item.sroScheduleNo || '',
    fedPayable: parseFloat(item.fedPayable || 0),
    discount: parseFloat(item.discount || 0),
    saleType: item.saleType || '',
    sroItemSerialNo: item.sroItemSerialNo || (index + 1).toString(),
    taxAmount: parseFloat(item.taxAmount || 0),
    totalAmount: parseFloat(item.totalAmount || 0)
  }));

  // Transform main invoice data
  const fbrData = {
    // Seller Information
    sellerNTN: organization.ntn || '',
    sellerBusinessName: organization.name || '',
    sellerAddress: organization.address || '',
    sellerProvince: organization.province || '',
    sellerRegistrationType: organization.businessType || '',
    
    // Buyer Information
    buyerNTN: invoice.buyerNtn || invoice.buyerNtnCnic || '',
    buyerBusinessName: invoice.buyerBusinessName || invoice.buyerName || '',
    buyerAddress: invoice.buyerAddress || '',
    buyerProvince: invoice.buyerProvince || '',
    buyerRegistrationType: invoice.buyerRegistrationType || '',
    
    // Invoice Information
    invoiceNumber: invoice.invoiceNumber || '',
    invoiceRefNo: invoice.invoiceRefNo || '',
    invoiceDate: invoice.invoiceDate ? formatDateForFBR(invoice.invoiceDate) : '',
    invoiceType: invoice.invoiceType || '',
    scenarioId: invoice.scenarioId || '',
    
    // Financial Information
    subtotal: parseFloat(invoice.subtotal) || 0,
    taxAmount: parseFloat(invoice.taxAmount) || 0,
    totalAmount: parseFloat(invoice.totalAmount) || 0,
    currency: invoice.currency || 'PKR',
    
    // Additional FBR Required Fields
    sroScheduleNo: invoice.sroScheduleNo || '',
    saleType: invoice.saleType || '',
    salesTaxWithheldAtSource: parseFloat(invoice.salesTaxWithheldAtSource || 0),
    furtherTax: parseFloat(invoice.furtherTax || 0),
    fixedNotifiedValueOrRetailPrice: parseFloat(invoice.fixedNotifiedValueOrRetailPrice || 0),
    
    // Items
    items: items
  };

  return fbrData;
}

/**
 * Format date for FBR API (YYYY-MM-DD format)
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDateForFBR(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse FBR API response and extract error information
 * @param {Object} response - FBR API response
 * @returns {Object} - Parsed response with error details
 */
export function parseFBRResponse(response) {
  if (!response) {
    return {
      success: false,
      error: 'No response from FBR API'
    };
  }

  // Check if response indicates success
  if (response.success === true || response.status === 'success' || response.irn || response.invoiceReferenceNumber) {
    return {
      success: true,
      irn: response.irn || response.invoiceReferenceNumber || response.irnNumber,
      message: response.message || response.responseMessage || 'Invoice registered successfully',
      data: response
    };
  }

  // Check for error response - FBR API specific error formats
  if (response.error || response.errors || response.errorCode || response.error_code) {
    let errorCode = response.errorCode || response.error_code || response.error?.code || response.errors?.[0]?.code;
    let errorMessage = response.errorMessage || response.error_message || response.error?.message || response.errors?.[0]?.message || response.message || response.responseMessage;
    
    // Handle FBR specific error formats
    if (response.errorDetails) {
      errorCode = errorCode || response.errorDetails.errorCode || response.errorDetails.code;
      errorMessage = errorMessage || response.errorDetails.errorMessage || response.errorDetails.message;
    }
    
    // Handle array of errors
    if (Array.isArray(response.errors) && response.errors.length > 0) {
      const firstError = response.errors[0];
      errorCode = errorCode || firstError.code || firstError.errorCode;
      errorMessage = errorMessage || firstError.message || firstError.errorMessage;
    }
    
    // Handle string error messages
    if (typeof response === 'string') {
      errorMessage = response;
    }
    
    return {
      success: false,
      errorCode: errorCode,
      errorMessage: errorMessage,
      message: 'FBR registration failed',
      data: response
    };
  }

  // Check for specific FBR error patterns in response text
  if (typeof response === 'string') {
    // Look for common FBR error patterns
    const errorPatterns = [
      /error[:\s]+(\d{4})/i,
      /code[:\s]+(\d{4})/i,
      /(\d{4})/  // Any 4-digit number that might be an error code
    ];
    
    for (const pattern of errorPatterns) {
      const match = response.match(pattern);
      if (match) {
        return {
          success: false,
          errorCode: match[1],
          errorMessage: response,
          message: 'FBR registration failed',
          data: response
        };
      }
    }
    
    return {
      success: false,
      error: 'FBR registration failed',
      errorMessage: response,
      data: response
    };
  }

  // Unknown response format
  return {
    success: false,
    error: 'Unknown response format from FBR API',
    data: response
  };
}

/**
 * Find the best matching FBR error code from our database
 * @param {string} errorCode - FBR error code
 * @param {string} errorMessage - FBR error message
 * @param {Array} fbrErrorCodes - Array of FBR error codes from database
 * @returns {Object|null} - Best matching error code or null
 */
export function findBestMatchingFbrError(errorCode, errorMessage, fbrErrorCodes) {
  if (!fbrErrorCodes || fbrErrorCodes.length === 0) {
    return null;
  }

  // First, try to find exact code match
  if (errorCode) {
    const exactMatch = fbrErrorCodes.find(err => err.code === errorCode);
    if (exactMatch) {
      return exactMatch;
    }
  }

  // If no exact code match, try to find by message similarity
  if (errorMessage) {
    const message = errorMessage.toLowerCase();
    
    // Look for key terms in the error message
    const keyTerms = [
      'buyer', 'seller', 'ntn', 'registration', 'invoice', 'date', 'hs code', 'hscode',
      'tax', 'sales tax', 'quantity', 'rate', 'uom', 'province', 'sro', 'schedule',
      'serial', 'amount', 'value', 'further tax', 'withheld', 'source'
    ];
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const error of fbrErrorCodes) {
      let score = 0;
      const errorDesc = (error.message + ' ' + error.briefDescription).toLowerCase();
      
      // Score based on key term matches
      for (const term of keyTerms) {
        if (errorDesc.includes(term) && message.includes(term)) {
          score += 2;
        }
      }
      
      // Score based on exact word matches
      const messageWords = message.split(/\s+/);
      const descWords = errorDesc.split(/\s+/);
      
      for (const word of messageWords) {
        if (word.length > 3 && descWords.includes(word)) {
          score += 1;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = error;
      }
    }
    
    if (bestScore > 2) {
      return bestMatch;
    }
  }
  
  return null;
}

/**
 * Validate invoice data before sending to FBR
 * @param {Object} invoice - Invoice data
 * @returns {Object} - Validation result
 */
export function validateInvoiceForFBR(invoice) {
  const errors = [];
  
  // Required fields validation based on FBR error codes
  
  // Buyer Information (Error codes: 0002, 0009, 0010, 0012)
  if (!invoice.buyerNtn && !invoice.buyerNtnCnic) {
    errors.push('Buyer NTN/CNIC is required (Error: 0002, 0009)');
  } else {
    // Validate NTN format (Error code: 0002)
    const ntn = invoice.buyerNtn || invoice.buyerNtnCnic;
    if (ntn && !/^\d{7,13}$/.test(ntn.replace(/\D/g, ''))) {
      errors.push('Buyer NTN must be 7, 9, or 13 digits (Error: 0002)');
    }
  }
  
  if (!invoice.buyerBusinessName && !invoice.buyerName) {
    errors.push('Buyer business name is required (Error: 0010)');
  }
  
  if (!invoice.buyerRegistrationType) {
    errors.push('Buyer registration type is required (Error: 0012)');
  }
  
  // Invoice Information (Error codes: 0003, 0005, 0041, 0042, 0043, 0088)
  if (!invoice.invoiceNumber) {
    errors.push('Invoice number is required (Error: 0041)');
  } else {
    // Validate invoice number format (Error code: 0088)
    if (!/^[a-zA-Z0-9-]+$/.test(invoice.invoiceNumber)) {
      errors.push('Invoice number must be alphanumeric with hyphens only (Error: 0088)');
    }
  }
  
  if (!invoice.invoiceDate) {
    errors.push('Invoice date is required (Error: 0042)');
  } else {
    // Validate date format (Error codes: 0005, 0043, 0113)
    const date = new Date(invoice.invoiceDate);
    if (isNaN(date.getTime())) {
      errors.push('Invoice date must be in valid format (Error: 0005, 0043, 0113)');
    }
  }
  
  if (!invoice.invoiceType) {
    errors.push('Invoice type is required (Error: 0003, 0011)');
  }
  
  // Items Validation (Error codes: 0019, 0020, 0021, 0044, 0046, 0078, 0098, 0099)
  if (!invoice.items || invoice.items.length === 0) {
    errors.push('Invoice must have at least one item (Error: 0021)');
  } else {
    invoice.items.forEach((item, index) => {
      const itemNum = index + 1;
      
      if (!item.hsCode) {
        errors.push(`Item ${itemNum}: HS Code is required (Error: 0019, 0044)`);
      }
      
      if (!item.productDescription && !item.itemDescription) {
        errors.push(`Item ${itemNum}: Product description is required`);
      }
      
      if (!item.rate) {
        errors.push(`Item ${itemNum}: Rate is required (Error: 0020, 0046)`);
      }
      
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        errors.push(`Item ${itemNum}: Valid quantity is required (Error: 0021, 0098)`);
      }
      
      if (!item.uom) {
        errors.push(`Item ${itemNum}: Unit of measure (UOM) is required (Error: 0099)`);
      }
      
      if (!item.sroItemSerialNo) {
        errors.push(`Item ${itemNum}: Item serial number is required (Error: 0078)`);
      }
      
      // Validate sales tax calculations (Error codes: 0102, 0104, 0105)
      if (item.taxRate && item.unitPrice && item.quantity) {
        const expectedTax = (parseFloat(item.unitPrice) * parseFloat(item.quantity) * parseFloat(item.taxRate)) / 100;
        const actualTax = parseFloat(item.taxAmount || 0);
        if (Math.abs(expectedTax - actualTax) > 0.01) {
          errors.push(`Item ${itemNum}: Tax calculation mismatch (Error: 0102, 0104, 0105)`);
        }
      }
    });
  }
  
  // Sales Tax Validation (Error codes: 0018, 0023, 0031, 0174)
  if (!invoice.taxAmount || parseFloat(invoice.taxAmount) <= 0) {
    errors.push('Sales tax amount is required (Error: 0018, 0023, 0031, 0174)');
  }
  
  // ST Withheld Validation (Error codes: 0022, 0024, 0055, 0176)
  if (invoice.salesTaxWithheldAtSource === undefined || invoice.salesTaxWithheldAtSource === null) {
    errors.push('ST withheld at source is required (Error: 0022, 0024, 0055, 0176)');
  }
  
  // Further Tax Validation (Error codes: 0080, 0177)
  if (invoice.furtherTax === undefined || invoice.furtherTax === null) {
    errors.push('Further tax is required (Error: 0080, 0177)');
  }
  
  // Fixed/Notified Value Validation (Error codes: 0090, 0175)
  if (invoice.fixedNotifiedValueOrRetailPrice === undefined || invoice.fixedNotifiedValueOrRetailPrice === null) {
    errors.push('Fixed/notified value or retail price is required (Error: 0090, 0175)');
  }
  
  // Province Information (Error codes: 0073, 0074)
  if (!invoice.buyerProvince) {
    errors.push('Buyer province is required (Error: 0074)');
  }
  
  // SRO/Schedule Validation (Error code: 0077)
  if (!invoice.sroScheduleNo) {
    errors.push('SRO/Schedule number is required (Error: 0077)');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    errorCount: errors.length
  };
}
