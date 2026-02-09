import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { AlertTriangle, Database, CheckCircle2, XCircle } from 'lucide-react';

const STORAGE_KEY = 'sim-manager-data-v2';

export const DataMigration: React.FC = () => {
    const store = useAppStore();
    const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
    const [hasLocalData, setHasLocalData] = useState(() => {
        const localData = localStorage.getItem(STORAGE_KEY);
        return !!localData && localData !== 'null';
    });

    const handleMigrate = async () => {
        setStatus('migrating');

        try {
            const localData = localStorage.getItem(STORAGE_KEY);
            if (!localData) {
                setStatus('error');
                return;
            }

            const parsed = JSON.parse(localData);
            await store.importFullData(parsed);

            // Clear localStorage after successful migration
            localStorage.removeItem(STORAGE_KEY);
            setHasLocalData(false);
            setStatus('success');
        } catch (error) {
            console.error('Migration error:', error);
            setStatus('error');
        }
    };

    const handleSkip = () => {
        localStorage.removeItem(STORAGE_KEY);
        setHasLocalData(false);
    };

    if (!hasLocalData) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Phát Hiện Dữ Liệu Cũ</h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Hệ thống phát hiện dữ liệu từ localStorage (lưu trên máy). Bạn có muốn chuyển dữ liệu sang
                            <span className="font-semibold text-indigo-600"> Supabase Cloud</span> để đồng bộ giữa các thiết bị không?
                        </p>
                    </div>
                </div>

                {status === 'success' && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-sm text-green-700">Chuyển dữ liệu thành công! Dữ liệu đã được lưu trên cloud.</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-700">Có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={handleMigrate}
                        disabled={status === 'migrating' || status === 'success'}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
                    >
                        <Database className="w-5 h-5" />
                        {status === 'migrating' ? 'Đang chuyển...' : 'Chuyển sang Cloud'}
                    </button>

                    <button
                        onClick={handleSkip}
                        disabled={status === 'migrating'}
                        className="w-full px-6 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Bỏ qua (Xóa dữ liệu cũ)
                    </button>
                </div>

                <p className="text-xs text-slate-500 text-center mt-4">
                    ⚠️ Lưu ý: Sau khi chuyển, dữ liệu cũ sẽ bị xóa khỏi localStorage
                </p>
            </div>
        </div>
    );
};
