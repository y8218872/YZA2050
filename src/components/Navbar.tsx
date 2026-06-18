import React from "react";
import { LayoutDashboard, Users, BookOpen, ShieldAlert, LogOut, Terminal, User, Database } from "lucide-react";
import { Permissions } from "../types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { id: number; username: string; role: 'admin' | 'staff' } | null;
  permissions: Permissions | null;
  onLogout: () => void;
}

export default function Navbar({ activeTab, setActiveTab, currentUser, permissions, onLogout }: NavbarProps) {
  if (!currentUser) return null;

  const showDatabaseConfig = currentUser.role === "admin" || !!permissions?.allow_db;

  return (
    <>
      {/* Sidebar - Desktop Screen only (md and up) */}
      <aside className="hidden md:flex w-64 bg-[#0f172a] text-slate-300 flex-col border-l border-slate-800 h-screen sticky top-0 shrink-0 no-print font-sans">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-xs text-white font-black">H</span>
            نظام حساباتي
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-semibold">إدارة الذمم والعمليات المالية</p>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button
            id="nav-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
            <span className="flex-1">لوحة التحكم الرئيسية</span>
          </button>

          <button
            id="nav-clients"
            onClick={() => setActiveTab("clients")}
            className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === "clients"
                ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span className="flex-1">إدارة حسابات العملاء</span>
          </button>

          <button
            id="nav-ledger"
            onClick={() => setActiveTab("ledger")}
            className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === "ledger"
                ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="flex-1">كشف حركة العمليات (Ledger)</span>
          </button>

          {currentUser.role === "admin" && (
            <button
              id="nav-admin"
              onClick={() => setActiveTab("admin")}
              className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span className="flex-1">سجل الرقابة والأمان</span>
            </button>
          )}

          {showDatabaseConfig && (
            <button
              id="nav-database"
              onClick={() => setActiveTab("database")}
              className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === "database"
                  ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Database className="w-4 h-4 text-blue-400" />
              <span className="flex-1">ربط قاعدة البيانات</span>
            </button>
          )}
        </nav>

        {/* User Info & Logout at bottom of Sidebar */}
        <div className="p-4 border-t border-slate-800 mt-auto bg-slate-950/20">
          <div className="flex items-center gap-3 p-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-green-500 flex items-center justify-center text-slate-200">
              <User className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="text-white font-bold">{currentUser.username}</p>
              <p className="text-slate-400 text-[10px] mt-0.5">
                {currentUser.role === "admin" ? "مدير النظام (Admin)" : "موظف مالي مأذون"}
              </p>
            </div>
          </div>
          <button
            id="btn-logout"
            onClick={onLogout}
            className="w-full h-10 px-4 rounded-lg bg-slate-800 hover:bg-rose-950/30 text-rose-450 hover:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 hover:border-rose-900 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج المباشر</span>
          </button>
        </div>
      </aside>

      {/* Top Header + Bottom Nav on Mobile screens (only shown on small screens) */}
      <header className="block md:hidden bg-[#0f172a] text-slate-200 shadow-md sticky top-0 z-50 no-print font-sans">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px] text-white">H</span>
            حساباتي المالي
          </h1>
          <div className="flex items-center gap-2">
            {showDatabaseConfig && (
              <button
                id="mobile-nav-db"
                onClick={() => setActiveTab("database")}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                  activeTab === "database" ? "bg-blue-600 text-white border-blue-500" : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
                title="قاعدة البيانات"
              >
                <Database className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              id="mobile-logout"
              onClick={onLogout}
              className="p-1.5 rounded-lg bg-slate-800 text-rose-400 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* Horizontal Navigation tabs on mobile for quick swapping */}
        <div className="flex items-center justify-around py-2 bg-[#172554]/25 border-t border-slate-800/60 font-semibold text-xs text-center">
          <button
            id="mobile-nav-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === "dashboard" ? "text-blue-400 bg-slate-800/60" : "text-slate-400"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>لوحة التحكم</span>
          </button>
          <button
            id="mobile-nav-clients"
            onClick={() => setActiveTab("clients")}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === "clients" ? "text-blue-400 bg-slate-800/60" : "text-slate-400"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>العملاء</span>
          </button>
          <button
            id="mobile-nav-ledger"
            onClick={() => setActiveTab("ledger")}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-lg transition-all ${
              activeTab === "ledger" ? "text-blue-400 bg-slate-800/60" : "text-slate-400"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الدفتر</span>
          </button>
          {currentUser.role === "admin" && (
            <button
              id="mobile-nav-admin"
              onClick={() => setActiveTab("admin")}
              className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-lg transition-all ${
                activeTab === "admin" ? "text-blue-400 bg-slate-800/60" : "text-slate-300"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>الرقابة</span>
            </button>
          )}
        </div>
      </header>
    </>
  );
}
