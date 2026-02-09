import React from 'react';

type InputVariant = 'default' | 'danger';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  label?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: InputVariant;
  label?: string;
  children: React.ReactNode;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: InputVariant;
  label?: string;
}

const baseClasses = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none transition-all";
const focusClasses: Record<InputVariant, string> = {
  default: "focus:ring-2 focus:ring-indigo-600",
  danger: "focus:ring-2 focus:ring-rose-500 border-rose-200 bg-rose-50"
};

const labelClasses = "block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest";
const dangerLabelClasses = "block text-[10px] font-black text-rose-400 uppercase mb-2 ml-1 tracking-widest";

export const Input: React.FC<InputProps> = ({ variant = 'default', label, className = '', ...props }) => {
  return (
    <div>
      {label && <label className={variant === 'danger' ? dangerLabelClasses : labelClasses}>{label}</label>}
      <input className={`${baseClasses} ${focusClasses[variant]} ${className}`} {...props} />
    </div>
  );
};

export const Select: React.FC<SelectProps> = ({ variant = 'default', label, className = '', children, ...props }) => {
  return (
    <div>
      {label && <label className={variant === 'danger' ? dangerLabelClasses : labelClasses}>{label}</label>}
      <select className={`${baseClasses} ${focusClasses[variant]} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
};

export const Textarea: React.FC<TextareaProps> = ({ variant = 'default', label, className = '', ...props }) => {
  return (
    <div>
      {label && <label className={variant === 'danger' ? dangerLabelClasses : labelClasses}>{label}</label>}
      <textarea className={`${baseClasses} ${focusClasses[variant]} ${className}`} {...props} />
    </div>
  );
};
