import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet_address, lightning_invoice, amount_sats } = body;

    // 1. التحقق من الحد الأدنى للسحب
    if (!amount_sats || amount_sats < 10) {
      return NextResponse.json(
        { detail: "الحد الأدنى للسحب هو 10 ساتوشي." },
        { status: 400 }
      );
    }

    // 2. التحقق من صحة فاتورة شبكة البرق
    if (!lightning_invoice || !lightning_invoice.startsWith("lnbc")) {
      return NextResponse.json(
        { detail: "فاتورة شبكة البرق غير صالحة (يجب أن تبدأ بـ lnbc)." },
        { status: 400 }
      );
    }

    // 3. بيانات الاتصال بعقدة شبكة البرق (مثل LNbits أو Zebedee)
    const lnApiUrl = process.env.LN_NODE_URL || "https://api.lnbits.com/api/v1/payments";
    const lnApiKey = process.env.LN_API_KEY;

    if (!lnApiKey) {
      return NextResponse.json(
        { detail: "لم يتم ضبط مفتاح شبكة البرق (API Key) في إعدادات السيرفر." },
        { status: 500 }
      );
    }

    // 4. إرسال طلب الدفع الفوري عبر شبكة البرق
    const response = await fetch(lnApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': lnApiKey,
      },
      body: JSON.stringify({
        out: true, // عملية دفع خارجي (Withdrawal)
        bolt11: lightning_invoice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { detail: `فشل الدفع من عقدة شبكة البرق: ${errorText}` },
        { status: 400 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: `تم تحويل ${amount_sats} ساتوشي بنجاح إلى محفظتك عبر شبكة البرق!`,
      data,
    });

  } catch (error: any) {
    return NextResponse.json(
      { detail: `خطأ في الخادم الداخلي: ${error.message}` },
      { status: 500 }
    );
  }
}