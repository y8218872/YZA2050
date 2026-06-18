import React, { useState, useEffect } from "react";
import LoginScreen from "./components/LoginScreen";
import Navbar from "./components/Navbar";
import DashboardScreen from "./components/DashboardScreen";
import ClientsScreen from "./components/ClientsScreen";
import LedgerScreen from "./components/LedgerScreen";
import AdminScreen from "./components/AdminScreen";
import DatabaseScreen from "./components/DatabaseScreen";
import { Permissions } from "./types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: 'admin' | 'staff' } | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // دعم بقاء الجلسة نشطة أثناء تحديثات المعاينة للتسهيل
  useEffect(() => {
    const savedUser = sessionStorage.getItem("mussair_user");
    const savedPerms = sessionStorage.getItem("mussair_perms");
    if (savedUser && savedPerms) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setPermissions(JSON.parse(savedPerms));
      } catch (err) {
        console.error("Error parsing saved session", err);
      }
    }
  }, []);

  const handleLoginSuccess = (
    user: { id: number; username: string; role: 'admin' | 'staff' }, 
    perms: Permissions
  ) => {
    setCurrentUser(user);
    setPermissions(perms);
    sessionStorage.setItem("mussair_user", JSON.stringify(user));
    sessionStorage.setItem("mussair_perms", JSON.stringify(perms));
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPermissions(null);
    sessionStorage.removeItem("mussair_user");
    sessionStorage.removeItem("mussair_perms");
  };

  // حماية التصفية التلقائية والولوج إلى صفحات الإدارة العامة
  const renderCurrentScreen = () => {
    if (!currentUser || !permissions) return null;

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardScreen 
            currentUser={currentUser} 
            permissions={permissions} 
            onNavigateToLedger={() => setActiveTab("ledger")}
            onNavigateToClients={() => setActiveTab("clients")}
          />
        );
      case "clients":
        return (
          <ClientsScreen 
            currentUser={currentUser} 
            permissions={permissions} 
          />
        );
      case "ledger":
        return (
          <LedgerScreen 
            currentUser={currentUser} 
            permissions={permissions} 
          />
        );
      case "admin":
        if (currentUser.role !== "admin") {
          return (
            <div className="max-w-7xl mx-auto px-4 py-12 text-center space-y-3 font-sans">
              <p className="text-rose-600 font-black text-lg">عذراً، الوصول غير مصرح به!</p>
              <p className="text-slate-500 font-bold text-sm">صفحة الأمان والسجلات مقصورة حصرياً لإدارة النظام العامة (Admin).</p>
            </div>
          );
        }
        return <AdminScreen currentUser={currentUser} />;
      case "database":
        if (currentUser.role !== "admin" && !permissions.allow_db) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-12 text-center space-y-3 font-sans">
              <p className="text-rose-600 font-black text-lg">عذراً، الوصول غير مصرح به!</p>
              <p className="text-slate-500 font-bold text-sm">ليس لديك الصلاحية الأمنية الكافية للتحكم بأولويات ربط قواعد البيانات الخارجية.</p>
            </div>
          );
        }
        return <DatabaseScreen currentUser={currentUser} />;
      default:
        return <div className="text-center py-12">الصفحة غير متوفرة</div>;
    }
  };

  if (!currentUser || !permissions) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col md:flex-row font-sans transition-all selection:bg-blue-500 selection:text-white">
      {/* شريط الملاحة والهوية المعزز */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        permissions={permissions} 
        onLogout={handleLogout} 
      />

      {/* منطقة عرض الصفحات النشطة والتحكم الفرعي */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* نظام الترويسة المالي والأمني */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <span className="text-slate-450 font-bold text-xs text-slate-500">تاريخ اليوم المالي:</span>
            <span className="font-mono font-bold text-xs md:text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded border border-slate-200">
              {new Date().toLocaleDateString("ar-SA", { year: 'numeric', month: '2-digit', day: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-505 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              النظام يعمل بشكل آمن ومتزامن
            </span>
          </div>
        </header>

        {/* منطقة العمليات والمدخلات الرئيسية */}
        <main className="flex-1 pb-16">
          {renderCurrentScreen()}
        </main>

        {/* تذييل واجهة حساباتي المالي */}
        <footer className="bg-slate-50 border-t border-slate-200/60 py-5 text-center text-[10px] font-bold text-slate-400 no-print shrink-0 mt-auto">
          <p className="mb-0.5 text-slate-500">نظام حساباتي لإدارة الذمم والعمليات المالية والرقابة © ٢٠٢٦</p>
          <p className="text-slate-405 text-slate-400">يعمل بنظام القيد المزدوج التفاعلي وحماية الاتصال ومصفوفات الصلاحية المتكاملة</p>
        </footer>
      </div>
    </div>
  );
}
