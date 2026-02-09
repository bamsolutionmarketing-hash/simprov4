import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InventoryProductStat, SaleOrderWithStats, Transaction, CustomerWithStats } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { TrendingUp, TrendingDown, DollarSign, Package, Calendar, Filter, MessageCircle, AlertTriangle, Zap, Wallet } from 'lucide-react';

interface Props {
  packages: InventoryProductStat[];
  orders: SaleOrderWithStats[];
  transactions: Transaction[];
  customers: CustomerWithStats[];
}

const Dashboard: React.FC<Props> = ({ packages, orders, transactions, customers }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (startDate && o.date < startDate) return false;
      if (endDate && o.date > endDate) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const cashIn = filteredTransactions.filter(t => t.type === 'IN').reduce((s,t) => s+t.amount, 0);
  const cashOut = filteredTransactions.filter(t => t.type === 'OUT').reduce((s,t) => s+t.amount, 0);
  const cashBalance = cashIn - cashOut;

  const totalStock = packages.reduce((acc, p) => acc + p.currentStock, 0); 
  const totalReceivables = orders.reduce((acc, o) => acc + o.remaining, 0);
  const totalEstimatedProfit = filteredOrders.reduce((acc, o) => acc + o.profit, 0);

  const lowStockProducts = useMemo(() => {
    return packages.filter(p => p.currentStock < 50).sort((a, b) => a.currentStock - b.currentStock);
  }, [packages]);

  const todayRevenue = orders.filter(o => o.date === todayStr).reduce((s, o) => s + o.totalAmount, 0);
  const todayOrdersCount = orders.filter(o => o.date === todayStr).length;

  const nextWeekStr = new Date();
  nextWeekStr.setDate(nextWeekStr.getDate() + 7);
  const nextWeekISO = nextWeekStr.toISOString().split('T')[0];

  const weeklyDebtOrders = orders.filter(o => 
    o.remaining > 0 && 
    o.dueDate && 
    o.dueDate <= nextWeekISO
  ).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  const handleCopyZalo = () => {
    const header = `📋 THÔNG BÁO THU HỒI NỢ (${formatDate(todayStr)})\n----------------------------\n`;
    const bodyText = weeklyDebtOrders.length > 0 
      ? weeklyDebtOrders.map(o => `🚨 ${o.customerName} - Nợ: ${formatCurrency(o.remaining)} - Hạn: ${formatDate(o.dueDate)}`).join('\n')
      : "✅ Không có nợ đến hạn.";
    navigator.clipboard.writeText(header + bodyText);
    alert("Đã copy tin nhắn nhắc nợ!");
  };

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        map.set(d.toISOString().split('T')[0], 0);
    }
    filteredOrders.forEach(o => {
      if (map.has(o.date)) map.set(o.date, (map.get(o.date) || 0) + o.totalAmount);
    });
    return Array.from(map.entries()).map(([date, revenue]) => ({ name: date.slice(8), revenue }));
  }, [filteredOrders, startDate, endDate]);

  const kpiCardClass = "bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between h-36 hover:shadow-md transition-shadow";

  return (
    <div className="space-y-6 pb-12 font-['Inter']">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tổng quan kinh doanh</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner">
            <Filter size={16} className="text-slate-400" />
            <input type="date" className="bg-transparent text-[10px] font-black text-slate-700 outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="text-slate-300">~</span>
            <input type="date" className="bg-transparent text-[10px] font-black text-slate-700 outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className={kpiCardClass}>
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Vốn lưu động</p>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Wallet size={18} /></div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 truncate">{formatCurrency(cashBalance)}</h3>
        </div>
        <div className={kpiCardClass}>
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Đang cho nợ</p>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><TrendingDown size={18} /></div>
          </div>
          <h3 className="text-2xl font-black text-orange-600 truncate">{formatCurrency(totalReceivables)}</h3>
        </div>
        <div className={kpiCardClass}>
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Tồn kho hiện tại</p>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Package size={18} /></div>
          </div>
          <h3 className="text-2xl font-black text-blue-600 truncate">{totalStock.toLocaleString()} SIM</h3>
        </div>
        <div className={kpiCardClass}>
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Lãi gộp (Kỳ này)</p>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><TrendingUp size={18} /></div>
          </div>
          <h3 className="text-2xl font-black text-indigo-600 truncate">{formatCurrency(totalEstimatedProfit)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[420px]">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8">Doanh thu theo ngày</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(v) => `${v/1000000}M`} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[420px]">
          <h3 className="text-xs font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Cảnh báo tồn kho (Sắp hết)
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 font-black uppercase text-[10px] italic">Mọi thứ đều ổn</div>
            ) : (
              lowStockProducts.map(p => (
                <div key={p.simTypeId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all">
                  <span className="font-black text-slate-700 text-xs uppercase tracking-tight">{p.name}</span>
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full font-black text-[10px]">Chỉ còn: {p.currentStock}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-64 flex flex-col justify-between">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest"><Calendar className="w-5 h-5 text-indigo-600" /> Ngày hôm nay</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số đơn chốt</span><span className="font-black text-indigo-600 text-lg">{todayOrdersCount}</span></div>
            <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doanh thu</span><span className="font-black text-slate-900 text-lg">{formatCurrency(todayRevenue)}</span></div>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl text-[10px] text-indigo-700 font-black uppercase tracking-tight text-center">Tăng trưởng ổn định</div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-64 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest"><AlertTriangle className="w-5 h-5 text-orange-500" /> Nợ đến hạn (7 ngày tới)</h3>
            <button onClick={handleCopyZalo} className="bg-[#0068ff] text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all"><MessageCircle size={14} /> Copy Thông Báo</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {weeklyDebtOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic font-black uppercase text-[10px] tracking-widest">Tất cả nợ đều trong kiểm soát.</div>
            ) : (
              weeklyDebtOrders.map(o => (
                <div key={o.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white transition-all">
                  <div><p className="font-black text-slate-800 text-xs uppercase tracking-tight">{o.customerName}</p><p className="text-[9px] font-black text-slate-400 mt-0.5">Mã: {o.code} • Hạn: {formatDate(o.dueDate)}</p></div>
                  <div className="text-right"><p className="font-black text-sm text-rose-600">{formatCurrency(o.remaining)}</p></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;