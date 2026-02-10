import React, { useState } from 'react';
import { Customer, CustomerWithStats, SaleOrderWithStats } from '../types';
import { generateId, generateCID, formatCurrency, getStartOfMonth, getEndOfMonth } from '../utils';
import { Plus, Trash2, Edit2, Users, Search, MapPin, Phone, Calendar as CalendarIcon } from 'lucide-react';
import { Modal, ModalActions, Input, Select } from './base';

interface Props {
  customers: CustomerWithStats[];
  orders: SaleOrderWithStats[];
  onAdd: (c: Customer) => void;
  onUpdate: (c: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerCRM: React.FC<Props> = ({ customers, orders, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getEndOfMonth());
  const [formData, setFormData] = useState<Customer>({ id: '', cid: '', name: '', phone: '', email: '', address: '', type: 'WHOLESALE', note: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMode) onUpdate(formData);
    else onAdd({ ...formData, id: generateId(), cid: generateCID(formData.name, formData.phone, formData.email) });
    setIsModalOpen(false);
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.cid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ScoreBadge = ({ score }: { score: 'A' | 'B' | 'C' | 'D' }) => {
    const colors = { A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-orange-500', D: 'bg-rose-500' };
    const shadow = { A: 'shadow-emerald-200', B: 'shadow-blue-200', C: 'shadow-orange-200', D: 'shadow-rose-200' };
    return (
      <div className={`${colors[score]} text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-lg ${shadow[score]}`}>{score}</div>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-['Inter']">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Quản lý đối tác</h2>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Tìm tên/SĐT..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-[10px] font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-slate-700 text-[10px] font-bold uppercase tracking-widest focus:outline-none" />
            <span className="text-slate-400">-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-slate-700 text-[10px] font-bold uppercase tracking-widest focus:outline-none" />
          </div>
          <button onClick={() => { setEditMode(false); setFormData({ id: '', cid: '', name: '', phone: '', email: '', address: '', type: 'WHOLESALE', note: '' }); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"><Plus size={18} /> Thêm Mới</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-24 text-center text-slate-300 italic font-black uppercase text-xs tracking-widest bg-white rounded-[3rem] border border-dashed border-slate-200">Chưa có dữ liệu đối tác.</div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-all h-[280px] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <ScoreBadge score={c.creditScore} />
                    <div className="max-w-[140px]">
                      <h3 className="text-lg font-black text-slate-800 tracking-tighter uppercase truncate leading-tight">{c.name}</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.cid}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${c.type === 'WHOLESALE' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{c.type === 'WHOLESALE' ? 'Đại lý' : 'Khách lẻ'}</span>
                </div>
                <div className="space-y-2 text-[11px] font-bold text-slate-500 mb-6">
                  <div className="flex items-center gap-2"><Phone size={14} className="text-indigo-400" /> {c.phone}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-300" /> <span className="truncate">{c.address || 'Chưa cập nhật địa chỉ'}</span></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-5 border-t border-slate-50">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest leading-none">Doanh số</p>
                  <p className="font-black text-slate-900 text-xs">
                    {formatCurrency(orders.filter(o => o.customerId === c.id && (!startDate || o.date >= startDate) && (!endDate || o.date <= endDate)).reduce((s, o) => s + o.totalAmount, 0))}
                  </p>
                </div>
                <div className={`p-4 rounded-3xl border flex flex-col justify-center ${c.currentDebt > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest leading-none">Công nợ</p>
                  <p className={`font-black text-xs ${c.currentDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(c.currentDebt)}</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button onClick={() => { setEditMode(true); setFormData(c); setIsModalOpen(true); }} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all"><Edit2 size={14} /></button>
                {c.currentDebt > 0 ? (
                  <button
                    onClick={() => alert('Không thể xóa đối tác đang còn công nợ! Vui lòng thanh toán hết nợ trước khi xóa.')}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-300 cursor-not-allowed shadow-none transition-all"
                    title="Không thể xóa vì còn công nợ"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => { if (window.confirm('Bạn có chắc chắn muốn xóa đối tác này? Hành động này không thể hoàn tác.')) onDelete(c.id); }}
                    className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 shadow-sm transition-all"
                    title="Xóa đối tác"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editMode ? 'Cập nhật thông tin' : 'Đăng ký đối tác mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input type="text" required label="Tên đối tác (*)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <Input type="text" label="Số điện thoại" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Cấp đối tác" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
              <option value="WHOLESALE">Đại Lý (Wholesale)</option>
            </Select>
            <Input type="text" label="Địa chỉ giao dịch" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <ModalActions onCancel={() => setIsModalOpen(false)} confirmText="Lưu thông tin" />
        </form>
      </Modal>
    </div>
  );
};

export default CustomerCRM;