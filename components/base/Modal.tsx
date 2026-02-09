import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    titleColor?: string;
}

const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl'
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    children,
    size = 'lg',
    titleColor = 'text-slate-800'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4 font-['Inter']">
            <div className={`bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl ${sizeClasses[size]} w-full p-8 md:p-12 border border-slate-100 animate-in zoom-in duration-200`}>
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className={`text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-3 ${titleColor}`}>
                            {icon}
                            {title}
                        </h3>
                        {subtitle && <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm"
                    >
                        <X size={24} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

interface ModalActionsProps {
    onCancel: () => void;
    onConfirm?: () => void;
    cancelText?: string;
    confirmText?: string;
    confirmColor?: 'indigo' | 'emerald' | 'rose' | 'blue';
    isSubmit?: boolean;
}

const confirmColorClasses: Record<string, string> = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-50',
    rose: 'bg-rose-600 hover:bg-rose-700 shadow-rose-50',
    blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
};

export const ModalActions: React.FC<ModalActionsProps> = ({
    onCancel,
    onConfirm,
    cancelText = 'Hủy',
    confirmText = 'Xác nhận',
    confirmColor = 'indigo',
    isSubmit = true
}) => {
    return (
        <div className="flex gap-3 pt-4">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200"
            >
                {cancelText}
            </button>
            <button
                type={isSubmit ? 'submit' : 'button'}
                onClick={isSubmit ? undefined : onConfirm}
                className={`flex-1 py-4 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg ${confirmColorClasses[confirmColor]}`}
            >
                {confirmText}
            </button>
        </div>
    );
};
