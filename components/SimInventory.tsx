
import React, { useState } from 'react';
import { SimPackage, SimType, InventoryProductStat } from '../types';
import { formatCurrency, generateCode, generateId, formatDate, formatNumberWithCommas, parseFormattedNumber } from '../utils';
import { Plus, Trash2, Box, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { Modal, ModalActions, Input, Select } from './base';

interface Props {
  inventoryStats: InventoryProductStat[];
  simTypes: SimType[];
  onAdd: (pkg: SimPackage, method: 'TRANSFER' | 'CASH' | 'CREDIT') => void;
  onDeleteBatch: (id: string) => void;
  onNavigateToProducts: () => void;
}

const SimInventory: React.FC<Props> = ({ inventoryStats, simTypes, onAdd, onDeleteBatch, onNavigateToProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH' | 'CREDIT'>('TRANSFER');
  const [formData, setFormData] = useState({
    simTypeId: '',
    quantity: '',
    unitPrice: '',
    totalImportPrice: '',
    importDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  });

  const handlePriceCalc = (qty: string, unit: string) => {
    const q = parseInt(qty.replace(/\D/g, ''), 10) || 0;
    const u = parseFormattedNumber(unit);
    return (q * u).toString();
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedType = simTypes.find(t => t.id === formData.simTypeId);
    if (!selectedType) return;
    onAdd({
      id: generateId(), code: generateCode('SIM'), name: selectedType.name,
      simTypeId: selectedType.id,
      quantity: parseInt(formData.quantity.replace(/\D/g, ''), 10) || 0,
      totalImportPrice: parseFormattedNumber(formData.totalImportPrice),
      importDate: formData.importDate,
      dueDate: paymentMethod === 'CREDIT' ? formData.dueDate : undefined,
    }, paymentMethod);
    setIsModalOpen(false);
    setFormData({
      simTypeId: '',
      quantity: '',
      unitPrice: '',
      totalImportPrice: '',
      importDate: new Date().toISOString().split('T')[0],
      dueDate: ''
    });
  };



  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-center bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100">
        <h2 className="text-lg md:text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <Box className="w-6 h-6 md:w-8 md:h-8 text-blue-600" /> Kho Sim
        </h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-2 text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all">
          <Plus className="w-4 h-4 md:w-5 md:h-5" /> Nhập Lô
        </button>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm text-left min-w-[500px]">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[8px] md:text-[9px] border-b border-slate-100 tracking-widest">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Sản Phẩm</th>
                <th className="px-4 py-3 text-right">Tồn Kho</th>
                <th className="px-4 py-3 text-right">Nợ NCC</th>
                <th className="px-4 py-3 text-center">T.Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {inventoryStats.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-300 italic font-bold uppercase text-[10px] tracking-widest">Kho đang trống</td></tr>
              ) : (
                inventoryStats.map((stat) => (
                  <React.Fragment key={stat.simTypeId}>
                    <tr className="hover:bg-slate-50/50 cursor-pointer active:bg-slate-100 transition-colors" onClick={() => toggleExpand(stat.simTypeId)}>
                      <td className="px-4 py-4 text-slate-300">
                        {expandedRows.includes(stat.simTypeId) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td className="px-4 py-4 font-black text-blue-700 uppercase text-[10px] md:text-xs">{stat.name}</td>
                      <td className="px-4 py-4 text-right font-black text-slate-900 text-xs md:text-base whitespace-nowrap">{stat.currentStock.toLocaleString()}</td>
                      <td className={`px-4 py-4 text-right font-black text-xs md:text-base whitespace-nowrap ${stat.totalRemainingPayable > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {formatCurrency(stat.totalRemainingPayable)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className={`w-2 h-2 rounded-full mx-auto ${stat.status === 'LOW_STOCK' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      </td>
                    </tr>
                    {expandedRows.includes(stat.simTypeId) && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={5} className="p-0">
                          <div className="px-6 md:px-12 py-4 border-y border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {stat.batches.map(batch => (
                                <div key={batch.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                                  <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-slate-300 uppercase mb-0.5">{batch.code}</span>
                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{formatDate(batch.importDate)}</span>
                                    {batch.remainingPayable > 0 && <span className="text-[7px] font-black text-rose-500 uppercase flex items-center gap-1 mt-0.5"><Clock size={8} /> NỢ HẠN: {batch.dueDate ? formatDate(batch.dueDate) : 'Chưa đặt'}</span>}
                                  </div>
                                  <div className="text-right flex items-center gap-3">
                                    <div className="flex flex-col items-end">
                                      <p className="font-black text-indigo-600 text-[11px]">+{batch.quantity.toLocaleString()}</p>
                                      <p className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{formatCurrency(batch.costPerSim)}/SIM</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); if (confirm('Xóa?')) onDeleteBatch(batch.id); }} className="p-1.5 text-slate-300 hover:text-rose-600"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nhập Lô SIM Mới"
        icon={<Box className="text-blue-600" />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select required label="Loại SIM" value={formData.simTypeId} onChange={(e) => setFormData({ ...formData, simTypeId: e.target.value })}>
            <option value="">-- Chọn sản phẩm --</option>
            {simTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              required
              label="Số lượng"
              value={formData.quantity}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setFormData(prev => ({
                  ...prev,
                  quantity: val,
                  totalImportPrice: handlePriceCalc(val, prev.unitPrice)
                }));
              }}
            />
            <Input
              type="text"
              required
              label="Giá nhập / SIM"
              value={formatNumberWithCommas(formData.unitPrice)}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  unitPrice: val,
                  totalImportPrice: handlePriceCalc(prev.quantity, val)
                }));
              }}
            />
          </div>

          <Input
            type="text"
            required
            label="Tổng tiền nhập"
            value={formatNumberWithCommas(formData.totalImportPrice)}
            onChange={(e) => setFormData({ ...formData, totalImportPrice: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input type="date" required label="Ngày nhập" value={formData.importDate} onChange={(e) => setFormData({ ...formData, importDate: e.target.value })} />
            <Select label="Thanh toán" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
              <option value="TRANSFER">Chuyển khoản</option>
              <option value="CASH">Tiền mặt</option>
              <option value="CREDIT">Ghi nợ NCC</option>
            </Select>
          </div>

          {paymentMethod === 'CREDIT' && (
            <Input variant="danger" type="date" required label="Hạn trả nợ (*)" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
          )}

          <ModalActions onCancel={() => setIsModalOpen(false)} confirmColor="blue" />
        </form>
      </Modal>
    </div>
  );
};

export default SimInventory;
