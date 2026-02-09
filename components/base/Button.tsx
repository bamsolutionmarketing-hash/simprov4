import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-600',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-50',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-50',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-500'
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-[8px] gap-1',
    md: 'px-4 py-2.5 text-[9px] gap-1.5',
    lg: 'px-6 py-3 text-[11px] gap-2'
};

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    icon,
    children,
    className = '',
    ...props
}) => {
    return (
        <button
            className={`rounded-xl font-black uppercase tracking-widest flex items-center justify-center transition-all ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {icon}
            {children}
        </button>
    );
};
