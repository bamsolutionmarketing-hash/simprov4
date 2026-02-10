
import React, { useMemo } from 'react';
import { InventoryProductStat, SaleOrderWithStats, Transaction, CustomerWithStats } from '../types';
import { formatCurrency, formatDate, getStartOfMonth, getEndOfMonth } from '../utils';
import {
  ShieldCheck, Wallet, Package, TrendingUp, AlertTriangle,
  Zap, ListFilter, Calendar as CalendarIcon,
  Info, Clock, TrendingDown
} from 'lucide-react';

interface Props {
  inventory: InventoryProductStat[];
  orders: SaleOrderWithStats[];
  transactions: Transaction[];
  customers: CustomerWithStats[];
  onNavigateToCalendar: () => void;
  onNavigateToDebt: () => void;
}

const ControlCenter: React.FC<Props> = ({
  inventory, orders, transactions, customers,
  onNavigateToCalendar, onNavigateToDebt
}) => {
  const [startDate, setStartDate] = React.useState(getStartOfMonth());
  const [endDate, setEndDate] = React.useState(getEndOfMonth());

  const next7DaysISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  const metrics = useMemo(() => {
    const filteredTransactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);
    const filteredOrders = orders.filter(o => o.date >= startDate && o.date <= endDate);

    const cashIn = filteredTransactions.filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0);
    const cashOut = filteredTransactions.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);
    const workingCapital = cashIn - cashOut;
    const inventoryValue = inventory.reduce((s, item) => s + (item.currentStock * item.weightedAvgCost), 0);

    // Receivable/Payable & Inventory are snapshots (current state), not filtered by date range typically.
    // However, Revenue and Profit SHOULD be filtered by date range.

    const totalReceivable = orders.reduce((s, o) => s + o.remaining, 0); // Keep as current total
    const totalPayable = inventory.reduce((s, item) => s + item.totalRemainingPayable, 0); // Keep as current total

    const grossProfit = filteredOrders.reduce((s, o) => s + o.profit, 0);
    const netRevenue = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);

    const totalSimQty = inventory.reduce((s, item) => s + item.currentStock, 0);
    const lowStockCount = inventory.filter(p => p.currentStock < 50).length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const agingInventoryCount = inventory.filter(item =>
      item.batches.some(b => b.importDate < thirtyDaysAgo.toISOString().split('T')[0] && b.stock > 0)
    ).length;
    const debt7DaysOrders = orders.filter(o => o.remaining > 0 && o.dueDate && o.dueDate <= next7DaysISO);
    const debt7DaysAmount = debt7DaysOrders.reduce((s, o) => s + o.remaining, 0);

    return { workingCapital, totalReceivable, totalPayable, inventoryValue, grossProfit, netRevenue, totalSimQty, lowStockCount, agingInventoryCount, debt7DaysOrders, debt7DaysAmount };
  }, [transactions, inventory, orders, next7DaysISO, startDate, endDate]);

  const decisions = useMemo(() => {
    const list = [];
    if (metrics.workingCapital < 0) {
      list.push({ level: 'NGUY CẤP', label: '🔴 DỪNG NHẬP SIM', desc: 'Vốn lưu động âm. Ưu tiên thu hồi nợ.', color: 'bg-rose-50 text-rose-700 border-rose-200' });
    }
    if (metrics.debt7DaysAmount > 30000000) {
      list.push({ level: 'CẢNH BÁO', label: '🟡 ƯU TIÊN THU NỢ', desc: 'Nợ đến hạn cao trong tuần tới.', color: 'bg-amber-50 text-amber-700 border-amber-200' });
    }
    if (metrics.totalPayable > 50000000) {
      list.push({ level: 'CẢNH BÁO', label: '🔴 TRẢ NỢ NCC', desc: 'Khoản nợ NCC lớn, cần cân đối chi.', color: 'bg-rose-50 text-rose-700 border-rose-200' });
    }
    if (list.length === 0) {
      list.push({ level: 'AN TOÀN', label: '🟢 HỆ THỐNG ỔN ĐỊH', desc: 'Dòng tiền và tồn kho tối ưu.', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' });
    }
    return list;
  }, [metrics]);

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
      {/* Header gọn hơn trên mobile */}
      <header className="bg-[#0F172A] p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between shadow-xl border border-slate-800 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white text-lg md:text-2xl font-black uppercase tracking-tight">Điều Khiển</h1>
            <p className="text-slate-500 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Hệ Thống Quản Trị Mục Tiêu</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-white text-[10px] font-bold uppercase tracking-widest focus:outline-none [color-scheme:dark]" />
          <span className="text-slate-500">-</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-white text-[10px] font-bold uppercase tracking-widest focus:outline-none [color-scheme:dark]" />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={onNavigateToCalendar} className="flex-1 md:px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 border border-slate-700">
            <CalendarIcon size={12} /> Lịch
          </button>
          <button onClick={onNavigateToDebt} className="flex-1 md:px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20">
            <ListFilter size={12} /> Sổ Nợ
          </button>
        </div>
      </header>

      {/* KPI 5 thẻ - 2 cột trên mobile */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-5">
        {
          [
            { label: 'Vốn lưu động', val: metrics.workingCapital, icon: Wallet, color: metrics.workingCapital < 0 ? 'text-rose-600' : 'text-emerald-600' },
            { label: 'Nợ phải thu', val: metrics.totalReceivable, icon: TrendingUp, color: 'text-orange-600' },
            { label: 'Nợ NCC', val: metrics.totalPayable, icon: TrendingDown, color: 'text-rose-500' },
            { label: 'Tồn kho', val: metrics.inventoryValue, icon: Package, color: 'text-blue-600' },
            { label: 'Lãi gộp', val: metrics.grossProfit, icon: Zap, color: 'text-indigo-600' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-28 md:h-32 transition-transform active:scale-95">
              <div className="flex justify-between items-start">
                <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{kpi.label}</span>
                <kpi.icon size={14} className="text-slate-300" />
              </div>
              <p className={`text-sm md:text-lg font-black whitespace-nowrap overflow-hidden text-ellipsis ${kpi.color}`}>
                {formatCurrency(kpi.val)}
              </p>
            </div>
          ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <section className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] md:text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
                <Clock className="text-indigo-500" size={14} /> Dòng tiền
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end pb-2 border-b border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Doanh thu thuần</span>
                  <span className="text-sm md:text-lg font-black text-slate-900 whitespace-nowrap">{formatCurrency(metrics.netRevenue)}</span>
                </div>
                <div className="flex justify-between items-end pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Lợi nhuận gộp</span>
                  <span className="text-sm md:text-lg font-black text-emerald-600 whitespace-nowrap">{formatCurrency(metrics.grossProfit)}</span>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] md:text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
                <Package className="text-blue-500" size={14} /> Áp lực kho
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Tổng SIM tồn</span>
                  <span className="font-black text-slate-900 text-sm">{metrics.totalSimQty.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <div className={`flex-1 p-3 rounded-xl border ${metrics.lowStockCount > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Sắp hết</p>
                    <p className={`font-black text-sm ${metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{metrics.lowStockCount}</p>
                  </div>
                  <div className={`flex-1 p-3 rounded-xl border ${metrics.agingInventoryCount > 0 ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Tồn lâu</p>
                    <p className={`font-black text-sm ${metrics.agingInventoryCount > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{metrics.agingInventoryCount}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
              <h3 className="text-[10px] md:text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={14} /> Áp lực thu nợ
              </h3>
              <div className="bg-rose-50 px-3 py-1.5 rounded-xl w-full md:w-auto text-center">
                <span className="text-[9px] font-black text-rose-600 uppercase">Nợ 7 ngày: {formatCurrency(metrics.debt7DaysAmount)}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[300px]">
                <thead className="text-[9px] font-black text-slate-400 uppercase border-b border-slate-50">
                  <tr>
                    <th className="pb-3 px-1">Đối tác</th>
                    <th className="pb-3 px-1 text-right">Số nợ</th>
                    <th className="pb-3 px-1 text-center">Hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {metrics.debt7DaysOrders.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-slate-300 italic font-bold text-[10px] uppercase tracking-widest">Sạch bóng nợ</td></tr>
                  ) : (
                    metrics.debt7DaysOrders.map(o => (
                      <tr key={o.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-1">
                          <span className="font-black text-slate-700 uppercase text-[10px] truncate max-w-[100px] block">{o.customerName}</span>
                        </td>
                        <td className="py-3 px-1 text-right font-black text-rose-600 text-xs whitespace-nowrap">{formatCurrency(o.remaining)}</td>
                        <td className="py-3 px-1 text-center">
                          <span className="text-[9px] font-bold text-slate-400">{o.dueDate?.split('-').slice(1).reverse().join('/')}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="space-y-4 md:space-y-6">
          <div className="bg-[#1E293B] p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl flex flex-col">
            <div className="flex items-center gap-3 mb-6 md:mb-10">
              <Zap className="text-amber-400 fill-amber-400" size={20} />
              <h3 className="text-xs font-black text-white uppercase tracking-tighter">Vùng Quyết Định</h3>
            </div>
            <div className="flex-1 space-y-4">
              {decisions.map((d, i) => (
                <div key={i} className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all hover:scale-[1.02] ${d.color}`}>
                  <div className="flex items-center gap-2">
                    <Info size={14} />
                    <span className="text-[9px] font-black uppercase tracking-tight">{d.level}</span>
                  </div>
                  <h4 className="text-[10px] font-black uppercase">{d.label}</h4>
                  <p className="text-[9px] font-bold leading-relaxed opacity-90">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ControlCenter;
