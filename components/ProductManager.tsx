import React, { useState } from 'react';
import { SimType } from '../types';
import { generateId } from '../utils';
import { Plus, Trash2, Tags } from 'lucide-react';
import { Input } from './base';

interface Props {
  simTypes: SimType[];
  onAdd: (type: SimType) => void;
  onDelete: (id: string) => void;
}

const ProductManager: React.FC<Props> = ({ simTypes, onAdd, onDelete }) => {
  const [newTypeName, setNewTypeName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    const newType: SimType = {
      id: generateId(),
      name: newTypeName.trim(),
    };
    onAdd(newType);
    setNewTypeName('');
  };



  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Tags className="w-5 h-5 text-purple-600" />
          Danh mục Loại Sim (Sản phẩm)
        </h2>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
          <Input
            type="text"
            placeholder="Nhập tên loại sim mới (VD: SIM5G-90N, C90N...)"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            className="flex-1"
          />
          <button
            type="submit"
            disabled={!newTypeName.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </form>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Danh sách sản phẩm ({simTypes.length})</h3>
          {simTypes.length === 0 ? (
            <div className="text-gray-400 italic text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              Chưa có loại sim nào. Hãy thêm sản phẩm đầu tiên của bạn.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {simTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 group hover:border-purple-200 hover:shadow-sm transition-all">
                  <span className="font-semibold text-gray-700">{type.name}</span>
                  <button
                    onClick={() => onDelete(type.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManager;