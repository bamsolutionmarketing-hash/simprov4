import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Input, Button } from './base';
import { ShieldCheck, LogIn, UserPlus } from 'lucide-react';

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'LOGIN') {
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (loginError) throw loginError;
            } else {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw signUpError;
                alert('Vui lòng kiểm tra email để xác nhận đăng ký!');
                setMode('LOGIN');
            }
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Inter']">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10 md:p-14 border border-slate-100 animate-in zoom-in duration-300">
                <div className="text-center mb-10">
                    <div className="bg-indigo-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100">
                        <ShieldCheck className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">SIMPRO V3</h1>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {mode === 'LOGIN' ? 'Đăng nhập hệ thống' : 'Đăng ký tài khoản mới'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <Input
                        type="email"
                        required
                        label="Email"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        type="password"
                        required
                        label="Mật khẩu"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-500 p-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full py-4 shadow-lg shadow-indigo-100"
                        disabled={loading}
                        icon={mode === 'LOGIN' ? <LogIn className="mr-2 w-4 h-4" /> : <UserPlus className="mr-2 w-4 h-4" />}
                    >
                        {loading ? 'Đang xử lý...' : mode === 'LOGIN' ? 'Đăng nhập ngay' : 'Tham gia ngay'}
                    </Button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        {mode === 'LOGIN' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    </p>
                    <button
                        onClick={() => {
                            setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                            setError(null);
                        }}
                        className="text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:text-indigo-700 transition-colors"
                    >
                        {mode === 'LOGIN' ? 'Tạo tài khoản mới' : 'Quay lại đăng nhập'}
                    </button>
                </div>
            </div>
        </div>
    );
};
