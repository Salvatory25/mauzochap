// Code128 Barcode Generator in TypeScript (Subset B)
// Generates a clean, SVG vector representation of a barcode offline.

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232" // 100-105
];

const STOP_PATTERN = "2331112";

export function generateCode128(text: string): { svgContent: string; widths: number } {
  // Enforce printable ASCII Code 128 subset B characters
  const cleanText = text.replace(/[^\x20-\x7E]/g, "");
  if (!cleanText) return { svgContent: "", widths: 0 };

  const startValue = 104; // Start B
  let sum = startValue;
  const values: number[] = [startValue];

  for (let i = 0; i < cleanText.length; i++) {
    const val = cleanText.charCodeAt(i) - 32;
    values.push(val);
    sum += val * (i + 1);
  }

  const checksum = sum % 103;
  values.push(checksum);

  // Stop character index is not in patterns table, handled explicitly
  let widthsPattern = "";
  for (const val of values) {
    widthsPattern += CODE128_PATTERNS[val];
  }
  widthsPattern += STOP_PATTERN;

  // Render SVG elements
  let svgContent = "";
  let currentX = 0;
  
  for (let i = 0; i < widthsPattern.length; i++) {
    const width = parseInt(widthsPattern[i], 10);
    const isBar = i % 2 === 0; // Even is bar, odd is space
    
    if (isBar) {
      svgContent += `<rect x="${currentX}" y="0" width="${width}" height="80" fill="black" />`;
    }
    currentX += width;
  }

  return { svgContent, widths: currentX };
}
