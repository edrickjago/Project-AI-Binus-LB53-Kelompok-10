import { NextRequest, NextResponse } from 'next/server';
import { callGemini, withRetry } from '@/lib/gemini';

const PROMPT = `Extract ALL transactions from this spreadsheet data as compact JSON.

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

function recoverJson(raw: string): string {
  let s = raw.trimEnd();
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (const ch of s) {
    if (escape)                  { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true;  continue; }
    if (ch === '"')              { inString = !inString; continue; }
    if (inString)                { continue; }
    if (ch === '{')              { stack.push('}'); }
    else if (ch === '[')         { stack.push(']'); }
    else if (ch === '}' || ch === ']') { stack.pop(); }
  }

  if (inString) s += '"';
  s = s.replace(/,\s*"[^"]*"\s*:\s*$/, '');
  s = s.replace(/,\s*"[^"]*"\s*$/,     '');
  s = s.replace(/,\s*$/,               '');
  return s + stack.reverse().join('');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvText, fileName, apiKey } = body;

    if (!csvText) {
      return NextResponse.json({ error: 'Tidak ada data yang dikirim.' }, { status: 400 });
    }

    const fullPrompt = `${PROMPT}\n\n--- DATA (${fileName || 'file'}) ---\n${csvText}\n--- END ---`;

    const text = await callGemini(async (genAI, modelName) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: 32768, temperature: 0.1 },
      });
      const result = await withRetry(() => model.generateContent(fullPrompt));
      return result.response.text();
    }, apiKey || undefined);

    let jsonStr = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1];
    jsonStr = jsonStr.trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      try {
        parsed = JSON.parse(recoverJson(jsonStr));
        console.warn('[Gemini] JSON truncated — recovered successfully');
      } catch (recoverErr) {
        console.error('[Gemini] JSON unrecoverable:', recoverErr);
        throw new SyntaxError('Unrecoverable JSON from AI response');
      }
    }

    if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
      return NextResponse.json(
        { error: 'AI tidak dapat mengenali transaksi dari data ini.' },
        { status: 422 }
      );
    }

    const validTransactions = parsed.transactions
      .filter((tx: any) => tx.date && tx.type && tx.amount && Number(tx.amount) > 0)
      .map((tx: any) => {
        const mappedType = tx.type === 'income' ? 'income' : 'expense';
        return {
          date:         String(tx.date),
          type:         mappedType,
          amount:       Math.abs(Number(tx.amount)),
          category:     normalizeCategory(String(tx.category || ''), mappedType),
          note:         String(tx.note || ''),
          activityType: ['operating', 'investing', 'financing'].includes(String(tx.activityType)) ? String(tx.activityType) : 'operating',
          fraudRisk:    ['low', 'medium', 'high'].includes(String(tx.fraudRisk)) ? String(tx.fraudRisk) : 'low',
          fraudNote:    String(tx.fraudNote || ''),
        };
      });

    return NextResponse.json({
      success:          true,
      documentType:     parsed.documentType || 'Spreadsheet',
      period:           parsed.period || '-',
      accountName:      parsed.accountName || '-',
      overallFraudRisk: ['low', 'medium', 'high'].includes(parsed.overallFraudRisk) ? parsed.overallFraudRisk : 'low',
      aiConclusion:     parsed.aiConclusion || '',
      transactions:     validTransactions,
      rawCount:         parsed.transactions.length,
      validCount:       validTransactions.length,
    });

  } catch (error: any) {
    const errMsg = error?.message || String(error);
    console.error('Scan spreadsheet error:', error);

    if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid'))
      return NextResponse.json({ error: 'API Key tidak valid.' }, { status: 401 });
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('exhausted'))
      return NextResponse.json({ error: 'Semua kuota API Gemini habis. Silakan coba lagi nanti.' }, { status: 429 });
    if (errMsg.includes('Unrecoverable') || errMsg.includes('SyntaxError'))
      return NextResponse.json({ error: 'AI memberikan respons yang tidak dapat diproses. Coba lagi.' }, { status: 422 });
    if (errMsg.includes('503') || errMsg.includes('overloaded'))
      return NextResponse.json({ error: 'Server AI sedang sibuk. Silakan coba lagi.' }, { status: 503 });

    return NextResponse.json({ error: `Terjadi kesalahan: ${errMsg}` }, { status: 500 });
  }
}
