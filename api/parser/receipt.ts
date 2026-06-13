import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, fileType } = req.body;
    if (!image || !fileType) {
      return res.status(400).json({ error: 'Missing image payload or fileType metadata' });
    }

    console.log('[API] Processing receipt parser request. Image length:', image.length, 'File type:', fileType);

    /*
      System Prompt for AI/LLM model:
      -------------------------------------------------------
      You are a premium financial receipt parsing engine.
      Input: A base64 encoded image string (receipt screenshot or bank alert) and its file type metadata.
      
      Task: Cleanly analyze the image and extract:
        - Vendor/Recipient Name (standard text, e.g. Ikeja Electric Prepaid (@pocket_power))
        - Grand Total Amount (as a clean floating point number, stripped of currency symbols)
        - Transaction Date (formatted exactly as YYYY-MM-DD)
        - Description/Memo (Reference tokens, transaction reference numbers, or key billing codes)

      Strict JSON output structure:
      {
        "vendor": string,
        "amount": number,
        "date": string,
        "memo": string,
        "category_suggestion": string
      }
      -------------------------------------------------------
    */

    // Simulate OCR AI parsing logic based on receipt type/heuristics
    // In production, this would call Google Gemini API or OpenAI API with the base64 image data.
    const isPocketOrScreenshot = image.length > 50000;

    return res.status(200).json({
      vendor: isPocketOrScreenshot ? "Ikeja Electric Prepaid (@pocket_power)" : "INGESTED_MERCHANT",
      amount: isPocketOrScreenshot ? 3500.00 : 120.00,
      date: isPocketOrScreenshot ? "2026-05-26" : new Date().toISOString().split('T')[0],
      memo: isPocketOrScreenshot 
        ? "Bill payment for Ikeja Electricity recharge (pocket_p2p_2866688638339669)" 
        : "Parsed from screen snapshot",
      category_suggestion: isPocketOrScreenshot ? "utilities" : "general"
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}
