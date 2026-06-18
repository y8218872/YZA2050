import React, { useState, useEffect } from "react";
import { 
  BookOpen, Calendar, HelpCircle, ArrowUpRight, ArrowDownLeft, 
  Printer, DollarSign, PlusCircle, Trash2, ShieldAlert, Sparkles, AlertCircle 
} from "lucide-react";
import { Client, Transaction, Permissions } from "../types";

interface LedgerScreenProps {
  currentUser: { id: number; username: string; role: 'admin' | 'staff' };
  permissions: Permissions;
}

export default function LedgerScreen({ currentUser, permissions }: LedgerScreenProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // حقول نموذج تقييد القيود المالية الجديدة
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"debt" | "payment">("debt");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState("");

  const loadClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data);
      if (data.length > 0 && !selectedClientId) {
        setSelectedClientId(String(data[0].id));
      }
    } catch (err) {
      console.error("فشل التحميل", err);
    }
  };

  const loadLedger = async () => {
    if (!selectedClientId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/transactions?clientId=${selectedClientId}`);
      if (!res.ok) throw new Error("عذراً، فشل جلب حركات كشف هذا العميل");
      const data = await res.json();
      // لترتيب الرصيد التراكمي زمنياً بشكل صحيح، نرتب تصاعدياً أولاً
      const sortedAsc = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id);
      setTransactions(sortedAsc);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    loadLedger();
  }, [selectedClientId]);

  const handlePostTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedClientId) {
      setError("يرجى اختيار العميل أولاً لتقييد القيد المالي عليه");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("المبلغ المقيد يجب أن يكون أكبر من الصفر");
      return;
    }

    if (!description.trim()) {
      setError("الرجاء إدخال البيان / الوصف أو تفاصيل البضاعة والسند المقبوض");
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUserId: currentUser.id,
          currentUserRole: currentUser.role,
          client_id: selectedClientId,
          type,
          amount: Number(amount),
          date,
          description: description.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تسجيل القيد العائد للعميل");

      setSuccess("تم تدوين القيد المالي بنجاح في نظام القيد المزدوج.");
      setAmount("");
      setDescription("");
      loadLedger();
      loadClients(); // لتحديث الأرصدة المعروضة
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء معالجة القيد");
    }
  };

  const handleDeleteTx = async (txId: number) => {
    if (!permissions.allow_delete) {
      setError("عذراً، لا تمتلك الصلاحيات الإدارية لشطب وإلغاء فواتير أو سندات!");
      return;
    }

    if (!window.confirm("هل أنت متأكد تماماً من رغبتك في شطب وإلغاء هذه العملية المالية من الدفتر؟")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/transactions/${txId}?currentUserId=${currentUser.id}&currentUserRole=${currentUser.role}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إلغاء الحركة المالية");

      setSuccess("تم إلغاء وشطب القيد المالي من كشف الحساب وتحديث الأرصدة تلقائياً.");
      loadLedger();
      loadClients();
    } catch (err: any) {
      setError(err.message || "فشل في معالجة الإلغاء");
    }
  };

  // تحصيل العميل المحدد حالياً بالصفحة
  const activeClient = clients.find(c => String(c.id) === selectedClientId);

  // حساب الأرصدة التراكمية المحدثة تاريخياً سطر بسطر (Running Cumulative Balance)
  let cumulative = 0;
  const ledgerWithCumulative = transactions.map(tx => {
    if (tx.type === 'debt') {
      cumulative += tx.amount;
    } else {
      cumulative -= tx.amount;
    }
    return {
      ...tx,
      running_balance: cumulative
    };
  });

  // العودة لترتيب الأحدث في الأعلى للعرض في الكشف
  const displayLedger = [...ledgerWithCumulative].reverse();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6 py-6 font-sans">
      {/* قسم الترويسة و زر الطباعة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">كشف الحساب ودفتر العمليات</h2>
          <p className="text-xs text-slate-400 font-bold">مراجعة المعاملات تاريخياً، حساب الرصيد التراكمي وتنزيل أو طباعة السندات الآمنة بقيد مزدوج</p>
        </div>

        <button
          type="button"
          id="btn-print-ledger"
          onClick={() => window.print()}
          disabled={!selectedClientId}
          className="px-4 py-2 bg-emerald-550 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 font-bold text-xs md:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs border border-emerald-100"
        >
          <Printer className="w-4 h-4 ml-1" />
          <span>طباعة كشف الحساب الحالي</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold flex items-center gap-2 no-print">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-2 no-print">
          <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* لوحة التقسيم ثنائي الاتجاه بالواجهة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* الجزء الأيمن (نموذج تقييد وحسابات سريعة) - مخفي في الطباعة */}
        <div className="lg:col-span-1 space-y-6 no-print">
          
          {/* اختيار العميل النشط */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">حدد العميل لاستعراض الدفتر:</h3>
            <div className="relative">
              <select
                id="ledger-client-select"
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer appearance-none"
              >
                {clients.length === 0 ? (
                  <option value="">لا يوجد عملاء حاليين</option>
                ) : (
                  clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (المتبقي: {c.net_balance?.toLocaleString()} ريال)
                    </option>
                  ))
                )}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* لوحة تسجيل المعاملات المالية */}
          {activeClient && (
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">تقييد عملية مالية بالذمة</h3>
              </div>

              <form onSubmit={handlePostTransaction} className="space-y-4">
                {/* مفتاح التبديل المزدوج (دين / سداد) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500">طبيعة العملية (القيد المزدوج):</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl font-bold text-xs" id="tx-type-selector">
                    <button
                      type="button"
                      id="tx-type-debt-button"
                      onClick={() => setType("debt")}
                      className={`h-9 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        type === "debt" 
                          ? "bg-rose-500 text-white shadow-xs" 
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>قيد دين (debt)</span>
                    </button>
                    <button
                      type="button"
                      id="tx-type-payment-button"
                      onClick={() => setType("payment")}
                      className={`h-9 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        type === "payment" 
                          ? "bg-emerald-500 text-white shadow-xs" 
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>قيد سداد (payment)</span>
                    </button>
                  </div>
                </div>

                {/* المبلغ */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">قيمة المبلغ بالأرقام (ريال سعودي):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    id="tx-amount-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="مثال: 1550"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-left"
                    dir="ltr"
                  />
                </div>

                {/* التاريخ */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">تاريخ القيد المالي:</label>
                  <input
                    type="date"
                    required
                    id="tx-date-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-left"
                    dir="ltr"
                  />
                </div>

                {/* البيان / الوصف مخصص */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">البيان والوصف التفصيلي (شرح اللوج):</label>
                  <textarea
                    required
                    id="tx-description-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="شرح البضاعة المباعة أو السند المقبوض بدقة..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white h-24"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-post-tx-submit"
                  disabled={!permissions.allow_add}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-350 text-white font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 text-xs shadow"
                >
                  <PlusCircle className="w-4 h-4 ml-1" />
                  <span>تثبيت القيد في حساب العميل</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* الجزء الأيسر والمحوري: جدول كشف الحساب التفصيلي مع الرصيد وسند الطباعة الفخم */}
        <div className="lg:col-span-2 space-y-6">
          {activeClient ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 print-card space-y-6">
              
              {/* رأس ترويسة العلامة التجارية الرسمية للطباعة فقط */}
              <div className="hidden print:flex flex-row justify-between items-center border-b-2 border-slate-950 pb-4 mb-2">
                <div>
                  <h1 className="text-xl font-black text-slate-950">نظام حساباتي المالي وإدارة الذمم</h1>
                  <p className="text-[10px] text-slate-500 font-bold">كشف حساب تفصيلي معتمد بقيد مزدوج ونظام رقابة مباشر</p>
                </div>
                <div className="text-left text-[10px] font-bold font-mono">
                  <p>تاريخ وطباعة الكشف: {new Date().toLocaleDateString("ar-SA", { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                  <p>نظام الدفاتر: حساباتي الموحد</p>
                </div>
              </div>

              {/* ترويسة كشف الحساب - مهيئة بالكامل للطباعة التلقائية والطباعة الورقية الفخمة */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-150 relative">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest no-print">
                    مستند معتمد بقيد مزدوج
                  </span>
                  <h3 className="text-xl font-black text-slate-950">كشف حساب تفصيلي وميزان ذمة</h3>
                  <div className="text-xs text-slate-400 font-bold block">
                    مستخرج لـ: <span className="text-slate-800 font-extrabold">{activeClient.name}</span>
                  </div>
                  {activeClient.phone && (
                    <p className="text-[10px] text-slate-500 font-bold">الهاتف: {activeClient.phone}</p>
                  )}
                </div>

                <div className="text-left font-sans text-xs bg-slate-50 p-4 rounded-2xl md:min-w-[180px] space-y-1 font-bold">
                  <div className="text-[10px] text-slate-400 block">تفاصيل ميزانية العميل المتبقية:</div>
                  <div className="text-slate-500">إجمالي الدين: <span className="text-rose-600 text-xs font-black">{activeClient.total_debt?.toLocaleString()} ريال</span></div>
                  <div className="text-slate-500">إجمالي السداد: <span className="text-emerald-600 text-xs font-black">{activeClient.total_payment?.toLocaleString()} ريال</span></div>
                  <div className="text-slate-800 border-t border-slate-150 pt-1.5 mt-1.5 text-xs font-extrabold flex justify-between items-center text-sm">
                    <span>الصافي متبقٍ:</span>
                    <span className="text-slate-950 font-black">{activeClient.net_balance?.toLocaleString()} ريال</span>
                  </div>
                </div>
              </div>

              {/* جدول كشف المعاملات ورصيدها التراكمي */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                {loading ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-bold">
                    جاري تحميل حركات العميل المالي...
                  </div>
                ) : displayLedger.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-bold">
                    لا يوجد أي عمليات مالية مسجلة في كشف حساب العميل حتى تاريخه.
                  </div>
                ) : (
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200">
                        <th className="p-3">المعرف</th>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">البيان / الوصف</th>
                        <th className="p-3">دين (+ Dr)</th>
                        <th className="p-3">سداد (- Cr)</th>
                        <th className="p-3">الرصيد التراكمي</th>
                        <th className="p-3 text-center no-print">إلغاء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {displayLedger.map((tx) => {
                        const isDebt = tx.type === 'debt';
                        return (
                          <tr key={tx.id} id={`ledger-tx-row-${tx.id}`} className="hover:bg-slate-50/50 transition-all">
                            <td className="p-3 font-mono text-slate-400">#{tx.id}</td>
                            <td className="p-3 whitespace-nowrap text-slate-500">{tx.date}</td>
                            <td className="p-3 max-w-xs">{tx.description}</td>
                            
                            {/* حقل دين */}
                            <td className="p-3 font-mono text-xs text-rose-600 font-black">
                              {isDebt ? `+${tx.amount.toLocaleString()}` : <span className="text-slate-300">-</span>}
                            </td>

                            {/* حقل سداد */}
                            <td className="p-3 font-mono text-xs text-emerald-600 font-black">
                              {!isDebt ? `-${tx.amount.toLocaleString()}` : <span className="text-slate-300">-</span>}
                            </td>

                            {/* الرصيد التراكمي المحدث سطر بسطر */}
                            <td className="p-3 font-mono text-slate-900 font-black text-xs">
                              <span className={tx.running_balance > 0 ? "text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded" : tx.running_balance === 0 ? "text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded" : "text-blue-600 bg-blue-50/50 px-2.5 py-0.5 rounded"}>
                                {tx.running_balance.toLocaleString()} ريال
                              </span>
                            </td>

                            {/* شطب وإلغاء القيود (مدير النظام أو بميزات الصلاحية) */}
                            <td className="p-3 text-center no-print">
                              <button
                                type="button"
                                id={`tx-delete-btn-${tx.id}`}
                                onClick={() => handleDeleteTx(tx.id)}
                                className="p-1 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors active:scale-95 cursor-pointer"
                                title="إلغاء وشطب الفاتورة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* توقيع السند لطباعة الورق */}
              <div className="hidden print:block pt-16 grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-650">
                <div className="space-y-6">
                  <p>توقيع المدقق المالي المعتمد:</p>
                  <p className="font-mono text-[10px] text-slate-400">....................................................</p>
                </div>
                <div className="space-y-6">
                  <p>توقيع العميل المقر بالذمة:</p>
                  <p className="font-mono text-[10px] text-slate-400">....................................................</p>
                </div>
              </div>

              {/* خيارات أمان للمستند الفوري */}
              <div className="text-[10px] text-slate-400 font-bold p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 no-print">
                <HelpCircle className="w-4 h-4 text-slate-300 shrink-0" />
                <span>حسابات الرصيد التراكمي تفهم تطور ميزانية العميل تاريخياً؛ حيث يعني اللون الأحمر ديوناً متراكمة في ذمته للمخزن.</span>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-center p-16 rounded-xl flex flex-col items-center justify-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300" />
              <p className="font-bold text-sm">لم يتم تحديد أي عميل لاستخراج كشف حسابه</p>
              <p className="text-xs">الرجاء اختيار أحد العملاء المسجلين من القائمة المنسدلة في الجانب الأيمن من الصفحة للمتابعة والتحكم.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
