import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Search, Phone, Mail, FileText, AlertTriangle, 
  Trash2, Edit, X, RefreshCw, HandCoins, ArrowUpRight, ArrowDownLeft, AlertCircle,
  Printer
} from "lucide-react";
import { Client, Permissions } from "../types";

interface ClientsScreenProps {
  currentUser: { id: number; username: string; role: 'admin' | 'staff' };
  permissions: Permissions;
}

export default function ClientsScreen({ currentUser, permissions }: ClientsScreenProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // إداريو النوافذ (Modals state)
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // البيانات المؤقتة للنماذج
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "", notes: "" });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("فشل تحميل قائمة العملاء والذمم");
      const data = await res.json();
      setClients(data);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تحميل العملاء");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // إضافة عميل جديد للدفتر
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newClient.name.trim()) {
      setError("الاسم الكامل مطلوب لإدراج العميل الجديد");
      return;
    }

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUserId: currentUser.id,
          currentUserRole: currentUser.role,
          ...newClient
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تسجيل بيانات العميل");

      setSuccess(`تم تسجيل العميل [${newClient.name}] بنجاح.`);
      setNewClient({ name: "", phone: "", email: "", notes: "" });
      setShowAddModal(false);
      fetchClients();
    } catch (err: any) {
      setError(err.message || "فشل تسجيل العميل");
    }
  };

  // تعديل عميل حالي
  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUserId: currentUser.id,
          currentUserRole: currentUser.role,
          name: selectedClient.name,
          phone: selectedClient.phone,
          email: selectedClient.email,
          notes: selectedClient.notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تعديل العميل");

      setSuccess(`تمت مزامنة وتحديث بيانات العميل [${selectedClient.name}] بنجاح.`);
      setShowEditModal(false);
      setSelectedClient(null);
      fetchClients();
    } catch (err: any) {
      setError(err.message || "فشل تعديل العميل");
    }
  };

  // الحذف المتتالي والكامل للعميل ودفاتره
  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/clients/${selectedClient.id}?currentUserId=${currentUser.id}&currentUserRole=${currentUser.role}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "عذراً، لا يمكن إتمام عملية الشطب");

      setSuccess(`تم شطب العميل [${selectedClient.name}] وتصفية جميع سنداته والقيود التابعة له بنجاح حسب القيد المتتالي.`);
      setShowDeleteConfirm(false);
      setSelectedClient(null);
      fetchClients();
    } catch (err: any) {
      setError(err.message || "فشل في معالجة عملية الحذف");
    }
  };

  // معالجة معايير التصفية والبحث
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.notes.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6 py-6 font-sans">
      {/* رأس ترويسة رسمي لنسخة الطباعة الورقية فقط */}
      <div className="hidden print:flex flex-row justify-between items-center border-b-2 border-slate-950 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-950">نظام حساباتي المالي وإدارة الذمم</h1>
          <p className="text-xs text-slate-500 font-bold">كشف مالي إجمالي موحد بارصدة حسابات العملاء والذمم والمدفوعات</p>
        </div>
        <div className="text-left text-xs font-bold font-mono">
          <p>تاريخ استخراج الكشف: {new Date().toLocaleDateString("ar-SA", { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
          <p>مستوى حماية البيانات: متزامن مشفر</p>
        </div>
      </div>

      {/* قسم الإرشادات والترويسة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">إدارة العملاء والحسابات المالية</h2>
          <p className="text-xs text-slate-400 font-bold">تسجيل وتعديل بيانات العملاء وكشوفات حساباتهم الختامية (الدين والمدفوعات والمتبقي)</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-print-clients-list"
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-100 font-bold text-xs md:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
          >
            <Printer className="w-4 h-4 ml-1" />
            <span>طباعة كشف الأرصدة العام</span>
          </button>

          <button
            type="button"
            id="btn-refresh-clients"
            onClick={fetchClients}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-xl cursor-pointer active:scale-95 transition-all text-sm flex items-center justify-center"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            id="btn-open-add-client-modal"
            onClick={() => {
              if (!permissions.allow_add) {
                setError("عذراً، لا تمتلك صلاحيات الموظف الكافية لإضافة عملاء جدد.");
                return;
              }
              setError("");
              setNewClient({ name: "", phone: "", email: "", notes: "" });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 animate-none"
          >
            <UserPlus className="w-4 h-4 ml-1" />
            <span>تسجيل عميل جديد</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* لوحة البحث في السجلات */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-3 no-print">
        <div className="relative flex-1">
          <input
            type="text"
            id="client-search"
            placeholder="ابحث عن العميل بالاسم، الهاتف، البريد، أو الملاحظات المرفقة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>
        <div className="text-xs text-slate-400 font-bold hidden sm:block">
          إجمالي النتائج: <span className="text-slate-800 font-black">{filteredClients.length}</span> من <span className="text-slate-800 font-black">{clients.length}</span>
        </div>
      </div>

      {/* جدول كشف حسابات العملاء المالي والتحكم البياني */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading && clients.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs font-bold">
              <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              جاري مزامنة بيانات حسابات الذمم...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-xs font-bold">
              لا توجد سجلات لعملاء مسجلين تطابق معايير بحثك.
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                  <th className="p-4 rounded-r-lg">المعرف</th>
                  <th className="p-4">الاسم الكامل وتفاصيل العقد</th>
                  <th className="p-4">إجمالي الديون (المقيدة)</th>
                  <th className="p-4">المسدد (المدفوعات)</th>
                  <th className="p-4">الذمة الصافية القائمة</th>
                  <th className="p-4">ملاحظات تسييرية</th>
                  <th className="p-4 text-center rounded-l-lg no-print">العمليات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredClients.map((client) => {
                  const hasDebt = (client.net_balance && client.net_balance > 0);
                  const isClean = (client.net_balance === 0);

                  return (
                    <tr key={client.id} id={`client-row-${client.id}`} className="hover:bg-slate-50/65 transition-colors">
                      <td className="p-4 font-mono text-slate-400 text-center">#{client.id}</td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900 text-sm">{client.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold">
                            {client.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-300" />
                                {client.phone}
                              </span>
                            )}
                            {client.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-slate-300" />
                                {client.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* إجمالي الديون المسجلة */}
                      <td className="p-4 font-mono text-rose-600 text-xs font-black">
                        <span className="flex items-center gap-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-450 shrink-0" />
                          {client.total_debt?.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ريال
                        </span>
                      </td>

                      {/* إجمالي المبالغ المدفوعة */}
                      <td className="p-4 font-mono text-emerald-600 text-xs font-black">
                        <span className="flex items-center gap-0.5">
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {client.total_payment?.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ريال
                        </span>
                      </td>

                      {/* الذمة الصافية القائمة */}
                      <td className="p-4">
                        <div id={`balance-badge-${client.id}`} className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black ${
                          hasDebt 
                            ? "bg-rose-50 text-rose-700 text-[10px]" 
                            : isClean 
                            ? "bg-emerald-50 text-emerald-700 text-[10px]" 
                            : "bg-blue-50 text-blue-700 text-[10px]"
                        }`}>
                          <HandCoins className="w-3.5 h-3.5 shrink-0" />
                          <span>{client.net_balance?.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ريال</span>
                          <span className="text-[9px] font-bold">
                            ({hasDebt ? "متبقٍ بذمته" : isClean ? "مصفى بالكامل" : "دائن تفضيلي"})
                          </span>
                        </div>
                      </td>

                      <td className="p-4 font-medium text-slate-500 max-w-xs truncate" title={client.notes}>
                        {client.notes || <span className="text-slate-350 italic">—</span>}
                      </td>

                      {/* أزرار التحكم الصلاحية */}
                      <td className="p-4 no-print">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            id={`client-edit-btn-${client.id}`}
                            onClick={() => {
                              if (!permissions.allow_edit) {
                                setError("عذراً، رتبة حسابك لا تمتلك تصريحاً لتعديل البيانات.");
                                return;
                              }
                              setError("");
                              setSelectedClient(client);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg active:scale-90 transition-all cursor-pointer"
                            title="تعديل بيانات العميل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            id={`client-delete-btn-${client.id}`}
                            onClick={() => {
                              if (!permissions.allow_delete) {
                                setError("عذراً، لا يحق للموظف المالي حذف السجلات؛ الحذف مقصور للإدارة فقط.");
                                return;
                              }
                              setError("");
                              setSelectedClient(client);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg active:scale-90 transition-all cursor-pointer"
                            title="حذف العميل متتالياً"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* توقيع مدقق الحسابات الموحد للطباعة */}
      <div className="hidden print:grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-800 pt-16">
        <div className="space-y-4">
          <p>توقيع واعتماد المشرف العام المالي:</p>
          <p className="font-mono text-[10px] text-slate-400">....................................................</p>
        </div>
        <div className="space-y-4">
          <p>ختم التوثيق المحاسبي والرقابة:</p>
          <p className="font-mono text-[10px] text-slate-400">....................................................</p>
        </div>
      </div>

      {/* -------------------------------------------------------------
          نافذة إضافة عميل جديد (Add Client Modal)
      ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0f172a] p-5 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm md:text-base">تسجيل بيانات عميل جديد بالدفتر</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-all focus:outline-none shrink-0 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">اسم العميل الكامل أو المؤسسة (مطلوب):</label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="مثال: شركة الوفاء للخدمات"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">رقم الهاتف الشغال:</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="مثال: 05XXXXXXXX"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all animate-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">البريد الإلكتروني المعتمد:</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="مثال: client@domain.com"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all animate-none text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">ملاحظات تسييرية إضافية:</label>
                <textarea
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="سجل أي ملاحظات خاصة بأسلوب السداد أو البضاعة المعتادة هنا..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all h-24"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  id="btn-add-client-submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          نافذة تعديل عميل حالي (Edit Client Modal)
      ------------------------------------------------------------- */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in duration-200">
            <div className="bg-[#0f172a] p-5 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm md:text-base">تعديل بيانات العميل: {selectedClient.name}</span>
              </div>
              <button onClick={() => { setShowEditModal(false); setSelectedClient(null); }} className="text-slate-400 hover:text-white transition-all focus:outline-none shrink-0 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditClient} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">الاسم الكامل أو المؤسسة (مطلوب):</label>
                <input
                  type="text"
                  required
                  value={selectedClient.name}
                  onChange={(e) => setSelectedClient({ ...selectedClient, name: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">رقم الهاتف:</label>
                  <input
                    type="tel"
                    value={selectedClient.phone}
                    onChange={(e) => setSelectedClient({ ...selectedClient, phone: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={selectedClient.email}
                    onChange={(e) => setSelectedClient({ ...selectedClient, email: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">ملاحظات تسييرية إضافية:</label>
                <textarea
                  value={selectedClient.notes}
                  onChange={(e) => setSelectedClient({ ...selectedClient, notes: e.target.value })}
                  placeholder="سجل أي ملاحظات خاصة بأسلوب السداد أو البضاعة المعتادة هنا..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all h-24"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedClient(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-lg cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  id="btn-edit-client-submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer shadow-md"
                >
                  مزامنة وحفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          حوار الحذف المتتالي والكامل للعميل (Cascade Delete Affirmation)
      ------------------------------------------------------------- */}
      {showDeleteConfirm && selectedClient && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in duration-200">
            <div className="bg-rose-600 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
                <span className="font-bold text-sm block">تحذير أمني أخير: حذف متتالي!</span>
              </div>
              <button onClick={() => { setShowDeleteConfirm(false); setSelectedClient(null); }} className="text-rose-200 hover:text-white transition-all focus:outline-none shrink-0 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-xs font-bold leading-relaxed">
                تنبيه: أنت تقوم الآن بشطب العميل المالي <span className="font-black text-rose-600 underline">[{selectedClient.name}]</span> بالكامل من لوحة الذمم.
              </div>
              
              <div className="text-xs text-slate-600 space-y-2 leading-relaxed font-semibold">
                <p>ميزة الحذف المتتالي المفعّلة بالنظام ستقوم تلقائياً بما يلي:</p>
                <ul className="list-disc pr-5 space-y-1 text-slate-500 list-inside text-right">
                  <li>حذف ملف العميل نهائياً من قاعدة البيانات.</li>
                  <li>شطب وإلغاء جميع الفواتير المسجلة عليه.</li>
                  <li>شطب وإلغاء جميع دفعات وسندات السداد المقيدة فيه.</li>
                  <li>تسجيل هذه الحركة الحساسة بالكامل في "سجل الرقابة والأمن" باسم حسابك الشخصي لمتابعة التدقيق لاحقاً.</li>
                </ul>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg text-[10px] text-slate-400 font-bold text-center">
                هذا الإجراء نهائي وغير قابل للتراجع بمجرد تأكيده.
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setSelectedClient(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-lg cursor-pointer"
                >
                  تراجع عن الإجراء
                </button>
                <button
                  type="button"
                  id="btn-delete-client-confirm"
                  onClick={handleDeleteClient}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-md"
                >
                  نعم، حذف متتالي ومسح الدفاتر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
