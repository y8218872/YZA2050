import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, UserPlus, FileCheck, Check, Key, UserMinus, 
  Search, RefreshCw, AlertCircle, Sparkles, CheckSquare, Square, Eye, EyeOff, Trash2 
} from "lucide-react";
import { User, AuditLog, Permissions } from "../types";

interface AdminScreenProps {
  currentUser: { id: number; username: string; role: 'admin' | 'staff' };
}

export default function AdminScreen({ currentUser }: AdminScreenProps) {
  const [staff, setStaff] = useState<any[]>([]); // قائمة الموظفين مدمجة مع الصلاحيات
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logSearch, setLogSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // حقول نموذج إضافة الموظف الجديد
  const [newUsername, setNewUsername] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");
  const [newPerms, setNewPerms] = useState({
    allow_add: true,
    allow_edit: false,
    allow_delete: false,
    allow_stats: true,
    allow_db: false
  });

  // التحكم بعرض الـ PINS للمشرف
  const [unmaskedId, setUnmaskedId] = useState<number | null>(null);

  const fetchStaffData = async () => {
    try {
      const res = await fetch(`/api/admin/staff?role=${currentUser.role}&adminUserId=${currentUser.id}`);
      if (!res.ok) throw new Error("عذراً، فشل تحميل بيانات الموظفين");
      const data = await res.json();
      setStaff(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/admin/audit-logs?role=${currentUser.role}`);
      if (!res.ok) throw new Error("عذراً، فشل تحميل سجلات الرقابة الأمنية");
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStaffData(), fetchLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser.role === 'admin') {
      fetchAll();
    }
  }, [currentUser]);

  // تسجيل موظف جديد
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newUsername.trim() || !newPin) {
      setError("يرجى تعبئة جميع بيانات الموظف الأساسية.");
      return;
    }

    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setError("الرقم السري PIN يجب أن يتكون من 4 أرقام بالضبط!");
      return;
    }

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          adminRole: currentUser.role,
          username: newUsername.trim(),
          pin: newPin,
          role: newRole,
          permissions: newPerms
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تسجيل الموظف");

      setSuccess(`تم تسجيل الموظف الجديد [${newUsername}] وتعيين صلاحيات التسيير له.`);
      setNewUsername("");
      setNewPin("");
      setNewRole("staff");
      setNewPerms({ allow_add: true, allow_edit: false, allow_delete: false, allow_stats: true, allow_db: false });
      fetchAll();
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    }
  };

  // تعديل رمز PIN لموظف حالي
  const handleChangePin = async (userId: number, username: string) => {
    const pinVal = window.prompt(`أدخل رمز PIN الجديد المكون من 4 أرقام للموظف [${username}]:`);
    if (pinVal === null) return; // تم الإلغاء

    if (pinVal.length !== 4 || isNaN(Number(pinVal))) {
      window.alert("خطأ: الرمز السري PIN يجب أن يتكون من 4 خانات رقمية!");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/staff/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          adminRole: currentUser.role,
          pin: pinVal
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تحديث الكود السري");

      setSuccess(`تم تحديث الرمز المالي السري المكون من 4 أرقام لـ [${username}] بنجاح.`);
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // تعديل صلاحية موظف مالي في مصفوفة الصلاحيات (Checkboxes)
  const handleTogglePermission = async (userId: number, permKey: "allow_add" | "allow_edit" | "allow_delete" | "allow_stats" | "allow_db", currentVal: boolean) => {
    setError("");
    setSuccess("");

    const staffMember = staff.find(u => u.id === userId);
    if (!staffMember) return;

    // تجهيز الصلاحية الجديدة مقلوبة
    const updatedPerms = {
      ...staffMember.permissions,
      [permKey]: !currentVal
    };

    try {
      const res = await fetch(`/api/admin/staff/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          adminRole: currentUser.role,
          permissions: updatedPerms
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل مزامنة الصلاحية لمصفوفة الموظفين");

      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // شطب وإقصاء مستخدم
  const handleDeleteStaff = async (userId: number, username: string) => {
    if (userId === 1) {
      window.alert("يمنع شطب أو إقصاء المدير العام والمؤسس للنظام!");
      return;
    }

    if (!window.confirm(`هل أنت متأكد تماماً من شطب وإقصاء الموظف المالي [${username}] وإلغاء صلاحياته؟`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/staff/${userId}?adminUserId=${currentUser.id}&adminRole=${currentUser.role}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "عذراً، فشل الإقصاء لحساب الموظف");

      setSuccess(`تم إقصاء وشطب الموظف [${username}] وسحب كامل صلاحياته تزامناً مع تسجيل حركة الرقابة.`);
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // تصفية أمن سجلات الرقابة (Audit search filter)
  const filteredLogs = logs.filter(l => 
    l.username.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.action_type.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.details.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6 py-6 font-sans">
      {/* قسم الإرشاد والترويسة الإدارية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-slate-900" />
            <span>لوحة الأمان والإدارة العامة لمنظومة الميسر</span>
          </h2>
          <p className="text-xs text-slate-400 font-bold">مقصورة لمدير النظام تتيح التحكم بالصلاحيات، تسجيل تسيير الموظفين، واستقراء سجل الأمن والرقابة الشامل.</p>
        </div>

        <button
          type="button"
          id="btn-admin-refresh"
          onClick={fetchAll}
          disabled={loading}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>تزامن وتحديث المنظومة الأمنية</span>
        </button>
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

      {/* لوحة التحكم وتقسيم الموظفين */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* العمود الأيمن: تسجيل موظف مالي مأذون */}
        <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">تسجيل وتأذين موظف جديد</h3>
          </div>

          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500">اسم الموظف المعتمد:</label>
              <input
                type="text"
                required
                id="staff-username-input"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="مثال: يوسف المحاسب"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500">رمز PIN السري (4 أرقام للدخول الفوري):</label>
              <input
                type="text"
                maxLength={4}
                required
                id="staff-pin-input"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="مثال: 5566"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 font-extrabold text-center text-xs tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500">رتبة المستخدم:</label>
              <select
                id="staff-role-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "admin" | "staff")}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="staff">موظف مالي عادي (Staff)</option>
                <option value="admin">مدير نظام مطلق الميزة (Admin)</option>
              </select>
            </div>

            {newRole === 'staff' && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="block text-xs font-bold text-slate-650">تحديد مصفوفة الصلاحيات الأولية للموظف:</span>
                
                <div className="space-y-2 font-bold text-xs text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newPerms.allow_add}
                      onChange={(e) => setNewPerms({ ...newPerms, allow_add: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>السماح بقيد العمليات وإضافة القيود</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newPerms.allow_edit}
                      onChange={(e) => setNewPerms({ ...newPerms, allow_edit: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>السماح بتعديل ملفات العملاء</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newPerms.allow_delete}
                      onChange={(e) => setNewPerms({ ...newPerms, allow_delete: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>السماح بالحذف (متتالي القيود)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newPerms.allow_stats}
                      onChange={(e) => setNewPerms({ ...newPerms, allow_stats: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>السماح بمشاهدة التقارير الإحصائية الختامية</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newPerms.allow_db}
                      onChange={(e) => setNewPerms({ ...newPerms, allow_db: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>السماح بالتحكم بربط وإعداد قاعدة البيانات الخارجية</span>
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              id="btn-add-staff-submit"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 text-xs shadow-sm"
            >
              <UserPlus className="w-4 h-4 ml-1" />
              <span>تأذين وحفظ الموظف المالي</span>
            </button>
          </form>
        </div>

        {/* الجزء الأيسر: مصفوفة الإدارة والتبديل للصلاحيات (Matrix Control) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">مصفوفة هرمية الموظفين وتعديل صلاحياتهم الميدانية</h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200">
                  <th className="p-3">الموظف وطبيعة الرتبة</th>
                  <th className="p-3 text-center">الرمز PIN السري</th>
                  <th className="p-3 text-center">السماح بالإضافة</th>
                  <th className="p-3 text-center">تعديل العملاء</th>
                  <th className="p-3 text-center">السماح بالحذف</th>
                  <th className="p-3 text-center">عقد الإحصاء الختامي</th>
                  <th className="p-3 text-center">ربط قاعدة البيانات</th>
                  <th className="p-3 text-center">شطب الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {staff.map((u) => {
                  const isAdmin = u.role === "admin";
                  const visiblePin = unmaskedId === u.id;

                  return (
                    <tr key={u.id} id={`staff-row-${u.id}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-900">{u.username}</p>
                          <p className={`text-[10px] font-bold ${isAdmin ? "text-rose-600" : "text-slate-400"}`}>
                            {isAdmin ? "مدير نظام" : "موظف مالي"}
                          </p>
                        </div>
                      </td>

                      {/* الرمز PIN السري والتحكم به */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-50 rounded-lg">
                          <span className="font-mono text-slate-800 font-extrabold tracking-widest text-xs">
                            {visiblePin ? u.pin : "••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setUnmaskedId(visiblePin ? null : u.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-550 focus:outline-none"
                          >
                            {visiblePin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            id={`change-pin-btn-${u.id}`}
                            onClick={() => handleChangePin(u.id, u.username)}
                            className="p-1 hover:bg-slate-200 hover:text-emerald-600 rounded text-slate-400"
                            title="تعديل الكود"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* إضافات القيد المالي */}
                      <td className="p-3 text-center select-none">
                        {isAdmin ? (
                          <span className="text-[10px] text-emerald-600 font-black">مطلق الصلاحية</span>
                        ) : (
                          <button
                            type="button"
                            id={`toggle-add-perm-${u.id}`}
                            onClick={() => handleTogglePermission(u.id, 'allow_add', u.permissions.allow_add)}
                            className={`p-1 rounded-lg focus:outline-none cursor-pointer transition-all ${
                              u.permissions.allow_add 
                                ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                                : "text-slate-400 bg-slate-100"
                            }`}
                          >
                            {u.permissions.allow_add ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                        )}
                      </td>

                      {/* تعديل العملاء */}
                      <td className="p-3 text-center select-none">
                        {isAdmin ? (
                          <span className="text-[10px] text-emerald-600 font-black">مطلق الصلاحية</span>
                        ) : (
                          <button
                            type="button"
                            id={`toggle-edit-perm-${u.id}`}
                            onClick={() => handleTogglePermission(u.id, 'allow_edit', u.permissions.allow_edit)}
                            className={`p-1 rounded-lg focus:outline-none cursor-pointer transition-all ${
                              u.permissions.allow_edit 
                                ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                                : "text-slate-400 bg-slate-100"
                            }`}
                          >
                            {u.permissions.allow_edit ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                        )}
                      </td>

                      {/* صلاحية الحذف */}
                      <td className="p-3 text-center select-none">
                        {isAdmin ? (
                          <span className="text-[10px] text-emerald-600 font-black">مطلق الصلاحية</span>
                        ) : (
                          <button
                            type="button"
                            id={`toggle-delete-perm-${u.id}`}
                            onClick={() => handleTogglePermission(u.id, 'allow_delete', u.permissions.allow_delete)}
                            className={`p-1 rounded-lg focus:outline-none cursor-pointer transition-all ${
                              u.permissions.allow_delete 
                                ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                                : "text-slate-400 bg-slate-100"
                            }`}
                          >
                            {u.permissions.allow_delete ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                        )}
                      </td>

                      {/* صلاحية الإحصائيات الفورية الختامية */}
                      <td className="p-3 text-center select-none">
                        {isAdmin ? (
                          <span className="text-[10px] text-emerald-600 font-black">مطلق الصلاحية</span>
                        ) : (
                          <button
                            type="button"
                            id={`toggle-stats-perm-${u.id}`}
                            onClick={() => handleTogglePermission(u.id, 'allow_stats', u.permissions.allow_stats)}
                            className={`p-1 rounded-lg focus:outline-none cursor-pointer transition-all ${
                              u.permissions.allow_stats 
                                ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                                : "text-slate-400 bg-slate-100"
                            }`}
                          >
                            {u.permissions.allow_stats ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                        )}
                      </td>

                      {/* صلاحية ربط وإعداد قاعدة البيانات الخارجية */}
                      <td className="p-3 text-center select-none">
                        {isAdmin ? (
                          <span className="text-[10px] text-emerald-600 font-black">مطلق الصلاحية</span>
                        ) : (
                          <button
                            type="button"
                            id={`toggle-db-perm-${u.id}`}
                            onClick={() => handleTogglePermission(u.id, 'allow_db', u.permissions.allow_db)}
                            className={`p-1 rounded-lg focus:outline-none cursor-pointer transition-all ${
                              u.permissions.allow_db 
                                ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                                : "text-slate-400 bg-slate-100"
                            }`}
                          >
                            {u.permissions.allow_db ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                        )}
                      </td>

                      {/* زر الحذف للحساب */}
                      <td className="p-3 text-center">
                        {u.id === 1 ? (
                          <span className="text-[10px] text-slate-350 italic">—</span>
                        ) : (
                          <button
                            type="button"
                            id={`staff-delete-btn-${u.id}`}
                            onClick={() => handleDeleteStaff(u.id, u.username)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg active:scale-90 transition-all cursor-pointer"
                            title="إقصاء الموظف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* لوحة سجل الرقابة المباشرة والأمن والتدقيق (Audit Logs Secure panel) */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-sans">سجل الرقابة وقوائم الحركات والأمن المباشر (Audit Logs)</h3>
            <p className="text-xs text-slate-400 font-bold">تسجيل آمن وتدقيق صارم لعمليات الطاقم بنظام التدقيق الدائم.</p>
          </div>

          <div className="relative min-w-[240px]">
            <input
              type="text"
              id="audit-log-search"
              placeholder="ابحث باسم الموظف أو نوع المعاملة..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full h-10 pr-9 pl-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* جدول سجل الرقابة والأمن الفخم */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[360px] overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-sm text-slate-500 uppercase text-[10px] font-bold tracking-widest">
              <tr>
                <th className="p-3 rounded-r-xl">التوقيت الدقيق</th>
                <th className="p-3">رقم الحساب</th>
                <th className="p-3">اسم الموظف المبادر</th>
                <th className="p-3">نوع العملية المجرية</th>
                <th className="p-3 rounded-l-xl">الحيثيات والبيان الكامل بالتفصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    لا تتوفر سجلات تدقيق مطابقة لمعيار تصفيتك بالوقت الحالي.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("ar-SA")}
                    </td>
                    <td className="p-3 font-mono text-slate-400">#{log.user_id || "مدرج"}</td>
                    <td className="p-3 font-extrabold text-slate-900">{log.username}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        log.action_type.includes("حذف") || log.action_type.includes("فشل") || log.action_type.includes("إقصاء")
                          ? "bg-rose-50 text-rose-700"
                          : log.action_type.includes("إضافة") || log.action_type.includes("سداد") || log.action_type.includes("تسجيل")
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-650 font-bold leading-relaxed">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
