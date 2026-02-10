
import React, { useState, useMemo } from 'react';
import { Transaction, SaleOrderWithStats, SimPackage } from '../types';
import { formatCurrency, generateCode, generateId, formatDate, formatNumberWithCommas, parseFormattedNumber, getStartOfMonth, getEndOfMonth } from '../utils';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { Modal, ModalActions, Input, Select } from './base';

interface Props {
  transactions: Transaction[];
  orders: SaleOrderWithStats[];
  packages: SimPackage[];
  onAdd: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

const CashFlow: React.FC<Props> = ({ transactions, orders, packages, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getEndOfMonth());
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], amount: 0, category: 'Thu bán sỉ', method: 'TRANSFER',
    saleOrderId: '', simPackageId: '', note: ''
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t =>
      (!startDate || t.date >= startDate) &&
      (!endDate || t.date <= endDate)
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, startDate, endDate]);

  const stats = useMemo(() => {
    const list = filteredTransactions;
    const getBalance = (method?: string) => {
      const filtered = method ? list.filter(t => t.method === method) : list;
      return filtered.filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0) - filtered.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);
    };
    return { total: getBalance(), transfer: getBalance('TRANSFER'), cash: getBalance('CASH') };
  }, [filteredTransactions]);

  const pendingOrders = useMemo(() => orders.filter(o => o.remaining > 0), [orders]);

  const pendingPackages = useMemo(() => {
    return packages.filter(pkg => {
      const paid = transactions
        .filter(t => t.simPackageId === pkg.id && t.type === 'OUT')
        .reduce((s, t) => s + t.amount, 0);
      return pkg.totalImportPrice - paid > 0;
    }).map(pkg => {
      const paid = transactions
        .filter(t => t.simPackageId === pkg.id && t.type === 'OUT')
        .reduce((s, t) => s + t.amount, 0);
      return { ...pkg, remaining: pkg.totalImportPrice - paid };
    });
  }, [packages, transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: generateId(), code: generateCode('TX'), type: transactionType,
      date: formData.date, amount: Number(formData.amount),
      category: formData.category, method: formData.method as any,
      saleOrderId: formData.saleOrderId || undefined,
      simPackageId: formData.simPackageId || undefined,
      note: formData.note
    });
    setIsModalOpen(false);
    setFormData({ ...formData, amount: 0, saleOrderId: '', simPackageId: '', note: '' });
  };



  return (
    <div className="space-y-4 md:space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[3rem] shadow-sm border border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
          <h2 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight">Sổ Quỹ</h2>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-slate-700 text-[10px] font-bold uppercase tracking-widest focus:outline-none" />
          <span className="text-slate-400">-</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-slate-700 text-[10px] font-bold uppercase tracking-widest focus:outline-none" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => { setTransactionType('IN'); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-50"><Plus size={14} /> Thu</button>
          <button onClick={() => { setTransactionType('OUT'); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-widest shadow-lg shadow-rose-50"><Plus size={14} /> Chi</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block mb-1">C.Khoản</span>
          <p className="text-xs md:text-lg font-black text-blue-600 whitespace-nowrap overflow-hidden text-ellipsis">{formatCurrency(stats.transfer)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tiền mặt</span>
          <p className="text-xs md:text-lg font-black text-emerald-600 whitespace-nowrap overflow-hidden text-ellipsis">{formatCurrency(stats.cash)}</p>
        </div>
        <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-50 col-span-2 md:col-span-1">
          <span className="text-[7px] font-bold text-indigo-200 uppercase tracking-widest block mb-1">Tổng Số Dư</span>
          <p className="text-sm md:text-xl font-black text-white whitespace-nowrap">{formatCurrency(stats.total)}</p>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[500px]">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[8px] md:text-[9px] border-b border-slate-100 tracking-widest">
              <tr>
                <th className="px-4 py-3">Ngày / Mã</th>
                <th className="px-4 py-3">Phân loại</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-300 italic font-bold uppercase text-[10px] tracking-widest">Không có dữ liệu</td></tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-800 text-[10px]">{formatDate(tx.date).split('/').slice(0, 2).join('/')}</p>
                      <p className="text-[7px] text-slate-400 font-bold uppercase">{tx.code.slice(-6)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {tx.type === 'IN' ? <ArrowUpCircle size={12} className="text-emerald-500" /> : <ArrowDownCircle size={12} className="text-rose-500" />}
                        <span className="font-bold text-slate-600 text-[9px] uppercase truncate max-w-[80px]">{tx.category}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-4 text-right font-black text-xs md:text-base whitespace-nowrap ${tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => onDelete(tx.id)} className="text-slate-200 hover:text-red-500 active:scale-90"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Lập ${transactionType === 'IN' ? 'Phiếu Thu' : 'Phiếu Chi'}`}
        titleColor={transactionType === 'IN' ? 'text-emerald-600' : 'text-rose-600'}
      >

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" required label="Ngày lập" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            <Select label="Hình thức" value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}>
              <option value="TRANSFER">C.Khoản</option>
              <option value="CASH">Tiền mặt</option>
              <option value="COD">COD</option>
            </Select>
          </div>

          <Input type="text" required label="Số tiền (VNĐ)" value={formatNumberWithCommas(formData.amount)} onChange={(e) => setFormData({ ...formData, amount: parseFormattedNumber(e.target.value) })} />

          <Select label="Danh mục" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
            {transactionType === 'IN' ? (
              <>
                <option value="Thu bán sỉ">Thu bán sỉ</option>
                <option value="Thu bán lẻ">Thu bán lẻ</option>
                <option value="Thu khác">Thu khác</option>
              </>
            ) : (
              <>
                <option value="Chi nhập SIM">Chi nhập SIM</option>
                <option value="Chi ship">Chi ship</option>
                <option value="Chi phí vận hành">Chi vận hành</option>
                <option value="Chi khác">Chi khác</option>
              </>
            )}
          </Select>

          {transactionType === 'IN' && (
            <Select label="Gán đơn hàng khách nợ (Tùy chọn)" value={formData.saleOrderId} onChange={(e) => {
              const order = pendingOrders.find(o => o.id === e.target.value);
              if (order && formData.amount === 0) setFormData({ ...formData, saleOrderId: e.target.value, amount: order.remaining });
              else setFormData({ ...formData, saleOrderId: e.target.value });
            }}>
              <option value="">-- Không gán --</option>
              {pendingOrders.map(o => <option key={o.id} value={o.id}>{o.code} - {o.customerName} (Nợ: {formatCurrency(o.remaining)})</option>)}
            </Select>
          )}

          {transactionType === 'OUT' && formData.category === 'Chi nhập SIM' && (
            <Select variant="danger" label="Gán lô hàng nhập nợ (Tùy chọn)" value={formData.simPackageId} onChange={(e) => {
              const pkg = pendingPackages.find(p => p.id === e.target.value);
              if (pkg && formData.amount === 0) setFormData({ ...formData, simPackageId: e.target.value, amount: pkg.remaining });
              else setFormData({ ...formData, simPackageId: e.target.value });
            }}>
              <option value="">-- Không gán --</option>
              {pendingPackages.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name} (Nợ: {formatCurrency(p.remaining)})</option>)}
            </Select>
          )}

          <ModalActions onCancel={() => setIsModalOpen(false)} confirmText="Lưu Phiếu" confirmColor={transactionType === 'IN' ? 'emerald' : 'rose'} />
        </form>
      </Modal>
    </div>
  );
};

export default CashFlow;
