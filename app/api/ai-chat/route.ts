import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, apiKey, transactions } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Riwayat pesan kosong atau tidak valid.' },
        { status: 400 }
      );
    }

    // Format transactions list for AI context
    const formattedTransactions = (transactions || [])
      .map((t: any) => {
        const typeStr = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        const formattedAmount = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(t.amount);
        return `- Tanggal: ${t.date}, Tipe: ${typeStr}, Jumlah: ${formattedAmount}, Kategori: ${t.category}, Catatan: "${t.note || '-'}"`;
      })
      .join('\n');

    const systemPrompt = `Kamu adalah "KasFlow Audit AI" — asisten akuntansi virtual cerdas dan pakar audit forensik keuangan. Tugas utama kamu adalah membantu pengguna KasFlow menganalisis transaksi keuangan mereka, mendeteksi potensi fraud (penipuan/kebocoran), serta mengidentifikasi anomali atau transaksi yang tidak jelas.

Gunakan kepribadian yang profesional, santun, bersahabat, dan membantu. Selalu gunakan Bahasa Indonesia dalam berkomunikasi.

Aturan Audit Keuangan:
1. **Deteksi Fraud & Kebocoran**: Cari pola pengeluaran tidak wajar, lonjakan jumlah pengeluaran mendadak yang tidak realistis, atau aliran keluar dana yang mencurigakan.
2. **Transaksi Gak Jelas**: Identifikasi transaksi yang memiliki keterangan/catatan kosong, menggunakan karakter acak (seperti "asdf", "test", dll.), atau jika kategorinya tidak sesuai dengan catatannya.
3. **Transaksi Duplikat**: Temukan transaksi dengan jumlah, tanggal, dan kategori yang persis sama dalam rentang waktu yang sama/berdekatan.
4. **Analisis Tren**: Berikan insight tentang pengeluaran terbesar, keseimbangan pemasukan vs pengeluaran, serta saran penghematan taktis.

Berikut adalah daftar seluruh transaksi aktif di sistem KasFlow pengguna saat ini:
${formattedTransactions || 'Belum ada transaksi tercatat di sistem saat ini.'}

Petunjuk Respons:
- Gunakan pemformatan Markdown yang kaya (tabel, poin-poin, cetak tebal) agar hasil audit mudah dibaca.
- Jika pengguna menanyakan hal yang sama sekali di luar topik keuangan, arahkan kembali secara halus.
- Selalu dukung saran finansial kamu dengan data angka riil dari daftar transaksi di atas.
- Jawab secara ringkas dan padat — hindari pengulangan yang tidak perlu.`;

    // Convert message history to Gemini format
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
    const latestMessage = messages[messages.length - 1].content;

    const text = await callGemini(async (genAI, modelName) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(latestMessage);
      return result.response.text();
    }, apiKey || undefined);

    return NextResponse.json({ success: true, reply: text });

  } catch (error: unknown) {
    console.error('AI Chatbot error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);

    if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
      return NextResponse.json(
        { error: 'API Key tidak valid. Pastikan API Key Gemini Anda benar.' },
        { status: 401 }
      );
    }
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Quota') || errMsg.includes('Too Many Requests') || errMsg.includes('exhausted')) {
      return NextResponse.json(
        { error: 'Semua kuota API Gemini habis. Silakan coba lagi nanti.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Gagal memproses obrolan: ${errMsg}` },
      { status: 500 }
    );
  }
}
