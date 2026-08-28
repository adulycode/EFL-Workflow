import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';

export const SsoLoginGate: React.FC = () => {
  const { loginWithSsoToken } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const ssoPortalUrl = window.location.hostname === 'localhost' ? 'http://localhost:3050' : 'https://eflworkspace.com';
  const appId = 'efl-workflow';

  const handleGoToCentralSso = () => {
    const redirectUri = encodeURIComponent(window.location.origin);
    window.location.href = `${ssoPortalUrl}/login?appId=${appId}&redirect_uri=${redirectUri}`;
  };

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;

    setIsLoggingIn(true);
    setErrorMsg('');
    const ok = await loginWithSsoToken(manualToken.trim());
    setIsLoggingIn(false);

    if (!ok) {
      setErrorMsg('โทเคน SSO ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-900 via-neutral-950 to-emerald-950 text-white font-sans relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-neutral-900/90 backdrop-blur-xl rounded-3xl border border-neutral-800 p-8 shadow-2xl space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand & App Info */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20 mb-2">
            <span className="text-3xl">📋</span>
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-[11px] font-bold text-emerald-400">
            <Sparkles size={12} />
            <span>EFL Single Sign-On Security</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            EFL Workflow System
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
            ระบบบันทึกและบริหารจัดการงานสำหรับทีมพนักงาน (Staff Portal) เข้าสู่ระบบปลอดภัยผ่านศูนย์กลาง
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Primary Action: Go to Central SSO Portal */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleGoToCentralSso}
            disabled={isLoggingIn}
            className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-neutral-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Lock size={16} className="text-neutral-950" />
            <span>เข้าสู่ระบบด้วย EFL Central SSO</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-[11px] text-neutral-500 text-center">
            SSO Hub Portal: <span className="font-mono text-neutral-400">http://localhost:3050</span>
          </p>
        </div>

        {/* Manual Token Input Toggle */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors underline"
          >
            {showManualInput ? 'ซ่อนช่องใส่โทเคน' : 'กรอก JWT SSO Token ด้วยตนเอง'}
          </button>

          {showManualInput && (
            <form onSubmit={handleManualTokenSubmit} className="mt-3 space-y-2">
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="วาง JWT Token ที่ได้จาก Central SSO ที่นี่..."
                rows={2}
                className="w-full p-2.5 text-xs font-mono rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-emerald-500 resize-none"
              />
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-bold text-white transition-colors"
              >
                {isLoggingIn ? 'กำลังตรวจสอบ...' : 'ยืนยันโทเคน SSO'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
