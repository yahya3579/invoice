import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";
import { transformInvoiceToFBR, parseFBRResponse, validateInvoiceForFBR, findBestMatchingFbrError } from "@/lib/fbr-utils";

// FBR API Configuration
const FBR_API_URL = "https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb";
const FBR_API_TIMEOUT = 30000; // 30 seconds

/**
 * Get solution for common FBR error codes
 * @param {string} errorCode - FBR error code
 * @returns {string} - Solution description
 */
function getSolutionForErrorCode(errorCode) {
  const solutions = {
    '0001': 'Ensure the seller organization is registered for sales tax and has a valid NTN.',
    '0002': 'Verify buyer NTN/CNIC is in correct format: 7, 9, or 13 digits.',
    '0003': 'Select a valid invoice type from the available options.',
    '0005': 'Ensure invoice date is in YYYY-MM-DD format.',
    '0009': 'Add buyer registration number in the invoice details.',
    '0010': 'Add buyer business name in the invoice details.',
    '0012': 'Select buyer registration type from the available options.',
    '0013': 'Select a valid sale type for the invoice.',
    '0018': 'Add sales tax/FED amount in ST mode.',
    '0019': 'Add HS Code for all invoice items.',
    '0020': 'Add rate for all invoice items.',
    '0021': 'Add quantity and value of sales excluding ST for all items.',
    '0022': 'Add ST withheld at source amount.',
    '0023': 'Add sales tax amount for the invoice.',
    '0024': 'Add ST withheld amount.',
    '0073': 'Add sale origination province of supplier.',
    '0074': 'Add destination of supply province.',
    '0077': 'Add SRO/Schedule number.',
    '0078': 'Add item serial number for all items.',
    '0080': 'Add further tax amount.',
    '0088': 'Use alphanumeric invoice numbers with hyphens only.',
    '0089': 'Add FED charged amount.',
    '0090': 'Add fixed/notified value or retail price.',
    '0095': 'Add extra tax amount if applicable.',
    '0096': 'Use KWH as UOM for the selected HS Code.',
    '0097': 'Use KG as UOM for the selected HS Code.',
    '0098': 'Add quantity/electricity units for all items.',
    '0099': 'Use correct UOM according to the HS Code.',
    '0102': 'Verify tax calculations match 3rd schedule formula.',
    '0104': 'Verify sales tax percentage calculations.',
    '0105': 'Verify quantity-based tax calculations.',
    '0156': 'Verify NTN/Registration number is valid.',
    '0157': 'Ensure buyer is registered for sales tax.',
    '0160': 'Add buyer name in the invoice details.',
    '0162': 'Select valid sale type.',
    '0164': 'Use KWH as UOM for the selected HS Code.',
    '0165': 'Use KG as UOM for the selected HS Code.',
    '0166': 'Add quantity/electricity units for all items.',
    '0167': 'Add value of sales excluding ST.',
    '0174': 'Add sales tax amount.',
    '0175': 'Add fixed/notified value or retail price.',
    '0176': 'Add ST withheld at source amount.',
    '0177': 'Add further tax amount.',
    '0300': 'Verify decimal values are valid for all fields.'
  };
  
  return solutions[errorCode] || 'Please review the invoice data and ensure all required fields are properly filled.';
}

// POST /api/fbr/register - Register invoice with FBR
export async function POST(req) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const body = await req.json();
    const { invoiceId } = body;
    
    // Get invoice with items and organization
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(invoiceId) },
      include: {
        items: true,
        organization: true,
        user: true
      }
    });
    
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    
    // Check permissions
    if (user.role !== "admin" && invoice.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Get current user data from database to check FBR token (JWT might be outdated)
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { fbrApiToken: true }
    });
    
    // Debug: Log token checking process
    console.log('FBR Registration Debug:', {
      userId: user.id,
      jwtToken: user.fbrApiToken ? 'Present in JWT' : 'Missing from JWT',
      dbToken: currentUser?.fbrApiToken ? 'Present in DB' : 'Missing from DB',
      tokenLength: currentUser?.fbrApiToken?.length || 0
    });
    
    if (!currentUser || !currentUser.fbrApiToken) {
      return NextResponse.json({ 
        success: false,
        error: "FBR API token not configured. Please contact administrator.",
        errorType: "FBR_TOKEN_MISSING",
        details: {
          message: "User does not have an FBR API token configured",
          solution: "Contact administrator to configure FBR token for this user. You may need to log out and log back in after the token is configured."
        }
      }, { status: 400 });
    }
    
    // If JWT doesn't have FBR token but database does, suggest token refresh
    if (!user.fbrApiToken && currentUser.fbrApiToken) {
      console.log('JWT token is outdated - FBR token exists in DB but not in JWT');
    }
    
    // Validate invoice data
    const validation = validateInvoiceForFBR(invoice);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: "Invoice validation failed",
        errorType: "VALIDATION_ERROR",
        errorCode: "VALIDATION_ERROR",
        errorMessage: `Invoice validation failed: ${validation.errors.length} field(s) missing or invalid`,
        briefDescription: "One or more required fields are missing or invalid for FBR registration.",
        details: {
          category: "validation",
          solution: "Please review and complete all required invoice fields before attempting FBR registration.",
          missingFields: validation.errors,
          fieldCount: validation.errors.length
        }
      }, { status: 400 });
    }
    
    // Transform invoice to FBR format
    const fbrData = transformInvoiceToFBR(invoice, invoice.organization);
    
    // Debug: Log FBR data being sent
    console.log('FBR Registration - Data being sent:', {
      apiUrl: FBR_API_URL,
      tokenLength: currentUser.fbrApiToken?.length || 0,
      tokenPreview: currentUser.fbrApiToken ? `${currentUser.fbrApiToken.substring(0, 10)}...` : 'None',
      fbrDataKeys: Object.keys(fbrData),
      fbrDataSample: JSON.stringify(fbrData, null, 2).substring(0, 500) + '...'
    });
    
    // Make request to FBR API using the current user's token
    const fbrResponse = await callFBRAPI(fbrData, currentUser.fbrApiToken);
    
    // Parse FBR response
    const parsedResponse = parseFBRResponse(fbrResponse);
    
    if (parsedResponse.success) {
      // Success - Update invoice with IRN
      const updated = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "registered",
          irn: parsedResponse.irn,
          fbrResponse: {
            success: true,
            irn: parsedResponse.irn,
            registeredAt: new Date().toISOString(),
            response: fbrResponse
          },
          fbrErrorCode: null,
          fbrErrorMessage: null
        },
      });
      
      // Log successful registration
      await prisma.errorLog.create({
        data: {
          userId: user.id,
          errorCode: "SUCCESS",
          errorMessage: `Invoice ${invoice.id} registered successfully with FBR. IRN: ${parsedResponse.irn}`,
          errorContext: {
            invoiceId: invoice.id,
            fbrResponse: fbrResponse,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        data: { 
          irn: parsedResponse.irn, 
          invoiceId: updated.id,
          message: parsedResponse.message
        } 
      });
      
    } else {
      // Error - Handle FBR error response
      let errorCode = parsedResponse.errorCode;
      let errorMessage = parsedResponse.errorMessage;
      
      // Get all FBR error codes for better matching
      const allFbrErrorCodes = await prisma.fbrErrorCode.findMany({
        where: { isActive: true }
      });
      
      // Try to find matching error code in our database
      let fbrError = null;
      if (errorCode || errorMessage) {
        fbrError = findBestMatchingFbrError(errorCode, errorMessage, allFbrErrorCodes);
      }
      
      // Update invoice with error information
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          fbrResponse: {
            success: false,
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage,
            attemptedAt: new Date().toISOString(),
            response: fbrResponse
          },
          fbrErrorCode: errorCode,
          fbrErrorMessage: errorMessage
        },
      });
      
      // Log error
      await prisma.errorLog.create({
        data: {
          userId: user.id,
          errorCode: errorCode || "UNKNOWN",
          errorMessage: `FBR registration failed for invoice ${invoice.id}: ${errorMessage}`,
          errorContext: {
            invoiceId: invoice.id,
            fbrErrorCode: errorCode,
            fbrErrorMessage: errorMessage,
            fbrResponse: fbrResponse,
            matchedErrorCode: fbrError ? fbrError.code : null,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      // Return detailed error information
      return NextResponse.json({
        success: false,
        error: "FBR registration failed",
        errorCode: errorCode,
        errorMessage: errorMessage,
        briefDescription: fbrError?.briefDescription || "Unknown error occurred during FBR registration",
        details: fbrError ? {
          code: fbrError.code,
          message: fbrError.message,
          briefDescription: fbrError.briefDescription,
          category: fbrError.category,
          solution: getSolutionForErrorCode(fbrError.code)
        } : null,
        rawFbrResponse: fbrResponse
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error("FBR registration error:", error);
    
    // Log error
    try {
      await prisma.errorLog.create({
        data: {
          userId: user?.id,
          errorCode: "SYSTEM_ERROR",
          errorMessage: `System error during FBR registration: ${error.message}`,
          errorContext: {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    return NextResponse.json({ 
      error: "Registration failed", 
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Make HTTP request to FBR API
 * @param {Object} data - Invoice data in FBR format
 * @param {string} apiToken - FBR API token
 * @returns {Promise<Object>} - FBR API response
 */
async function callFBRAPI(data, apiToken) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FBR_API_TIMEOUT);
  
  try {
    const response = await fetch(FBR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        'User-Agent': 'FBR-Invoice-System/1.0'
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('FBR API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      
      if (response.status === 401) {
        throw new Error(`HTTP 401: Unauthorized - FBR API token may be invalid or expired. Please check your FBR credentials.`);
      } else if (response.status === 403) {
        throw new Error(`HTTP 403: Forbidden - Access denied by FBR API. Check API permissions.`);
      } else if (response.status === 400) {
        throw new Error(`HTTP 400: Bad Request - Invalid data sent to FBR API: ${errorText}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
    }
    
    const responseData = await response.json();
    return responseData;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('FBR API request timed out');
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error - unable to reach FBR API');
    }
    
    throw error;
  }
}


