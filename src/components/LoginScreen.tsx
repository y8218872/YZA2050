import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, UserCheck, AlertCircle, Sparkles } from "lucide-react";
import { User, Permissions } from "../types";

interface LoginScreenProps {
  onLoginSuccess: (user: { id: number; username: string; role: 'admin' | 'staff' }, permissions: Permissions) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [users, setUsers] = useState<Array<{ id: number; username: string; role: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // تحميل قائمة المستخدمين المتوفرين لتسجيل الدخول الفوري
  useEffect(() => {
    fetch("/api/auth/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        if (data.length > 0) {
          setSelectedUserId(String(data[0].id));
        }
      })
      .catch(err => {
        console.error("فشل الاتصال بالخادم", err);
        setError("فشل تحميل قائمة المستخدمين؛ تأكد من اتصال الخادم.");
      });
  }, []);

  const handleCharClick = (num: string) => {
    setError("");
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUserId) {
      setError("الرجاء تحديد حساب مستخدم أولاً");
      return;
    }
    if (pin.length !== 4) {
      setError("الرجاء إدخال الرمز السري المكون من 4 أرقام كاملاً");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, pin })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "رمز الدخول PIN غير صحيح");
      }

      onLoginSuccess(data.user, data.permissions);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع أثناء تسجيل الدخول");
      setPin(""); // مسح الرمز الخاطئ للمحاولة مجدداً
    } finally {
      setLoading(false);
    }
  };

  // إمكانية الإدخال عبر لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter") {
        if (pin.length === 4) {
          handleSubmit();
        }
      } else if (/^[0-9]$/.test(e.key)) {
        handleCharClick(e.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, selectedUserId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4">
      {/* عناصر جمالية في الخلفية */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700" />

      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl p-8 relative z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-550 bg-emerald-50 text-emerald-600 mb-4 shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">نظام حساباتي</h1>
          <p className="text-sm font-medium text-slate-500">لإدارة الذمم والعمليات المالية بالقيد المزدوج</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold flex items-start gap-2 animate-headShake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* اختيار حساب الموظف */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500">اختر حسابك الشخصي:</label>
            <div className="relative">
              <select
                id="userSelect"
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setError("");
                  setPin("");
                }}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white appearance-none transition-all cursor-pointer"
              >
                {users.length === 0 ? (
                  <option value="">جاري تحميل الحسابات المتاحة...</option>
                ) : (
                  users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.role === "admin" ? "مدير النظام" : "موظف مالي"})
                    </option>
                  ))
                )}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* خانات عرض الـ PIN الرقمي */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-500">أدخل رمز الدول PIN (4 أرقام):</label>
              <button
                type="button"
                id="togglePinView"
                onClick={() => setShowPin(!showPin)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 focus:outline-none"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPin ? "إخفاء الرمز" : "إظهار الرمز"}
              </button>
            </div>

            <div className="flex justify-center gap-4 py-2" dir="ltr">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-12 h-14 border-2 rounded-2xl flex items-center justify-center text-xl font-black transition-all duration-250 ${
                    pin.length > index
                      ? "border-emerald-500 bg-emerald-50/50 text-slate-800 shadow"
                      : "border-slate-200 bg-slate-50 text-slate-300"
                  }`}
                >
                  {pin.length > index ? (showPin ? pin[index] : "●") : "-"}
                </div>
              ))}
            </div>
          </div>

          {/* لوحة أزرار الأرقام الفخمة للأبواب الكودية */}
          <div className="grid grid-cols-3 gap-3 p-2 bg-slate-50 rounded-2xl" dir="ltr">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                id={`btn-pin-${num}`}
                onClick={() => handleCharClick(num)}
                disabled={loading || pin.length >= 4}
                className="h-12 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold text-lg rounded-xl shadow-xs border border-slate-100/80 active:scale-95 transition-all text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              id="btn-pin-clear"
              onClick={handleClear}
              className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-extrabold rounded-xl active:scale-95 transition-all focus:outline-none"
            >
              مسح
            </button>
            <button
              type="button"
              id="btn-pin-0"
              onClick={() => handleCharClick("0")}
              disabled={loading || pin.length >= 4}
              className="h-12 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold text-lg rounded-xl shadow-xs border border-slate-100/80 active:scale-95 transition-all focus:outline-none"
            >
              0
            </button>
            <button
              type="button"
              id="btn-pin-backspace"
              onClick={handleBackspace}
              className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-extrabold rounded-xl active:scale-95 transition-all flex items-center justify-center focus:outline-none"
            >
              ←
            </button>
          </div>

          {/* زر الولوج */}
          <button
            type="button"
            id="btnLoginSubmit"
            onClick={() => handleSubmit()}
            disabled={loading || pin.length !== 4}
            className="w-full h-12 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:cursor-not-allowed transform active:translate-y-0.5"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4 ml-1" />
                <span>الولوج الفوري الآمن</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-slate-150">
          <p className="text-xs text-slate-400 font-medium">الرمز السري الافتراضي للاختبار:</p>
          <div className="flex justify-center gap-4 mt-2">
            <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 font-bold">المدير: <code className="font-mono text-emerald-600">1234</code></span>
            <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 font-bold">الموظف: <code className="font-mono text-emerald-600">4321</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
