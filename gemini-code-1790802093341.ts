'use client';

import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, Cpu, Wallet, Activity, ArrowUpRight } from 'lucide-react';

export default function ProSatoshiMiner() {
  const walletAddress = "bc1qddn6a3szw0zkd0ykagp4nvckfqur26nwpl883j";
  const [hashSpeed, setHashSpeed] = useState<number>(100);
  const [satoshis, setSatoshis] = useState<number>(0.00);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // استرجاع الرصيد المحفوظ عند التحميل
  useEffect(() => {
    const savedBalance = localStorage.getItem('pro_satoshis');
    if (savedBalance) {
      setSatoshis(parseFloat(savedBalance));
    }
  }, []);

  // حلقة التعدين التراكمي
  useEffect(() => {
    const interval = setInterval(() => {
      if (hashSpeed > 0) {
        const earned = (hashSpeed / 10000) * (isBoosting ? 2 : 1);
        setSatoshis((prev) => {
          const newBalance = prev + earned;
          localStorage.setItem('pro_satoshis', newBalance.toString());
          return newBalance;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hashSpeed, isBoosting]);

  // دالة السحب المباشر للمحفظة الثابتة
  const handleWithdraw = async () => {
    const currentBalance = Math.floor(satoshis);

    if (currentBalance < 10) {
      alert("عذراً، الحد الأدنى للسحب هو 10 ساتوشي!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          amount_sats: currentBalance
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message}`);
        setSatoshis(0.00);
        localStorage.setItem('pro_satoshis', '0.00');
      } else {
        alert(`❌ فشل السحب: ${data.detail}`);
      }
    } catch (error) {
      alert("تعذر الاتصال بخادم المعالجة.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center font-sans" dir="rtl">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        
        {/* رأس التطبيق */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">منجم الساتوشي الخاص</h1>
              <span className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> مسار مباشر للمحفظة الشخصية
              </span>
            </div>
          </div>
          <div className="text-left">
            <span className="text-xs text-slate-400 block">الرصيد المكتسب</span>
            <span className="text-lg font-mono font-bold text-amber-400">{satoshis.toFixed(4)} ساتوشي</span>
          </div>
        </div>

        {/* عرض محفظة التحويل الثابتة */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block">عنوان المحفظة المستهدفة للإرسال المباشر:</span>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse overflow-hidden">
              <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-mono text-emerald-400 truncate">{walletAddress}</span>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">معتمد</span>
          </div>
        </div>

        {/* لوحة التحكم والسرعة (0 إلى 500 هاش) */}
        <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium">سرعة التعدين الافتراضية</span>
            </div>
            <span className="text-lg font-mono font-bold text-indigo-400">{hashSpeed} H/s</span>
          </div>

          <input 
            type="range" 
            min="0" 
            max="500" 
            step="10"
            value={hashSpeed} 
            onChange={(e) => setHashSpeed(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>0 H/s</span>
            <span>250 H/s</span>
            <span>500 H/s (القصوى)</span>
          </div>
        </div>

        {/* أزرار التحكم والسحب */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>الحالة: {hashSpeed > 0 ? 'يعمل بكفاءة' : 'متوقف'}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsBoosting(!isBoosting)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                isBoosting ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {isBoosting ? 'مضاعف (2x)' : 'تعزيز'}
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              {isLoading ? 'جاري التحويل...' : 'تحويل مباشر للمحفظة'}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}