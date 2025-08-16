const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const salesErrorCodes = [
  {
    code: "0001",
    message: "Seller not registered for sales tax, please provide valid registration/NTN.",
    briefDescription: "Seller is not registered for sales tax, please provide valid seller registration/NTN.",
    category: "sales"
  },
  {
    code: "0002",
    message: "Invalid Buyer Registration No or NTN :",
    briefDescription: "Buyer Registration Number or NTN is not in proper format, please provide buyer registration number in 13 digits or NTN in 7 or 9 digits",
    category: "sales"
  },
  {
    code: "0003",
    message: "Provide proper invoice type.",
    briefDescription: "Invoice type is not valid or empty, please provide valid invoice type",
    category: "sales"
  },
  {
    code: "0005",
    message: "please provide date in valid format 01-DEC-2021",
    briefDescription: "Invoice date is not in proper format, please provide invoice date in \"YYYY-MM-DD\" format. For example: 2025-05-25",
    category: "sales"
  },
  {
    code: "0006",
    message: "Sale invoice not exist.",
    briefDescription: "Sales invoice does not exist against STWH",
    category: "sales"
  },
  {
    code: "0007",
    message: "Wrong Sale type is selected with invoice no (Invoice no)",
    briefDescription: "Selected invoice type is not associated with proper registration number, please select actual invoice type",
    category: "sales"
  },
  {
    code: "0008",
    message: "ST withheld at source should either be zero or same as sales tax/fed in st mode.",
    briefDescription: "ST withheld at source is not equal to zero or sales tax, please enter ST withheld at source zero or equal to sales tax",
    category: "sales"
  },
  {
    code: "0009",
    message: "Provide Buyer registration No.",
    briefDescription: "Buyer Registration Number cannot be empty, please provide proper buyer registration number",
    category: "sales"
  },
  {
    code: "0010",
    message: "Provide Buyer Name.",
    briefDescription: "Buyer Name cannot be empty, please provide valid buyer name",
    category: "sales"
  },
  {
    code: "0011",
    message: "Provide invoice type.",
    briefDescription: "Invoice type cannot be empty, please provide valid invoice type",
    category: "sales"
  },
  {
    code: "0012",
    message: "Provide Buyer Registration Type",
    briefDescription: "Buyer Registration type cannot be empty, please provide valid Buyer Registration type",
    category: "sales"
  },
  {
    code: "0013",
    message: "Provide valid Sale type.",
    briefDescription: "Sale type cannot be empty/null, please provide valid sale type",
    category: "sales"
  },
  {
    code: "0018",
    message: "Please provide Sales Tax/FED in ST Mode",
    briefDescription: "Sales Tax/FED cannot be empty, please valid provide Sales Tax/FED",
    category: "sales"
  },
  {
    code: "0019",
    message: "Please provide HSCode",
    briefDescription: "HS Code cannot be empty, please provide valid HS Code",
    category: "sales"
  },
  {
    code: "0020",
    message: "Please provide Rate",
    briefDescription: "Rate field cannot be empty, please provide Rate",
    category: "sales"
  },
  {
    code: "0021",
    message: "Please provide Value of Sales Excl. ST /Quantity",
    briefDescription: "Value of Sales Excl. ST /Quantity cannot be empty, Please provide valid Value of Sales Excl. ST /Quantity",
    category: "sales"
  },
  {
    code: "0022",
    message: "Please provide ST withheld at Source or STS Withheld",
    briefDescription: "ST withheld at Source or STS Withheld cannot be empty, Please provide valid ST withheld at Source or STS Withheld",
    category: "sales"
  },
  {
    code: "0023",
    message: "Please provide Sales Tax",
    briefDescription: "Sales Tax cannot be empty, Please provide valid Sales Tax",
    category: "sales"
  },
  {
    code: "0024",
    message: "Please provide ST withheld",
    briefDescription: "Sales Tax withheld cannot be empty, Please provide valid Sales Tax withheld",
    category: "sales"
  },
  {
    code: "0026",
    message: "Invoice Reference No. is required.",
    briefDescription: "Invoice Reference No. is mandatory requirement for debit/credit note. Please provide valid Invoice Reference No.",
    category: "sales"
  },
  {
    code: "0027",
    message: "Reason is required.",
    briefDescription: "Reason is mandatory requirement for debit/credit note. Please provide valid reason for debit/credit note",
    category: "sales"
  },
  {
    code: "0028",
    message: "Reason Remarks are required.",
    briefDescription: "Reason is selected as \"Others\". Please provide valid remarks against this reason",
    category: "sales"
  },
  {
    code: "0029",
    message: "Invoice date must be greater or equal to original invoice no.",
    briefDescription: "Debit/Credit note date should be equal or greater from original invoice date",
    category: "sales"
  },
  {
    code: "0030",
    message: "Unregistered distributer type not allowed before date",
    briefDescription: "Unregistered distributer type not allowed before system cut of date",
    category: "sales"
  },
  {
    code: "0031",
    message: "Provide Sales Tax",
    briefDescription: "Sales Tax is not mentioned, please provide Sales Tax",
    category: "sales"
  },
  {
    code: "0032",
    message: "STWH can only be created for GOV/FTN Holders.",
    briefDescription: "User is not FTN holder, STWH can only be created for GOV/FTN Holders without sales invoice.",
    category: "sales"
  },
  {
    code: "0034",
    message: "{0} only allowed within {1} days of invoice date of the original invoice",
    briefDescription: "Debit/Credit note can only be added within 180 days of original invoice date",
    category: "sales"
  },
  {
    code: "0035",
    message: "{0} date must be greater or equal to original invoice date.",
    briefDescription: "Note Date must be greater or equal to original invoice date",
    category: "sales"
  },
  {
    code: "0036",
    message: "Total {1} value of {0} invoice(s) is greater than {1} of original invoice. Value of Sales",
    briefDescription: "Credit Note Value of Sale must be less or equal to the value of Sale in original invoice.",
    category: "sales"
  },
  {
    code: "0037",
    message: "Total {1} value of {0} invoice(s) is greater than {1} of original invoice.ST Withheld as WH Agent",
    briefDescription: "Credit Note Value of ST Withheld must be less or equal to the value of ST Withheld in original invoice.",
    category: "sales"
  },
  {
    code: "0039",
    message: "Sale invoice not exist.",
    briefDescription: "For registered users, STWH invoice fields must be same as sale invoice",
    category: "sales"
  },
  {
    code: "0041",
    message: "Provide invoice No.",
    briefDescription: "Invoice number cannot be empty, please provide invoice number.",
    category: "sales"
  },
  {
    code: "0042",
    message: "Provide invoice date.",
    briefDescription: "Invoice date cannot be empty, please provide invoice date.",
    category: "sales"
  },
  {
    code: "0043",
    message: "Provide valid Date.",
    briefDescription: "Invoice date is not valid, please provide valid invoice date.",
    category: "sales"
  },
  {
    code: "0044",
    message: "Provide HS Code.",
    briefDescription: "HS Code cannot be empty, please provide HS Code",
    category: "sales"
  },
  {
    code: "0046",
    message: "Provide rate.",
    briefDescription: "Rate cannot be empty, please provide valid rate as per selected Sales Type.",
    category: "sales"
  },
  {
    code: "0050",
    message: "Please provide valid Sales Tax withheld. For sale type 'Cotton ginners', Sales Tax Withheld must be equal to Sales Tax or zero",
    briefDescription: "Please provide valid Sales Tax withheld. For sale type 'Cotton ginners', Sales Tax Withheld must be equal to Sales Tax or zero",
    category: "sales"
  },
  {
    code: "0052",
    message: "Please provide valid HS Code against invoice no:",
    briefDescription: "HS Code that does not match with provided sale type, Please provide valid HS Code against sale type",
    category: "sales"
  },
  {
    code: "0053",
    message: "Provided buyer registration type is invalid",
    briefDescription: "Buyer Registration Type is invalid, please provide valid Buyer Registration Type",
    category: "sales"
  },
  {
    code: "0055",
    message: "Please Provide ST Withheld as WH Agent",
    briefDescription: "Sales tax withheld cannot be empty or invalid format. Please provide valid sales tax withheld.",
    category: "sales"
  },
  {
    code: "0056",
    message: "Buyer not exists in steel sector.",
    briefDescription: "Buyer does not exist in steel sector",
    category: "sales"
  },
  {
    code: "0057",
    message: "Reference Invoice does not exist.",
    briefDescription: "Reference invoice for debit/ credit note does not exists. Please provide valid Invoice Reference No.",
    category: "sales"
  },
  {
    code: "0058",
    message: "Self-invoicing not allowed",
    briefDescription: "Buyer and Seller Registration number are same, this type of invoice is not allowed",
    category: "sales"
  },
  {
    code: "0064",
    message: "Reference invoice already exist.",
    briefDescription: "Credit note is already added to a invoice",
    category: "sales"
  },
  {
    code: "0067",
    message: "{1} of {0} invoice is greater than {1} of original invoice.",
    briefDescription: "Sales Tax value of Debit Note is greater than original invoice's sales tax",
    category: "sales"
  },
  {
    code: "0068",
    message: "{1} of {0} invoice is less than {1} of original invoice.",
    briefDescription: "Sales Tax value of Credit Note is less than original invoice's sales tax according to the rate.",
    category: "sales"
  },
  {
    code: "0070",
    message: "STWH cannot be created for unregistered buyers.",
    briefDescription: "User is not registered, STWH is allowed only for registered user",
    category: "sales"
  },
  {
    code: "0071",
    message: "Entry of {0} against the declared invoice is not allowed.",
    briefDescription: "Credit note allowed to add only for specific users",
    category: "sales"
  },
  {
    code: "0073",
    message: "Provide Sale Origination Province of Supplier",
    briefDescription: "Sale Origination Province of Supplier cannot be empty, please provide valid Sale Origination Province of Supplier.",
    category: "sales"
  },
  {
    code: "0074",
    message: "Provide Destination of Supply",
    briefDescription: "Destination of Supply cannot be empty, please provide valid Destination of Supply",
    category: "sales"
  },
  {
    code: "0077",
    message: "Provide SRO/Schedule No.",
    briefDescription: "SRO/Schedule Number cannot be empty, please provide valid SRO/Schedule Number",
    category: "sales"
  },
  {
    code: "0078",
    message: "Provide Item Sr. No.",
    briefDescription: "Item serial number cannot be empty, please provide valid item serial number",
    category: "sales"
  },
  {
    code: "0079",
    message: "If Value of Sales Excl. ST greater than {0}. Rate {1} not allowed.",
    briefDescription: "If sales value is greater than 20,000 than rate 5% is not allowed",
    category: "sales"
  },
  {
    code: "0080",
    message: "Please provide Further Tax",
    briefDescription: "Further Tax' cannot be empty, please provide valid Further Tax",
    category: "sales"
  },
  {
    code: "0081",
    message: "Please provide Input Credit not Allowed",
    briefDescription: "'Input Credit not Allowed' cannot be empty, please provide 'Input Credit not Allowed'",
    category: "sales"
  },
  {
    code: "0082",
    message: "The Seller is not registered for sales tax. Please provide a valid registration/NTN.",
    briefDescription: "The Seller is not registered for sales tax. Please provide a valid registration/NTN.",
    category: "sales"
  },
  {
    code: "0083",
    message: "Mismatch Seller Registration No.",
    briefDescription: "Seller Reg No. doesn't match. Please provide valid Seller Registration Number",
    category: "sales"
  },
  {
    code: "0085",
    message: "Please provide Total Value of Sales (In case of PFAD only)",
    briefDescription: "Total Value of Sales is not provided, please provide valid Total Value of Sales (In case of PFAD only)",
    category: "sales"
  },
  {
    code: "0086",
    message: "You are not an EFS license holder who has imported Compressor Scrap in the last 12 months.",
    briefDescription: "You are not an EFS license holder who has imported Compressor Scrap in the last 12 months.",
    category: "sales"
  },
  {
    code: "0087",
    message: "Petroleum Levy rates not configured properly.",
    briefDescription: "Petroleum Levy rates not configured properly. Please update levy rates properly",
    category: "sales"
  },
  {
    code: "0088",
    message: "Alphanumeric and (-) contained invoice No. is allowed. (-) should be in between Alphanumeric string.",
    briefDescription: "Invoice number is not valid, please provide valid invoice number in alphanumeric format. For example: Inv-001",
    category: "sales"
  },
  {
    code: "0089",
    message: "Please provide FED Charged",
    briefDescription: "FED Charged cannot be empty, please provide valid FED Charged",
    category: "sales"
  },
  {
    code: "0090",
    message: "Please provide Fixed / notified value or Retail Price",
    briefDescription: "Fixed / notified value or Retail Price cannot be empty, please provide valid Fixed / notified value or Retail Price",
    category: "sales"
  },
  {
    code: "0091",
    message: "Extra tax must be empty.",
    briefDescription: "Extra tax must be empty.",
    category: "sales"
  },
  {
    code: "0092",
    message: "Provide Valid Sale Type.",
    briefDescription: "Purchase type cannot be empty, please provide valid purchase type",
    category: "sales"
  },
  {
    code: "0093",
    message: "Selected Sale Type are not allowed to Manufacturer.",
    briefDescription: "Selected Sale is are not allowed to Manufacturer. Please select proper sale type",
    category: "sales"
  },
  {
    code: "0095",
    message: "Please provide Extra Tax",
    briefDescription: "Extra Tax cannot be empty, please provide valid extra tax",
    category: "sales"
  },
  {
    code: "0096",
    message: "For selected HSCode only KWH UOM is allowed.",
    briefDescription: "For provided HS Code, only KWH UOM is allowed",
    category: "sales"
  },
  {
    code: "0097",
    message: "Provide UOM KG.",
    briefDescription: "Please provide UOM in KG",
    category: "sales"
  },
  {
    code: "0098",
    message: "Please provide Quantity / Electricity Units",
    briefDescription: "Quantity / Electricity Unit cannot be empty, please provide valid Quantity / Electricity Unit",
    category: "sales"
  },
  {
    code: "0099",
    message: "Provide uom.",
    briefDescription: "UOM is not valid. UOM must be according to given HS Code",
    category: "sales"
  },
  {
    code: "0100",
    message: "Cotton Ginners allowed against registered buyers only.",
    briefDescription: "Registered user cannot add sale invoice. Only cotton ginner sale type is allowed for registered users.",
    category: "sales"
  },
  {
    code: "0101",
    message: "Please Use Toll Manufacturing Sale Type for Steel Sector.",
    briefDescription: "Sale type is not selected properly, please use Toll Manufacturing Sale Type for Steel Sector.",
    category: "sales"
  },
  {
    code: "0102",
    message: "Calculated tax not matched in 3rd schedule",
    briefDescription: "The calculated sales tax not calculated as per 3rd schedule calculation formula",
    category: "sales"
  },
  {
    code: "0103",
    message: "The calculated tax for Potassium Chlorate does not match.",
    briefDescription: "Calculated tax not matched for potassium chlorate. Calculated value doesn't match according to potassium chlorate for sales potassium invoices.",
    category: "sales"
  },
  {
    code: "0104",
    message: "The calculated percentage sales tax does not match.",
    briefDescription: "Calculated percentage of sales tax not matched. Calculation must be correct with respect to provided rate",
    category: "sales"
  },
  {
    code: "0105",
    message: "The calculated sales tax for the quantity is incorrect.",
    briefDescription: "The calculated sales tax for the quantity is incorrect.",
    category: "sales"
  },
  {
    code: "0106",
    message: "The Buyer is not registered for sales tax. Please provide a valid registration/NTN.",
    briefDescription: "The Buyer is not registered for sales tax. Please provide a valid registration/NTN.",
    category: "sales"
  },
  {
    code: "0107",
    message: "Mismatch Buyer Registration No.",
    briefDescription: "Buyer Reg No. doesn't match. Please provide valid Buyer Registration Number",
    category: "sales"
  },
  {
    code: "0108",
    message: "Invalid Seller Registration No or NTN",
    briefDescription: "Seller Reg No. is not valid. Please provide valid Seller Registration Number/NTN",
    category: "sales"
  },
  {
    code: "0109",
    message: "Wrong invoice type is selected in invoice no",
    briefDescription: "Invoice type is not selected properly, please select proper invoice type",
    category: "sales"
  },
  {
    code: "0111",
    message: "Wrong purchase type is selected with invoice no",
    briefDescription: "Purchase type is not selected properly, please provide proper purchase type",
    category: "sales"
  },
  {
    code: "0113",
    message: "System is unable to parse date. Please provide date in valid format dd-MMM-yy.",
    briefDescription: "Date is not in proper format, please provide date in \"YYYY-MM-DD\" format. For example: 2025-05-25",
    category: "sales"
  },
  {
    code: "0300",
    message: "Provided decimal value is not valid at field",
    briefDescription: "Discount Value is not valid at item 1 | Total Value is not valid at item 1 | Fed Payable Value is not valid at item 1 | Extra Tax Value is not valid at item 1 | Further Tax Value is not valid at item 1 | SalesTaxWithheldAtSource Value is not valid at item 1 | Quantity Value is not valid at item 1",
    category: "sales"
  }
];

const purchaseErrorCodes = [
  {
    code: "0156",
    message: "Invalid NTN / Reg No. provided.",
    briefDescription: "NTN/Reg. No is invalid/Null, please provide valid NTN/Reg. No.",
    category: "purchase"
  },
  {
    code: "0157",
    message: "The Buyer is not registered for sales tax. Please provide a valid registration/NTN..",
    briefDescription: "The Buyer is not registered for sales tax. Please provide valid Registration/NTN.",
    category: "purchase"
  },
  {
    code: "0158",
    message: "Mismatch Buyer Registration No.",
    briefDescription: "Buyer Reg No. doesn't match. Please provide valid Buyer Registration Number",
    category: "purchase"
  },
  {
    code: "0159",
    message: "FTN holder as seller not allowed for purchases.",
    briefDescription: "FTN Holder as Seller is not allowed for purchases",
    category: "purchase"
  },
  {
    code: "0160",
    message: "Provide Buyer Name.",
    briefDescription: "Buyer Name cannot be empty, please provide valid buyer name",
    category: "purchase"
  },
  {
    code: "0161",
    message: "Invoice Date must be greater or equal to {0}",
    briefDescription: "Invoice Date must be greater or equal to original sale invoice date",
    category: "purchase"
  },
  {
    code: "0162",
    message: "Provide Sale Type.",
    briefDescription: "Sale Type cannot be empty/Invalid, please provide valid Sale Type",
    category: "purchase"
  },
  {
    code: "0163",
    message: "Selected Sale Type are not allowed to Manufacturer.",
    briefDescription: "Provided Sale Type is not allowed for Manufacturer.",
    category: "purchase"
  },
  {
    code: "0164",
    message: "For selected HSCode only KWH UOM is allowed.",
    briefDescription: "For provided HS Code, only KWH UOM is allowed",
    category: "purchase"
  },
  {
    code: "0165",
    message: "Provide UOM KG.",
    briefDescription: "Please provide UOM in KG",
    category: "purchase"
  },
  {
    code: "0166",
    message: "Please provide Quantity / Electricity Units",
    briefDescription: "Quantity / Electricity Unit cannot be empty, please provide valid Quantity / Electricity Unit",
    category: "purchase"
  },
  {
    code: "0167",
    message: "Provide Value of Sales Excl. ST",
    briefDescription: "Value of Sales Excl. ST cannot be empty/Invalid, please provide valid Value of Sales Excl. ST",
    category: "purchase"
  },
  {
    code: "0168",
    message: "Cotton Ginners allowed against registered buyers only.",
    briefDescription: "Only cotton ginner purchase type is allowed for registered users.",
    category: "purchase"
  },
  {
    code: "0169",
    message: "STWH can only be created for GOV/FTN Holders.",
    briefDescription: "User is not FTN holder, STWH can only be created for GOV/FTN Holders without purchase invoice.",
    category: "purchase"
  },
  {
    code: "0170",
    message: "If Value of Sales Excl. ST greater than {0}. Rate {1} not allowed.",
    briefDescription: "If Value of Sales Excl. ST greater than 20000 than rate 5% is not allowed.",
    category: "purchase"
  },
  {
    code: "0171",
    message: "You are not an EFS license holder who has imported Compressor Scrap in the last 12 months.",
    briefDescription: "You are not an EFS license holder who has imported Compressor Scrap in the last 12 months.",
    category: "purchase"
  },
  {
    code: "0172",
    message: "Petroleum Levy rates not configured properly.",
    briefDescription: "Petroleum Levy rates not configured properly. Please update levy rates properly",
    category: "purchase"
  },
  {
    code: "0173",
    message: "Alphanumeric and (-) contained invoice No. is allowed. (-) should be in between Alphanumeric string.",
    briefDescription: "Invoice number is not valid, please provide valid invoice number in alphanumeric format. For example: Inv-001",
    category: "purchase"
  },
  {
    code: "0174",
    message: "Please provide Sales Tax",
    briefDescription: "Sales Tax cannot be empty, please provide valid Sales Tax",
    category: "purchase"
  },
  {
    code: "0175",
    message: "Please provide Fixed / notified value or Retail Price",
    briefDescription: "Fixed / notified value or Retail Price cannot be empty, please provide valid Fixed / notified value or Retail Price",
    category: "purchase"
  },
  {
    code: "0176",
    message: "Please provide ST withheld at Source",
    briefDescription: "ST withheld at Source cannot be empty, please provide valid ST withheld at Source",
    category: "purchase"
  },
  {
    code: "0177",
    message: "Please provide Further Tax",
    briefDescription: "Further Tax cannot be empty, please provide valid further tax",
    category: "purchase"
  }
];

async function main() {
  console.log('Starting to seed FBR error codes...');

  // Clear existing error codes
  await prisma.fbrErrorCode.deleteMany({});

  // Insert sales error codes
  for (const errorCode of salesErrorCodes) {
    await prisma.fbrErrorCode.create({
      data: errorCode
    });
  }

  // Insert purchase error codes
  for (const errorCode of purchaseErrorCodes) {
    await prisma.fbrErrorCode.create({
      data: errorCode
    });
  }

  console.log(`Seeded ${salesErrorCodes.length + purchaseErrorCodes.length} FBR error codes successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
