'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (role !== 'admin') {
            router.replace('/');
        }
    }, [role, loading]);

    if (loading) {
        return (
            <div className="min-h-page flex items-center justify-center" style={{ backgroundColor: '#F7FAE8' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#73907E', borderTopColor: 'transparent' }} />
                    <p className="text-body" style={{ color: '#21393B', opacity: 0.6 }}>Проверка доступа...</p>
                </div>
            </div>
        );
    }

    if (role !== 'admin') return null;

    return <>{children}</>;
}