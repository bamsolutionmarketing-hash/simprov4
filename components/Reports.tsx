
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, SaleOrderWithStats, DueDateLog, InventoryProductStat } from '../types';
import { formatCurrency, formatDate, generateId } from '../utils';
import { useAppStore } from '../hooks/useAppStore';
import {
    Calendar as CalendarIcon, Eye, ChevronLeft, ChevronRight, Siren, ClipboardList, X, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { Modal, ModalActions, Input, Textarea } from './base';

interface Props {
    transactions: Transaction[];
    orders: SaleOrderWithStats[];
    inventoryStats: InventoryProductStat[];
    onUpdateDueDate: (orderId: string, newDate: string, log: DueDateLog) => void;
    initialTab?: 'CALENDAR' | 'DEBT';
}

const Reports: React.FC<Props> = ({ transactions, orders, inventoryStats, onUpdateDueDate, initialTab = 'CALENDAR' }) => {
    const { dueDateLogs } = useAppStore();
    const [activeTab, setActiveTab] = useState<'DEBT' | 'CALENDAR'>(initialTab);

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [selectedDayDetails, setSelectedDayDetails] = useState<{ date: string, orders: SaleOrderWithStats[], transactions: Transaction[] } | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<SaleOrderWithStats | null>(null);
    const [newDueDate, setNewDueDate] = useState('');
    const [reason, setReason] = useState('');

    const debtOrders = useMemo(() => orders.filter(o => o.remaining > 0), [orders]);

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;
        const log: DueDateLog = {
            id: generateId(),
            orderId: selectedOrder.id,
            oldDate: selectedOrder.dueDate,
            newDate: newDueDate,
            reason: reason,
            updatedAt: new Date().toISOString()
        };
        onUpdateDueDate(selectedOrder.id, newDueDate, log);
        setIsModalOpen(false);
        setSelectedOrder(null);
        setReason('');
    };

    const calendarDays = useMemo(() => {
        const days = [];
        const count = new Date(viewYear, viewMonth + 1, 0).getDate();
        for (let i = 1; i <= count; i++) {
            const d = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayOrders = orders.filter(o => o.date === d);
            const dayTxs = transactions.filter(t => t.date === d);
            days.push({
                day: i,
                date: d,
                profit: dayOrders.reduce((s, o) => s + o.profit, 0),
                orders: dayOrders,
                transactions: dayTxs
            });
        }
        return days;
    }, [viewMonth, viewYear, orders, transactions]);



    return (
        <div className="space-y-6 pb-12 font-['Inter']">
            <div className="flex gap-4 border-b border-slate-200">
                <button onClick={() => setActiveTab('CALENDAR')} className={`pb-3 px-4 font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'CALENDAR' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Lịch doanh thu</button>
                <button onClick={() => setActiveTab('DEBT')} className={`pb-3 px-4 font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'DEBT' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-400'}`}>Sổ nợ đại lý</button>
            </div>

            {activeTab === 'CALENDAR' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); }} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 hover:bg-slate-100 transition-all"><ChevronLeft size={20} /></button>
                        <div className="text-lg font-black text-slate-800 uppercase tracking-tighter">Tháng {viewMonth + 1} / {viewYear}</div>
                        <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); }} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 hover:bg-slate-100 transition-all"><ChevronRight size={20} /></button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                        {calendarDays.map((item) => (
                            <div key={item.date} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col justify-between min-h-[140px] relative group hover:shadow-md transition-all ${item.date === new Date().toISOString().split('T')[0] ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-50'}`}>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-black text-slate-300">{item.day}</span>
                                    {(item.orders.length > 0 || item.transactions.length > 0) && (
                                        <button
                                            onClick={() => setSelectedDayDetails({ date: item.date, orders: item.orders, transactions: item.transactions })}
                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl transition-all hover:bg-indigo-100 shadow-sm"
                                        >
                                            <Eye size={14} />
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">{item.orders.length} Đơn / {item.transactions.length} GD</p>
                                    <p className={`text-xs font-black mt-1 ${item.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(item.profit)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'DEBT' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    {debtOrders.length === 0 ? (
                        <div className="bg-white p-24 text-center rounded-[3rem] border border-dashed border-slate-300 text-slate-400 font-black uppercase text-xs tracking-widest">Hệ thống sạch bóng nợ đại lý.</div>
                    ) : (
                        debtOrders.map(order => {
                            const logs = dueDateLogs.filter(l => l.orderId === order.id);
                            const isRecovery = (order.dueDateChanges || 0) >= 3 || order.debtLevel === 'RECOVERY';

                            return (
                                <div key={order.id} className={`bg-white p-8 rounded-[3rem] border shadow-sm space-y-6 transition-all hover:shadow-md ${isRecovery ? 'border-rose-300 ring-4 ring-rose-50 animate-pulse-subtle' : 'border-slate-100'}`}>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg uppercase ${isRecovery ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {isRecovery ? <Siren size={24} /> : order.customerName[0]}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-slate-800 text-lg uppercase tracking-tighter">{order.customerName}</h4>
                                                    {isRecovery && (
                                                        <span className="px-3 py-1 bg-rose-600 text-white text-[9px] font-black uppercase rounded-lg shadow-lg shadow-rose-200">THU HỒI NỢ</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Mã đơn: {order.code} • Hạn trả: {formatDate(order.dueDate)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-black leading-none ${isRecovery ? 'text-rose-700' : 'text-rose-600'}`}>{formatCurrency(order.remaining)}</p>
                                            <div className="flex items-center justify-end gap-2 mt-3">
                                                <span className={`text-[9px] font-black px-2 py-1 rounded border ${order.dueDateChanges >= 2 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>GIA HẠN: {order.dueDateChanges} LẦN</span>
                                                <button onClick={() => { setSelectedOrder(order); setNewDueDate(order.dueDate); setIsModalOpen(true); }} className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-2xl border border-indigo-100 shadow-sm hover:bg-indigo-100 transition-all">Gia hạn nợ</button>
                                            </div>
                                        </div>
                                    </div>

                                    {logs.length > 0 && (
                                        <div className="pt-6 border-t border-slate-100">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ClipboardList size={14} /> Lịch sử lý do hẹn trả ({logs.length})</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {logs.map(log => (
                                                    <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[9px] font-black text-indigo-500 uppercase">{formatDate(log.updatedAt)}</span>
                                                            <span className="text-[8px] font-bold text-slate-300">#{log.id.slice(0, 4)}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 font-semibold italic leading-relaxed">"{log.reason}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Day Details Modal */}
            <Modal
                isOpen={!!selectedDayDetails}
                onClose={() => setSelectedDayDetails(null)}
                title={`Chi tiết ngày ${selectedDayDetails ? formatDate(selectedDayDetails.date) : ''}`}
                subtitle="Tổng quan các phát sinh thực tế"
                size="xl"
            >
                {selectedDayDetails && (

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><ArrowUpCircle size={16} /> Đơn hàng đã chốt ({selectedDayDetails.orders.length})</h4>
                                {selectedDayDetails.orders.length === 0 ? (
                                    <div className="p-10 text-center text-slate-300 italic font-bold text-xs border border-dashed border-slate-200 rounded-3xl">Không có đơn hàng mới</div>
                                ) : (
                                    selectedDayDetails.orders.map(o => (
                                        <div key={o.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                                            <div><p className="font-black text-slate-800 text-xs uppercase">{o.customerName}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{o.productName} (SL: {o.quantity})</p></div>
                                            <div className="text-right font-black text-slate-900">{formatCurrency(o.totalAmount)}</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><ArrowDownCircle size={16} /> Phát sinh dòng tiền ({selectedDayDetails.transactions.length})</h4>
                                {selectedDayDetails.transactions.length === 0 ? (
                                    <div className="p-10 text-center text-slate-300 italic font-bold text-xs border border-dashed border-slate-200 rounded-3xl">Không có giao dịch tiền mặt</div>
                                ) : (
                                    selectedDayDetails.transactions.map(t => (
                                        <div key={t.id} className={`p-4 rounded-2xl border shadow-sm flex justify-between items-center ${t.type === 'IN' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                                            <div className="flex items-center gap-3">
                                                {t.type === 'IN' ? <ArrowUpCircle className="text-emerald-500" size={18} /> : <ArrowDownCircle className="text-rose-500" size={18} />}
                                                <div><p className="font-black text-slate-800 text-xs uppercase">{t.category}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{t.method}</p></div>
                                            </div>
                                            <div className={`font-black ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isModalOpen && !!selectedOrder}
                onClose={() => setIsModalOpen(false)}
                title="Gia Hạn Nợ"
                icon={<CalendarIcon size={28} />}
                titleColor="text-indigo-600"
            >
                {selectedOrder && (
                    <form onSubmit={handleUpdateSubmit} className="space-y-8">
                        <Input type="date" required label="Ngày hẹn trả mới" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                        <Textarea required rows={4} label="Lý do gia hạn (*)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Khách hẹn trả vào ngày... vì lý do..." />
                        <ModalActions onCancel={() => setIsModalOpen(false)} />
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default Reports;
