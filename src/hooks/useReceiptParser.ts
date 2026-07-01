// src/hooks/useReceiptParser.ts
import { useState } from 'react';
import { mapCategoryToWorkspace } from '../utils/parser';
import { useAppStore } from '../store';

export interface ParsedReceipt {
  vendor:              string;
  amount:              string;
  date:                string;
  memo:                string;
  categoryId:          string;
}

export interface UseReceiptParserReturn {
  isParsing:     boolean;
  parseError:    string | null;
  parseReceipt:  (file: File) => Promise<ParsedReceipt | null>;
}

export function useReceiptParser(): UseReceiptParserReturn {
  const categories = useAppStore(s => s.categories);
  const [isParsing,  setIsParsing]  = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const parseReceipt = async (file: File): Promise<ParsedReceipt | null> => {
    setIsParsing(true);
    setParseError(null);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) throw new Error('VITE_OPENAI_API_KEY missing from environment.');

      let safeMimeType = file.type;
      if (!safeMimeType) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        safeMimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      }

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:           'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role:    'system',
              content: `You are a financial parsing engine. Extract values and return ONLY this JSON shape:
{"vendor": string, "amount": number, "date": "YYYY-MM-DD", "memo": string, "category_suggestion": "utilities"|"food"|"shopping"|"transport"|"other"}`,
            },
            {
              role:    'user',
              content: [
                { type: 'text',      text: 'Extract transaction details from this image.' },
                { type: 'image_url', image_url: { url: `data:${safeMimeType};base64,${base64Data}` } },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI ${res.status}: ${errText}`);
      }

      const data      = await res.json();
      const cleanJSON = JSON.parse(data.choices[0].message.content);

      return {
        vendor:     cleanJSON.vendor    || 'Unknown Merchant',
        amount:     cleanJSON.amount    ? cleanJSON.amount.toString() : '',
        date:       cleanJSON.date      || new Date().toISOString().split('T')[0],
        memo:       cleanJSON.memo      || '',
        categoryId: mapCategoryToWorkspace(cleanJSON.category_suggestion || '', categories),
      };

    } catch (err: any) {
      console.error('[KINY] Receipt parse error:', err);
      setParseError(err.message || 'Failed to parse receipt image.');
      return null;
    } finally {
      setIsParsing(false);
    }
  };

  return { isParsing, parseError, parseReceipt };
}
