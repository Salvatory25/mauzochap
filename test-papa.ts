import Papa from "papaparse";

const csvData = `Name,Category,Barcode,Price,Cost,Stock,Low Stock Alert,Unit
Unga wa Sembe 10kg,Groceries,10000000100,28000,22500,80,10,kg
Unga wa Ngano 2kg,Groceries,10000000101,11500,9500,36,5,kg`;

Papa.parse(csvData, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    console.log(JSON.stringify(results, null, 2));
  }
});
