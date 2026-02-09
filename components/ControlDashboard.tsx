
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { InventoryProductStat, SaleOrderWithStats, Transaction, CustomerWithStats } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { ShieldAlert, AlertCircle, CheckCircle, Wallet, Package, TrendingUp, TrendingDown, Info, Ban, Zap } from 'lucide-react';

interface Props {
  inventory: InventoryProductStat[];
  orders: SaleOrderWithStats[];
  transactions: Transaction[];
  customers: CustomerWithStats[];
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899'];

const ControlDashboard: React.FC<Props> = ({ inventory, orders, transactions, customers }) => {
  // 1. KPI STRIP LOGIC
  const financialMetrics = useMemo(() => {
    const cashIn = transactions.filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0);
    const cashOut = transactions.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);
    const cashOnHand = cashIn - cashOut;

    const inventoryValue = inventory.reduce((s, item) => s + (item.currentStock * item.weightedAvgCost), 0);
    const totalReceivable = orders.reduce((s, o) => s + o.remaining, 0);
    
    // Updated: Sum actual remaining payables from inventory batches
    const totalPayable = inventory.reduce((s, item) => s + item.totalRemainingPayable, 0);
    
    const netCashPosition = cashOnHand + totalReceivable - totalPayable;

    return { cashOnHand, inventoryValue, totalReceivable, totalPayable, netCashPosition };
  }, [transactions, inventory, orders]);

  // 2. INVENTORY CAPITAL ALLOCATION (Donut Chart)
  const inventoryChartData = useMemo(() => {
    return inventory
      .map(item => ({
        name: item.name,
        value: item.currentStock * item.weightedAvgCost
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [inventory]);

  // 3. RECEIVABLE RISK (Top 5 Concentration)
  const topDebtors = useMemo(() => {
    return [...customers]
      .filter(c => c.currentDebt > 0)
      .sort((a, b) => b.currentDebt - a.currentDebt)
      .slice(0, 5);
  }, [customers]);

  // 4. SLOW MOVING INVENTORY (Stock > 100 units)
  const slowInventory = useMemo(() => {
    return inventory.filter(item => item.currentStock > 100);
  }, [inventory]);

  // 5. DECISION ENGINE
  const decisions = useMemo(() => {
    const list = [];
    if (financialMetrics.netCashPosition < 0) {
      list.push({ 
        level: 'CRITICAL', 
        title: 'DỪNG NHẬP HÀNG (STOP IMPORT)', 
        desc: 'Vị thế tiền mặt ròng đang âm. Ưu tiên thu hồi nợ trước khi tái đầu tư.',
        icon: Ban,
        color: 'text-rose-600 bg-rose-50 border-rose-200'
      });
    }
    if (slowInventory.length > 0) {
      list.push({ 
        level: 'WARNING', 
        title: 'XẢ KHO SIM TỒN (CLEAR SLOW SIM)', 
        desc: `${slowInventory.length} mã hàng đang chiếm dụng vốn lớn. Cần chương trình khuyến mãi giảm tồn.`,
        icon: Zap,
        color: 'text-amber-600 bg-amber-50 border-amber-200'
      });
    }
    const highRiskDebt = orders.filter(o => o.debtLevel === 'RECOVERY').length;
    if (highRiskDebt > 0) {
      list.push({ 
        level: 'ACTION', 
        title: 'KHÓA TÍN DỤNG KHÁCH HÀNG', 
        desc: `Có ${highRiskDebt} đơn hàng quá hạn nghiêm trọng. Ngừng bán nợ cho các đối tác này.`,
        icon: ShieldAlert,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
      });
    }
    if (list.length === 0) {
      list.push({ 
        level: 'SAFE', 
        title: 'HỆ THỐNG AN TOÀN', 
        desc: 'Dòng tiền và tồn kho đang ở mức tối ưu. Có thể tiếp tục mở rộng quy mô.',
        icon: CheckCircle,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
      });
    }
    return list;
  }, [financialMetrics, slowInventory, orders]);

  return (
    <div className="space-y-8 pb-12 font-['Inter'] antialiased">
      {/* BRANDING HEADER */}
      <header className="bg-[#0F172A] p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-[#22C55E] rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle className="text-[#0F172A] w-10 h-10" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-black uppercase tracking-tighter">SIM CONTROL DASHBOARD</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Decision Support System v2.0</p>
          </div>
        </div>
        <div className="hidden md:flex flex-col text-right">
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Thời gian thực</span>
          <span className="text-white font-mono font-bold">{new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: 'Tiền mặt tại quỹ', val: financialMetrics.cashOnHand, icon: Wallet, color: 'text-slate-900' },
          { label: 'Vốn kẹt trong kho', val: financialMetrics.inventoryValue, icon: Package, color: 'text-blue-600' },
          { label: 'Công nợ phải thu', val: financialMetrics.totalReceivable, icon: TrendingUp, color: 'text-orange-600' },
          { label: 'Nợ NCC phải trả', val: financialMetrics.totalPayable, icon: TrendingDown, color: 'text-rose-600' },
          { label: 'Vị thế tiền ròng', val: financialMetrics.netCashPosition, icon: TrendingUp, color: 'text-emerald-600', highlight: true },
        ].map((kpi, i) => (
          <div key={i} className={`p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between h-36 transition-all hover:shadow-md ${kpi.highlight ? 'bg-indigo-600 border-indigo-500 shadow-indigo-100' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-start">
              <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${kpi.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{kpi.label}</span>
              <kpi.icon size={16} className={kpi.highlight ? 'text-indigo-300' : kpi.color} />
            </div>
            <p className={`text-xl font-black truncate ${kpi.highlight ? 'text-white' : kpi.color}`}>
              {formatCurrency(kpi.val)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INVENTORY CAPITAL ANALYSIS */}
        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[450px]">
          <div className="mb-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">Phân bổ vốn lưu động theo Loại SIM</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1 italic uppercase">SIM nào đang giữ nhiều vốn nhất?</p>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {inventoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* RECEIVABLE RISK CONCENTRATION */}
        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[450px]">
          <div className="mb-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">Rủi ro nợ tập trung (Top 5 Đối tác)</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1 italic uppercase">Tập trung rủi ro tài chính tại một điểm</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
            {topDebtors.map(debtor => (
              <div key={debtor.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-black text-slate-400 text-xs">{debtor.creditScore}</div>
                  <div>
                    <p className="font-black text-slate-800 text-xs uppercase">{debtor.name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${debtor.worstDebtLevel === 'RECOVERY' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                        {debtor.worstDebtLevel}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="font-black text-slate-900 text-sm">{formatCurrency(debtor.currentDebt)}</p>
              </div>
            ))}
            {topDebtors.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase text-xs">Sạch bóng nợ</div>
            )}
          </div>
        </section>
      </div>

      {/* DECISION ZONE */}
      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest px-2">Vùng ra quyết định (Decision Zone)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decisions.map((decision, i) => (
            <div key={i} className={`p-8 rounded-[3rem] border-2 shadow-xl flex flex-col justify-between min-h-[220px] transition-transform hover:-translate-y-1 ${decision.color}`}>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <decision.icon className="w-8 h-8" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{decision.level}</span>
                </div>
                <h4 className="text-xl font-black uppercase tracking-tight mb-4 leading-tight">{decision.title}</h4>
                <p className="text-xs font-bold leading-relaxed opacity-80">{decision.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-current border-opacity-10">
                <span className="text-[9px] font-black uppercase tracking-widest italic">Yêu cầu thực thi ngay</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ControlDashboard;
