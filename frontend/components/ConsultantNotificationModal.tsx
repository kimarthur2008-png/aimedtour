'use client';

import { useState } from 'react';
import { confirmConsultantRole, clearPendingNotification } from '@/lib/firebase-support';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function ConsultantNotificationModal() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const m = t.consultantModal;
  const [loading, setLoading] = useState(false);

  const notification = profile?.pendingNotification;
  if (!notification || !user) return null;

  async function handleAgree() {
    if (!user) return;
    setLoading(true);
    await confirmConsultantRole(user.uid);
    await refreshProfile();
    setLoading(false);
  }

  async function handleDeclineOrClose() {
    if (!user) return;
    setLoading(true);
    await clearPendingNotification(user.uid);
    await refreshProfile();
    setLoading(false);
  }

  if (notification.type === 'consultant_approved') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{m.approvedEmoji}</div>
            <h2 className="text-2xl font-bold text-gray-900">{m.approvedTitle}</h2>
            <p className="text-gray-600 mt-2">{m.approvedDesc}</p>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 mb-5">
            <h3 className="font-semibold text-teal-800 mb-3">{m.rulesTitle}</h3>
            <ul className="text-sm text-teal-700 space-y-2">
              {[m.rule1,m.rule2,m.rule3,m.rule4,m.rule5,m.rule6].map((rule,i) => (
                <li key={i}>• {rule}</li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-blue-800 mb-3">{m.capTitle}</h3>
            <ul className="text-sm text-blue-700 space-y-2">
              {[m.cap1,m.cap2,m.cap3,m.cap4].map((cap,i) => (
                <li key={i}>• {cap}</li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-gray-600 text-center mb-5">{m.agreeNote}</p>

          <div className="flex gap-3">
            <button onClick={handleAgree} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50">
              {loading ? '...' : m.agreeBtn}
            </button>
            <button onClick={handleDeclineOrClose} disabled={loading}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
              {m.declineBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="text-5xl mb-3">{m.rejEmoji}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{m.rejTitle}</h2>
        <p className="text-gray-600 mb-2">{m.rejDesc}</p>
        <p className="text-sm text-gray-500 mb-6">{m.rejSub}</p>
        <button onClick={handleDeclineOrClose} disabled={loading}
          className="w-full py-3 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50">
          {loading ? '...' : m.understoodBtn}
        </button>
      </div>
    </div>
  );
}
