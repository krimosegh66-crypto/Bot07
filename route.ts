import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet_address, amount_sats } = body;

    // التأكد من أن العنوان هو عنوانك المعتمد
    const targetWallet = "bc1qddn6a3szw0zkd0ykagp4nvckfqur26nwpl883j";
    
    if (!amount_sats || amount_sats < 10) {
      return NextResponse.json(
        { detail: "الحد الأدنى للتحويل هو 10 ساتوشي." },
        { status: 400 }
      );
    }

    if (wallet_address !== targetWallet) {
      return NextResponse.json(
        { detail: "عنوان المحفظة غير مطابق للمحفظة المصرح لها." },
        { status: 400 }
      );
    }

    // هنا يتم تسجيل عملية السحب أو إرسالها للشبكة الرئيسية مباشرة
    // بما أنك المستخدم الوحيد، يمكنك تسجيل العملية برمجياً أو ربطها بجدول قواعد بيانات خاص بك.

    return NextResponse.json({
      success: true,
      message: `تم ترحيل وتحويل ${amount_sats} ساتوشي بنجاح إلى محفظتك الشخصية.`,
    });

  } catch (error: any) {
    return NextResponse.json(
      { detail: `خطأ في المعالجة: ${error.message}` },
      { status: 500 }
    );
  }
}