import React, { useState, useEffect } from "react";
import { 
  Database, Server, Wifi, Terminal, Settings2, Activity, Play,
  CheckCircle2, AlertCircle, Trash2, ShieldCheck, RefreshCw, Layers
} from "lucide-react";

interface DatabaseScreenProps {
  currentUser: { id: number; username: string; role: 'admin' | 'staff' };
}

interface DbConfig {
  db_type: string;
  host: string;
  port: number;
  db_name: string;
  username: string;
  ssl_mode: boolean;
  is_connected: boolean;
  last_tested: string;
}

interface QueryLog {
  id: number;
  sql: string;
  timestamp: string;
}

export default function DatabaseScreen({ currentUser }: DatabaseScreenProps) {
  const [dbType, setDbType] = useState<string>("postgresql");
  const [host, setHost] = useState("");
  const [port, setPort] = useState<number>(5432);
  const [dbName, setDbName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sslMode, setSslMode] = useState(true);

  // States
  const [savedConfig, setSavedConfig] = useState<DbConfig | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    ping_ms?: number;
    server_version?: string;
    tables_found?: string[];
    logs: string[];
    error?: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Live Query Monitor
  const [queries, setQueries] = useState<QueryLog[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch Saved Config on Load
  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/db-config?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setSavedConfig(data);
        setDbType(data.db_type || "postgresql");
        setHost(data.host || "");
        setPort(data.port || 5432);
        setDbName(data.db_name || "");
        setUsername(data.username || "");
        setSslMode(data.ssl_mode ?? true);
      }
    } catch (err) {
      console.error("Error fetching db config:", err);
    }
  };

  // Fetch Live DB Query Logs from API
  const fetchQueries = async () => {
    setLoadingQueries(true);
    try {
      const res = await fetch(`/api/db-logs?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setQueries(data.queries || []);
      }
    } catch (err) {
      console.error("Error fetching db queries logs:", err);
    } finally {
      setLoadingQueries(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchQueries();
  }, []);

  // Interval for Live Queries monitor
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchQueries();
    }, 4000); // refresh every 4 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Handle Preset vendor changes
  const handleVendorSelector = (vendor: string) => {
    setDbType(vendor);
    if (vendor === "postgresql") {
      setPort(5432);
      if (!host) setHost("db.hashabati-secure.io");
      if (!dbName) setDbName("hashabati_finance_prod");
      if (!username) setUsername("finance_admin");
    } else if (vendor === "mysql") {
      setPort(3306);
      if (!host) setHost("mysql-server.intranet.local");
      if (!dbName) setDbName("hashabati_ledger");
      if (!username) setUsername("db_billing");
    } else if (vendor === "sqlite") {
      setPort(0);
      setHost("lokal_host");
      setDbName("local_safeguard.sqlite");
      setUsername("local_app");
    } else if (vendor === "mongodb") {
      setPort(27017);
      if (!host) setHost("cluster0.mongodb.net");
      if (!dbName) setDbName("hashabati_documents");
      if (!username) setUsername("atlas_user");
    } else if (vendor === "firebase") {
      setPort(443);
      setHost("firestore.googleapis.com");
      if (!dbName) setDbName("project-hashabati-prod");
      if (!username) setUsername("firebase-adminsistrate");
    }
  };

  // Test Connection
  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/db-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          db_type: dbType,
          host,
          port,
          db_name: dbName,
          username,
          password,
          ssl_mode: sslMode,
          test_only: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل اختبار الاتصال بقاعدة البيانات");
      }

      setTestResult({
        success: true,
        ping_ms: data.ping_ms,
        server_version: data.server_version,
        tables_found: data.tables_found,
        logs: data.logs
      });
      fetchQueries();
    } catch (err: any) {
      setTestResult({
        success: false,
        logs: [
          `[FAIL] Connection request initiated to ${host}:${port}`,
          `[FAIL] Error encountered: ${err.message || "Network Timeout"}`
        ],
        error: err.message || "تعذر الاتصال بالخادم المذكور"
      });
    } finally {
      setTesting(false);
    }
  };

  // Save Settings to database
  const handleSaveConnection = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/db-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUserId: currentUser.id,
          currentUserRole: currentUser.role,
          db_type: dbType,
          host,
          port,
          db_name: dbName,
          username,
          password,
          ssl_mode: sslMode,
          test_only: false
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ إعدادات الاتصال");

      setSuccess("تم تطبيق وحفظ إعدادات ربط قاعدة البيانات الخارجية بنجاح!");
      setSavedConfig(data.config);
      fetchQueries();
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  };

  // Clear live queries
  const handleClearQueries = async () => {
    try {
      const res = await fetch(`/api/db-logs?userId=${currentUser.id}`, { method: "DELETE" });
      if (res.ok) {
        setQueries([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8 animate-fade-in">
      
      {/* رأس الصفحة مع عنوان مذهل */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-blue-600 rounded-lg text-white">
              <Database className="w-5 h-5" />
            </span>
            <span>بوابة ربط قواعد البيانات الخارجية</span>
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1">
            اربط حل بوابتك المحاسبية "حساباتي" بقواعد البيانات الإنتاجية السحابية والخاصة مع تتبع العمليات المباشر.
          </p>
        </div>

        {/* حالة المحرك الحالي */}
        <div className="flex items-center gap-2.5 p-2 px-3.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-bold text-xs">
          <span className="w-2.5 h-2.5 bg-green-550 rounded-full animate-pulse"></span>
          <span>حالة المحرك: متصل بقاعدة الحسابات الخارجية</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* العمود الأيمن: إعدادات الاتصال الحركي */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Settings2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">بيانات منفذ الاتصال الخارجي (DB Credentials)</h3>
            </div>

            {/* تحديد نوع المحرك */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-500">اختر نوع محرك قاعدة البيانات المستهدف:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: "postgresql", name: "PostgreSQL", desc: "العلاقات والقيود", color: "border-blue-600 bg-blue-50/20 text-blue-700" },
                  { id: "mysql", name: "MySQL", desc: "أداء فائق للويب", color: "border-sky-500 bg-sky-50/20 text-sky-700" },
                  { id: "sqlite", name: "SQLite", desc: "ملف محلي مدمج", color: "border-slate-500 bg-slate-50/20 text-slate-700" },
                  { id: "mongodb", name: "MongoDB", desc: "تخزين مستندات NoSQL", color: "border-emerald-500 bg-emerald-50/20 text-emerald-700" },
                  { id: "firebase", name: "Firestore (Firebase)", desc: "مزامنة سحابية فورية", color: "border-amber-500 bg-amber-50/20 text-amber-700" }
                ].map((vendor) => (
                  <button
                    key={vendor.id}
                    type="button"
                    onClick={() => handleVendorSelector(vendor.id)}
                    className={`p-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      dbType === vendor.id 
                        ? `${vendor.color} ring-2 ring-blue-500 font-extrabold scale-[1.02] shadow-xs`
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs tracking-tight">{vendor.name}</span>
                    <span className="text-[9px] text-slate-400 font-normal">{vendor.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleTestConnection} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">مضيف الخادم المالي (Host / URI IP):</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="e.g. host.database-provider.com"
                    className="w-full h-10 pr-4 pl-10 bg-slate-50 border border-slate-200 rounded-lg text-xs text-left direction-ltr focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                  />
                  <Server className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">منفذ الاتصال (Port Service):</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={port}
                    disabled={dbType === "sqlite"}
                    onChange={(e) => setPort(Number(e.target.value))}
                    placeholder="e.g. 5432"
                    className="w-full h-10 pr-4 pl-10 bg-slate-50 border border-slate-200 rounded-lg text-xs text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50 font-mono"
                  />
                  <Terminal className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">اسم قاعدة البيانات المستهدفة (DB Name / Client ID):</label>
                <input
                  type="text"
                  required
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="e.g. sales_ledger_db"
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">اسم حساب الصلاحيات (Username Accounts):</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. db_administrator"
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500">سر وتوثيق كلمة المرور / API Token Key (Passwords):</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••••••"
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="md:col-span-2 pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sslMode}
                    onChange={(e) => setSslMode(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    تفعيل التشفير الجانبي الآمن (Force SSL Certifications)
                  </span>
                </label>

                <p className="text-[10px] text-slate-400 font-semibold">تأمين الاتصال بنظام تصفية IP</p>
              </div>

              {/* أزرار التجريب والحفظ الفعلي */}
              <div className="md:col-span-2 pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={testing}
                  className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-2 border border-slate-300 cursor-pointer disabled:opacity-50 min-w-[150px]"
                >
                  <Wifi className="w-4 h-4 text-blue-500" />
                  <span>{testing ? "جاري اختبار الاتصال..." : "اختبار الاتصال الفوري"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveConnection}
                  disabled={saving || testing}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>حفظ وتفعيل كقاعدة بيانات معتمدة</span>
                </button>
              </div>
            </form>
          </div>

          {/* لوحة نتائج تجربة الاتصال الفوري */}
          {testResult && (
            <div className={`border p-5 rounded-xl space-y-4 shadow-xs ${
              testResult.success ? "bg-green-50/40 border-green-200 text-green-800" : "bg-rose-50/40 border-rose-200 text-rose-850"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <h4 className="font-bold text-xs font-sans uppercase tracking-wide">
                    {testResult.success ? "نجاح فحص التوصيل بقاعدة البيانات" : "فشل توصيل الخط السحابي"}
                  </h4>
                </div>

                {testResult.success && testResult.ping_ms && (
                  <span className="p-1 px-2.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                    معدل الاستجابة (Ping): {testResult.ping_ms}ms
                  </span>
                )}
              </div>

              {/* Logs terminal */}
              <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-[10px] space-y-1.5 overflow-x-auto h-36">
                {testResult.logs.map((log, idx) => (
                  <p key={idx} className={log.includes("[FAIL]") ? "text-rose-400" : "text-green-400"}>
                    {log}
                  </p>
                ))}
                {testResult.success && testResult.server_version && (
                  <p className="text-blue-350">
                    [DB AGENT] Server Version Detected: {testResult.server_version}
                  </p>
                )}
                {testResult.success && testResult.tables_found && (
                  <p className="text-slate-400">
                    [DB AGENT] Mapped core relations in public namespace: [{testResult.tables_found.join(", ")}]
                  </p>
                )}
              </div>

              {testResult.success ? (
                <p className="text-xs font-bold text-green-700">
                  قنوات المزامنة المتوازية مستقرة بالكامل وجاهزة لاستقطاب وإرسال حركات السندات والعملاء.
                </p>
              ) : (
                <p className="text-xs font-bold text-rose-600">
                  الرجاء التحقق من صحة المسمى، وسلامة فتح المنافذ وجدار الحماية السحابي للمضيف.
                </p>
              )}
            </div>
          )}
        </div>

        {/* العمود الأيسر: شاشة تدفق عمليات الاستعلام (Query Stream Live Monitoring) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-xl shadow-lg p-5 space-y-5 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-500 animate-pulse" />
                <div>
                  <h3 className="font-bold text-xs">مستكشف الاستعلامات المباشر</h3>
                  <span className="text-[9px] text-slate-500 font-mono">Live SQL Query Log</span>
                </div>
              </div>

              {/* غيار التحديث التلقائي */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-1 px-2 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                    autoRefresh ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {autoRefresh ? "تلقائي" : "يدوي"}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
              تتبع جمل SQL والاستعلامات الموزعة التي يترجمها نظام "حساباتي" وينفذها على قاعدة البيانات الخارجية بشكل مباشر مع كل نقرة بالواجهة:
            </p>

            {/* List of Live Queries */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[350px]">
              {queries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-2">
                  <Activity className="w-8 h-8 text-slate-700" />
                  <p className="text-[10px] font-bold">لا يوجد استعلامات حالية</p>
                  <p className="text-[9px] text-slate-600">تنقل في بقية صفحات النظام لإطلاق الاستعلامات!</p>
                </div>
              ) : (
                queries.map((q) => (
                  <div key={q.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5 hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                      <span>#Query {q.id}</span>
                      <span>{new Date(q.timestamp).toLocaleTimeString("ar-SA")}</span>
                    </div>
                    <pre className="text-[10px] text-blue-400 font-mono whitespace-pre-wrap select-all leading-normal text-left" dir="ltr">
                      {q.sql}
                    </pre>
                  </div>
                ))
              )}
            </div>

            {/* أفعال لوحة الاستعلامات */}
            <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-[10px]">
              <button
                type="button"
                onClick={fetchQueries}
                disabled={loadingQueries}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingQueries ? "animate-spin" : ""}`} />
                <span>تحديث يدوي</span>
              </button>

              <button
                type="button"
                onClick={handleClearQueries}
                className="p-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-450 hover:text-rose-400 font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>مسح الشاشة</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
