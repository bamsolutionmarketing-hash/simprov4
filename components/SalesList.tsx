
import React, { useState, useMemo } from 'react';
import { SaleOrder, InventoryProductStat, SaleOrderWithStats, Customer, DueDateLog, Transaction } from '../types';
import { formatCurrency, generateCode, generateId, formatDate, formatNumberWithCommas, parseFormattedNumber } from '../utils';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Modal, ModalActions, Input, Select } from './base';

interface Props {
  orders: SaleOrder[];
  inventoryStats: InventoryProductStat[];
  customers: Customer[];
  getOrderStats: (order: SaleOrder) => SaleOrderWithStats;
  onAdd: (order: SaleOrder) => void;
  onAddTransaction: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onUpdateDueDate: (orderId: string, newDate: string, log: DueDateLog) => void;
}

const SalesList: React.FC<Props> = ({ orders, inventoryStats, customers, getOrderStats, onAdd, onAddTransaction, onDelete, onUpdateDueDate }) => {
  const [activeTab, setActiveTab] = useState<'WHOLESALE' | 'RETAIL'>('WHOLESALE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH' | 'COD'>('TRANSFER');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formData, setFormData] = useState({
    customerId: '', retailCustomerInfo: '', simTypeId: '', quantity: 1,
    salePrice: 0, date: new Date().toISOString().split('T')[0], dueDate: '', note: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableProducts = inventoryStats.filter(p => p.currentStock > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (!formData.date) {
      alert('Vui lòng chọn ngày bán');
      return;
    }

    if (!isPaid && !formData.dueDate) {
      alert('Vui lòng chọn hạn khách trả nợ');
      return;
    }

    setIsSubmitting(true);

    const orderId = generateId();
    const customer = customers.find(c => c.id === formData.customerId);
    const total = formData.quantity * formData.salePrice;

    // Fix: Ensure valid due date.
    // If paid, due date is same as order date (for records).
    // If debt, must use user selected due date.
    const finalDueDate = isPaid ? formData.date : formData.dueDate;

    const newOrder: SaleOrder = {
      id: orderId,
      code: generateCode('SO'),
      date: formData.date,
      customerId: activeTab === 'WHOLESALE' ? formData.customerId : undefined,
      agentName: activeTab === 'WHOLESALE' ? (customer?.name || 'Đại lý') : (formData.retailCustomerInfo || 'Khách lẻ'),
      saleType: activeTab,
      simTypeId: formData.simTypeId,
      quantity: Number(formData.quantity) || 1,
      salePrice: Number(formData.salePrice) || 0,
      dueDate: finalDueDate,
      dueDateChanges: 0,
      note: formData.note,
      isFinished: isPaid
    };

    try {
      // Fix: Execute Add Order FIRST to ensure Foreign Key exists
      // The onAdd function throws if it fails, skipping the transaction creation
      await onAdd(newOrder);

      if (isPaid) {
        await onAddTransaction({
          id: generateId(),
          code: generateCode('TX'),
          type: 'IN',
          date: formData.date,
          amount: total,
          category: activeTab === 'WHOLESALE' ? 'Thu bán sỉ' : 'Thu bán lẻ',
          method: paymentMethod,
          saleOrderId: orderId,
          note: `Thu đơn ${newOrder.code}`
        });
      }

      setIsModalOpen(false);
      setFormData({ customerId: '', retailCustomerInfo: '', simTypeId: '', quantity: 1, salePrice: 0, date: new Date().toISOString().split('T')[0], dueDate: '', note: '' });
    } catch (error) {
      console.error('Error creating order:', error);
      // checking strict equality for error message is risky but helpful for context
      // User will see the alert from useAppStore
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => o.saleType === activeTab && (!startDate || o.date >= startDate) && (!endDate || o.date <= endDate))
      .map(getOrderStats).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, activeTab, getOrderStats, startDate, endDate]);



  return (
    <div className="space-y-4 font-sans">
      <div className="flex justify-between items-center bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100">
        <h2 className="text-lg md:text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" /> Bán Hàng
        </h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-bold shadow-lg flex items-center gap-2 text-[9px] md:text-[11px] uppercase tracking-widest"><Plus size={16} /> Đơn Mới</button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 ml-1">
        <button onClick={() => setActiveTab('WHOLESALE')} className={`pb-2 px-3 font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'WHOLESALE' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Bán Sỉ</button>
        <button onClick={() => setActiveTab('RETAIL')} className={`pb-2 px-3 font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'RETAIL' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Bán Lẻ</button>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[500px]">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[8px] md:text-[9px] border-b border-slate-100 tracking-widest">
              <tr>
                <th className="px-4 py-3">Mã / Ngày</th>
                <th className="px-4 py-3">Khách / SIM</th>
                <th className="px-4 py-3 text-right">Thành Tiền</th>
                <th className="px-4 py-3 text-center">T.Thái</th>
                <th className="px-4 py-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-300 italic font-bold uppercase text-[10px] tracking-widest">Chưa có đơn</td></tr>
              ) : (
                filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-800 text-[10px]">{o.code}</p>
                      <p className="text-[8px] text-slate-400 font-medium uppercase">{o.date.split('-').reverse().join('/')}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-600 text-[10px] uppercase truncate max-w-[100px]">{o.customerName}</p>
                      <p className="text-[8px] text-indigo-500 font-black uppercase truncate max-w-[100px]">{o.productName} (SL:{o.quantity})</p>
                    </td>
                    <td className="px-4 py-4 text-right font-black text-slate-900 text-xs md:text-base whitespace-nowrap">{formatCurrency(o.totalAmount)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[7px] font-bold uppercase border ${o.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                        {o.status === 'PAID' ? 'Xong' : 'Nợ'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => onDelete(o.id)} className="text-slate-200 hover:text-red-500 active:scale-90 transition-all"><Trash2 size={14} /></button>
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
        title={`Tạo Đơn Hàng ${activeTab === 'WHOLESALE' ? 'Sỉ' : 'Lẻ'}`}
        icon={<ShoppingCart className="text-indigo-600" />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {activeTab === 'WHOLESALE' ? (
            <Select required label="Đại lý đối tác" value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}>
              <option value="">-- Chọn đại lý --</option>
              {customers.filter(c => c.type === 'WHOLESALE').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          ) : (
            <Input type="text" placeholder="Tên khách, SĐT..." label="Thông tin khách lẻ" value={formData.retailCustomerInfo} onChange={(e) => setFormData({ ...formData, retailCustomerInfo: e.target.value })} />
          )}

          <Select required label="Sản phẩm (SIM)" value={formData.simTypeId} onChange={(e) => setFormData({ ...formData, simTypeId: e.target.value })}>
            <option value="">-- Chọn loại SIM --</option>
            {availableProducts.map(p => <option key={p.simTypeId} value={p.simTypeId}>{p.name} (Tồn: {p.currentStock})</option>)}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input type="number" required min="1" label="Số lượng" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} />
            <Input type="text" required label="Giá bán / SIM" value={formatNumberWithCommas(formData.salePrice)} onChange={(e) => setFormData({ ...formData, salePrice: parseFormattedNumber(e.target.value) })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input type="date" required label="Ngày bán" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Thanh toán</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button type="button" onClick={() => setIsPaid(true)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${isPaid ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Đã trả</button>
                <button type="button" onClick={() => setIsPaid(false)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${!isPaid ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>Ghi nợ</button>
              </div>
            </div>
          </div>

          {isPaid ? (
            <Select label="Hình thức nhận tiền" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
              <option value="TRANSFER">Chuyển khoản</option>
              <option value="CASH">Tiền mặt</option>
              <option value="COD">Thu hộ COD</option>
            </Select>
          ) : (
            <Input variant="danger" type="date" required label="Hạn khách trả nợ (*)" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
          )}

          <ModalActions onCancel={() => setIsModalOpen(false)} confirmText="Chốt Đơn" isLoading={isSubmitting} />
        </form>
      </Modal>
    </div>
  );
};

export default SalesList;
