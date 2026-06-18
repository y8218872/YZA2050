import React, { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, Users, Wallet, Search, Filter, 
  ArrowUpRight, ArrowDownLeft, FileText, Calendar, PlusCircle, AlertCircle 
} from "lucide-react";
import { Client, Transaction, Permissions } from "../types";

interface DashboardScreenProps {
  currentUser: { id: number; username: string; role: 'admin' | 'staff' };
  permissions: Permissions;
  onNavigateToLedger: () => void;
  onNavigateToClients: () => void;
}

export default function DashboardScreen({ currentUser, permissions, onNavigateToLedger, onNavigateToClients }: DashboardScreenProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "debt" | "payment">("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // تحميل البيانات الإحصائية والعمليات
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. جلب العملاء لحساب المجاميع
      const clRes = await fetch("/api/clients");
      if (!clRes.ok) throw new Error("عذراً، فشل تحميل بيانات العملاء");
      const clData = await clRes.json();
      setClients(clData);

      // 2. جلب آخر القيود المقيدة
      let query = "";
      if (filterType !== "all") query += `?type=${filterType}`;
      if (search.trim() !== "") {
        query += (query ? "&" : "?") + `search=${encodeURIComponent(search)}`;
      }

      const txRes = await fetch(`/api/transactions${query}`);
      if (!txRes.ok) throw new Error("فشل تحصيل العمليات المالية الأخيرة");
      const txData = await txRes.json();
      setTransactions(txData);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع بالاتصال");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType, search]);

  // حساب الإحصائيات الفورية بالتوازي طبقاً لنظام القيد المزدوج للذمم
  const totalClients = clients.length;
  const totalDebt = clients.reduce((acc, c) => acc + (c.total_debt || 0), 0);
  const totalPayment = clients.reduce((acc, c) => acc + (c.total_payment || 0), 0);
  const netRemaining = totalDebt - totalPayment;

  // نسبة التحصيل
  const collectionRate = totalDebt > 0 ? (totalPayment / totalDebt) * 100 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6 py-6 font-sans">
      {/* الترويسة الرئيسية والتحية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
        {/* خلفية تجميلية خفيفة */}
        <div className="absolute left-0 bottom-0 top-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-black mb-1">أهلاً بك، {currentUser.username} 👋</h2>
          <p className="text-xs text-slate-400 font-bold">
            أنت مسجل كـ <span className="text-emerald-400">{currentUser.role === 'admin' ? "مدير النظام العام" : "موظف مالي مأذون"}</span> • تسيير العمليات يجري بنظام القيد المزدوج المحمي.
          </p>
        </div>

        <div className="relative z-10 flex gap-2">
          {permissions.allow_add && (
            <button
              id="dash-add-tx-btn"
              onClick={onNavigateToLedger}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs md:text-sm rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
            >
              <PlusCircle className="w-4 h-4 ml-1" />
              <span>قيد عملية جديدة</span>
            </button>
          )}
          <button
            id="dash-view-clients-btn"
            onClick={onNavigateToClients}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/50 font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95"
          >
            استعراض العملاء
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* لوحة البطاقات الذكية والإحصائيات التفاعلية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* إجمالي العملاء */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
          <div className="space-y-1 text-right">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">إجمالي العملاء</span>
            <span className="text-3xl font-mono font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
              {totalClients}
            </span>
            <span className="text-[10px] text-slate-400 font-bold block">عملاء نشطين بالدفتر</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* إجمالي الديون القائمة */}
        <div className="bg-white p-5 rounded-xl border-r-4 border-r-red-500 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
          <div className="space-y-1 text-right">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">إجمالي الديون القائمة</span>
            <span id="stat-total-debt" className="text-2xl md:text-3xl font-mono font-bold text-red-600 block">
              {totalDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-xs font-sans text-red-500">ر.س</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold block">بانتظار التحصيل (أصول مدنية)</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* إجمالي المدفوعات المستلمة */}
        <div className="bg-white p-5 rounded-xl border-r-4 border-r-green-500 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
          <div className="space-y-1 text-right">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">المدفوعات المستلمة</span>
            <span id="stat-total-payment" className="text-2xl md:text-3xl font-mono font-bold text-green-600 block">
              {totalPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-xs font-sans text-green-500">ر.س</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold block">عمليات سداد مكتملة</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-50 text-emerald-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* صافي المستحقات المتبقية */}
        <div className="bg-[#1e293b] p-5 rounded-xl text-white shadow-lg flex items-center justify-between hover:shadow-xl transition-all group">
          <div className="space-y-1 text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">الصافي المتبقي للذمم</span>
            <span id="stat-net-balance" className="text-2xl md:text-3xl font-mono font-bold text-white block">
              {netRemaining.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-xs font-sans text-blue-300">ر.س</span>
            </span>
            <span className="text-[10px] text-blue-400 font-medium block">
              معدل التحصيل الحركي: <span className="text-green-400 font-black">{collectionRate.toFixed(1)}%</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* الرسوم التوضيحية أو التنبيه السريع بنظام القيد */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* الجانب الأيمن: تصفية وتحكم وبحث فوري في العمليات */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">أحدث عمليات القيد المالي المزدوج</h3>
              <p className="text-xs text-slate-400 font-semibold">تحديث متزامن لجميع القيود والمستندات المسجلة</p>
            </div>

            {/* أدوات التصفية والبحث الفوري */}
            <div className="flex flex-wrap items-center gap-3">
              {/* البحث بالكلمة الدلالية ووصف الفاتورة */}
              <div className="relative min-w-[200px] w-full md:w-auto">
                <input
                  type="text"
                  id="tx-search-input"
                  placeholder="ابحث بوصف القيد، المبلغ، أو العميل..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pr-9 pl-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* فلترة الحركة مالياً */}
              <div className="flex bg-slate-50 border border-slate-200/80 p-0.5 rounded-xl text-xs font-extrabold text-slate-600">
                <button
                  type="button"
                  id="tab-filter-all"
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === "all" ? "bg-white text-slate-800 shadow-xs" : "hover:text-slate-900"
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  id="tab-filter-debt"
                  onClick={() => setFilterType("debt")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    filterType === "debt" ? "bg-white text-rose-600 shadow-xs" : "hover:text-slate-900"
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3 text-rose-500" />
                  <span>الديون فقط</span>
                </button>
                <button
                  type="button"
                  id="tab-filter-payment"
                  onClick={() => setFilterType("payment")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    filterType === "payment" ? "bg-white text-emerald-600 shadow-xs" : "hover:text-slate-900"
                  }`}
                >
                  <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                  <span>السداد فقط</span>
                </button>
              </div>
            </div>
          </div>

          {/* جدول عرض البيانات المالي */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {loading && transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold">
                <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                جاري تجميع البيانات المالية وتزامن الحسابات الختامية...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium text-xs">
                لا توجد قيود مالية مطابقة لمعايير التصفية الحالية.
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="p-4 rounded-r-lg">المعرف</th>
                    <th className="p-4">اسم العميل</th>
                    <th className="p-4">نوع الحركة</th>
                    <th className="p-4">المبلغ المقيد</th>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4 rounded-l-lg">البيان / الوصف والتفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {transactions.slice(0, 10).map((tx) => (
                    <tr key={tx.id} id={`tx-row-${tx.id}`} className="hover:bg-slate-50/65 transition-colors">
                      <td className="p-4 font-mono text-slate-400">#{tx.id}</td>
                      <td className="p-4 font-bold text-slate-900">{tx.client_name}</td>
                      <td className="p-4">
                        {tx.type === "debt" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black">
                            <ArrowUpRight className="w-3 h-3 text-rose-500" />
                            دين (ذمة قائمة)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                            سداد (سند دفع)
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900 text-sm">
                        {tx.amount.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ريال
                      </td>
                      <td className="p-4 text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          {tx.date}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 max-w-xs truncate">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl text-[11px] font-bold text-slate-500">
            <span>ملاحظة: البيانات المعروضة تمثل قائمة العمليات المالية المقيدة تاريخيا.</span>
            <button
              onClick={onNavigateToLedger}
              className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 focus:outline-none cursor-pointer"
            >
              استعراض كشوفات الحساب وحركات الدفتر التفصيلية ←
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
