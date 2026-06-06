import { NextRequest, NextResponse } from 'next/server';
import { callGemini, withRetry } from '@/lib/gemini';

// Compact prompt — short field values = fewer tokens = less truncation risk
const PROMPT = `Extract ALL transactions from this financial document as compact JSON.

For each transaction:
- "date": YYYY-MM-DD (use 2026 if year missing)
- "type": "income" or "expense"
- "amount": positive number only
- "category": one of — income: "💼 Gaji","🏪 Bisnis","📈 Investasi","🎁 Bonus","💻 Freelance","📦 Lainnya" | expense: "🍜 Makanan","🚗 Transportasi","📱 Tagihan","🎮 Hiburan","🏥 Kesehatan","🛍️ Belanja","📚 Pendidikan","🏠 Rumah","📦 Lainnya"
- "note": max 6 words
- "activityType": "operating","investing", or "financing"
- "fraudRisk": "low","medium", or "high"
- "fraudNote": max 5 words

Also output:
- "documentType": short label
- "period": date range or "-"
- "accountName": name or "-"
- "overallFraudRisk": "low","medium","high"
- "aiConclusion": max 2 sentences

Rules:
- Skip opening/closing balances
- Return ONLY valid JSON, no markdown
- Be as brief as possible in all string values

Format:
{"documentType":"...","period":"...","accountName":"...","overallFraudRisk":"low","aiConclusion":"...","transactions":[{"date":"2026-01-15","type":"income","amount":5000000,"category":"💼 Gaji","note":"Gaji bulanan","activityType":"operating","fraudRisk":"low","fraudNote":"Rutin wajar"}]}`;

function normalizeCategory(category: string, type: 'income' | 'expense'): string {
  const clean = category.toLowerCase().replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '').trim();

  if (type === 'income') {
    if (clean.includes('gaji') || clean.includes('salary') || clean.includes('upah')) return '💼 Gaji';
    if (clean.includes('bonus') || clean.includes('hadiah') || clean.includes('gift') || clean.includes('thr')) return '🎁 Bonus';
    if (clean.includes('freelance') || clean.includes('proyek') || clean.includes('project') || clean.includes('sampingan')) return '💻 Freelance';
    if (clean.includes('invest') || clean.includes('saham') || clean.includes('bunga') || clean.includes('dividen')) return '📈 Investasi';
    if (clean.includes('bisnis') || clean.includes('usaha') || clean.includes('penjualan') || clean.includes('sales')) return '🏪 Bisnis';
    return '📦 Lainnya';
  } else {
    if (clean.includes('makan') || clean.includes('minum') || clean.includes('restoran') || clean.includes('kuliner') || clean.includes('food') || clean.includes('beverage') || clean.includes('kopi')) return '🍜 Makanan';
    if (clean.includes('transport') || clean.includes('bensin') || clean.includes('gojek') || clean.includes('grab') || clean.includes('taxi') || clean.includes('parkir') || clean.includes('tol') || clean.includes('kendaraan')) return '🚗 Transportasi';
    if (clean.includes('tagihan') || clean.includes('listrik') || clean.includes('air') || clean.includes('telepon') || clean.includes('internet') || clean.includes('pulsa') || clean.includes('wifi') || clean.includes('bill')) return '📱 Tagihan';
    if (clean.includes('hiburan') || clean.includes('nonton') || clean.includes('game') || clean.includes('travel') || clean.includes('wisata') || clean.includes('entertainment') || clean.includes('bioskop')) return '🎮 Hiburan';
    if (clean.includes('sehat') || clean.includes('dokter') || clean.includes('obat') || clean.includes('rs') || clean.includes('rumah sakit') || clean.includes('apotek') || clean.includes('klinik') || clean.includes('medis')) return '🏥 Kesehatan';
    if (clean.includes('belanja') || clean.includes('shop') || clean.includes('supermarket') || clean.includes('mall') || clean.includes('pakaian') || clean.includes('baju') || clean.includes('sepatu') || clean.includes('e-commerce') || clean.includes('tokopedia') || clean.includes('shopee')) return '🛍️ Belanja';
    if (clean.includes('didik') || clean.includes('sekolah') || clean.includes('kuliah') || clean.includes('buku') || clean.includes('kursus') || clean.includes('seminar') || clean.includes('education') || clean.includes('pelatihan')) return '📚 Pendidikan';
    if (clean.includes('rumah') || clean.includes('sewa') || clean.includes('kos') || clean.includes('kontrakan') || clean.includes('home') || clean.includes('perbaikan rumah')) return '🏠 Rumah';
    return '📦 Lainnya';
  }
}

/**
 * Robustly recovers a truncated JSON string.
 * Handles truncation mid-string, mid-key, mid-value, or trailing comma.
 */
function recoverJson(raw: string): string {
  let s = raw.trimEnd();

  // Detect position state by scanning character by character
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (const ch of s) {
    if (escape)              { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"')          { inString = !inString; continue; }
    if (inString)            { continue; }
    if (ch === '{')          { stack.push('}'); }
    else if (ch === '[')     { stack.push(']'); }
    else if (ch === '}' || ch === ']') { stack.pop(); }
  }

  // 1. If we stopped inside a string value, close the string
  if (inString) s += '"';

  // 2. Remove any dangling incomplete token after the last complete value:
  //    "key":           → remove (no value yet)
  //    "key": "val", "incomplete  → already closed above
  //    trailing comma
  s = s.replace(/,\s*"[^"]*"\s*:\s*$/,  '');  // trailing "key":
  s = s.replace(/,\s*"[^"]*"\s*$/,      '');  // trailing bare "key"
  s = s.replace(/,\s*$/,                '');  // trailing comma

  // 3. Close open structures in reverse order
  return s + stack.reverse().join('');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, mimeType, apiKey } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'Tidak ada gambar/file yang dikirim.' },
        { status: 400 }
      );
    }

    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: mimeType || 'image/jpeg',
      },
    };

    const text = await callGemini(async (genAI, modelName) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: 32768, temperature: 0.1 },
      });
      const result = await withRetry(() => model.generateContent([PROMPT, imagePart]));
      return result.response.text();
    }, apiKey || undefined);

    // Parse JSON — with markdown stripping + truncation recovery
    let jsonStr = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1];
    jsonStr = jsonStr.trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      try {
        const recovered = recoverJson(jsonStr);
        parsed = JSON.parse(recovered);
        console.warn('[Gemini] JSON truncated — recovered successfully');
      } catch (recoverErr) {
        console.error('[Gemini] JSON unrecoverable:', recoverErr);
        throw new SyntaxError('Unrecoverable JSON from AI response');
      }
    }

    if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
      return NextResponse.json(
        { error: 'AI tidak dapat mengenali transaksi dari dokumen ini. Pastikan dokumen berisi statement cashflow atau mutasi rekening.' },
        { status: 422 }
      );
    }

    const validTransactions = parsed.transactions
      .filter((tx: Record<string, unknown>) => tx.date && tx.type && tx.amount && Number(tx.amount) > 0)
      .map((tx: Record<string, unknown>) => {
        const mappedType = tx.type === 'income' ? 'income' as const : 'expense' as const;
        return {
          date: String(tx.date),
          type: mappedType,
          amount: Math.abs(Number(tx.amount)),
          category: normalizeCategory(String(tx.category || ''), mappedType),
          note: String(tx.note || ''),
          activityType: ['operating', 'investing', 'financing'].includes(String(tx.activityType)) ? String(tx.activityType) : 'operating',
          fraudRisk: ['low', 'medium', 'high'].includes(String(tx.fraudRisk)) ? String(tx.fraudRisk) : 'low',
          fraudNote: String(tx.fraudNote || ''),
        };
      });

    return NextResponse.json({
      success: true,
      documentType: parsed.documentType || 'Unknown',
      period: parsed.period || '-',
      accountName: parsed.accountName || '-',
      overallFraudRisk: ['low', 'medium', 'high'].includes(parsed.overallFraudRisk) ? parsed.overallFraudRisk : 'low',
      aiConclusion: parsed.aiConclusion || '',
      transactions: validTransactions,
      rawCount: parsed.transactions.length,
      validCount: validTransactions.length,
    });

  } catch (error: unknown) {
    console.error('Scan cashflow error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);

    if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid'))
      return NextResponse.json({ error: 'API Key tidak valid.' }, { status: 401 });
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('exhausted'))
      return NextResponse.json({ error: 'Semua kuota API Gemini habis. Silakan coba lagi nanti.' }, { status: 429 });
    if (errMsg.includes('Unrecoverable') || errMsg.includes('SyntaxError'))
      return NextResponse.json({ error: 'AI memberikan respons yang tidak dapat diproses. Silakan coba lagi.' }, { status: 422 });
    if (errMsg.includes('503') || errMsg.includes('overloaded'))
      return NextResponse.json({ error: 'Server AI sedang sibuk. Silakan coba lagi dalam beberapa menit.' }, { status: 503 });

    return NextResponse.json({ error: `Terjadi kesalahan: ${errMsg}` }, { status: 500 });
  }
}
