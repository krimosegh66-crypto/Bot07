from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os

app = FastAPI(title="Satoshi Miner Lightning Backend", version="1.0")

# السماح للواجهة الأمامية (Frontend) بالاتصال بالسيرفر
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # في الإنتاج، حدد النطاق المسموح بدلاً من "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# إعدادات الاتصال بعقدة شبكة البرق (Lightning Node / LND أو LNbits)
# يمكنك استبدال هذه البيانات ببيانات عقدتك الحقيقية أو مزود الخدمة (مثل LNbits أو Zebedee)
LIGHTNING_NODE_URL = os.getenv("LN_NODE_URL", "https://api.lnbits.com/api/v1/payments")
LIGHTNING_API_KEY = os.getenv("LN_API_KEY", "YOUR_LNBITS_INVOICE_OR_ADMIN_KEY")

# نموذج البيانات القادمة من التطبيق عند طلب السحب
class WithdrawRequest(BaseModel):
    wallet_address: str  # عنوان المحفظة أو معرف المستخدم
    lightning_invoice: str  # فاتورة شبكة البرق (lnbc...)
    amount_sats: int  # عدد الساتوشي المطلوب سحبه

@app.post("/api/withdraw")
async def process_lightning_withdrawal(data: WithdrawRequest):
    # 1. التحقق من الحد الأدنى للسحب (مثلاً 10 ساتوشي)
    if data.amount_sats < 10:
        raise HTTPException(status_code=400, detail="الحد الأدنى للسحب هو 10 ساتوشي.")

    # 2. التحقق من صحة فاتورة شبكة البرق
    if not data.lightning_invoice.startswith("lnbc"):
        raise HTTPException(status_code=400, detail="فاتورة شبكة البرق غير صالحة (يجب أن تبدأ بـ lnbc).")

    # 3. إرسال الأموال عبر شبكة البرق (التواصل مع العقدة أو بوابة الدفع)
    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "out": True,  # دفع خارجي (Withdrawal)
                "bolt11": data.lightning_invoice
            }
            headers = {
                "X-Api-Key": LIGHTNING_API_KEY,
                "Content-Type": "application/json"
            }

            # تنفيذ الطلب إلى عقدة شبكة البرق
            response = await client.post(LIGHTNING_NODE_URL, json=payload, headers=headers, timeout=10.0)
            
            if response.status_code == 201 or response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "message": f"تم إرسال {data.amount_sats} ساتوشي بنجاح عبر شبكة البرق!",
                    "payment_details": result
                }
            else:
                # في حال حدوث خطأ من العقدة
                raise HTTPException(status_code=400, detail=f"فشل الدفع عبر شبكة البرق: {response.text}")

        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"خطأ في الاتصال بششبكة البرق: {str(e)}")

@app.get("/")
def home():
    return {"status": "Satoshi Miner Lightning Backend is running!"}