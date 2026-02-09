
import React, { useRef } from 'react';
import { SimType, SimPackage, SaleOrder, Transaction, Customer, DueDateLog } from '../types';
import { Download, Upload, Database, FileJson, Info, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateId } from '../utils';

interface Props {
  fullData: {
    simTypes: SimType[];
    packages: SimPackage[];
    orders: SaleOrder[];
    transactions: Transaction[];
    customers: Customer[];
    dueDateLogs: DueDateLog[];
  };
  onImport: (data: any) => void;
}

const DataManager: React.FC<Props> = ({ fullData, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportSheet = (wb: XLSX.WorkBook, data: any[], sheetName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  const handleExportAll = () => {
    try {
      const wb = XLSX.utils.book_new();
      exportSheet(wb, fullData.simTypes || [], "SimTypes");
      exportSheet(wb, fullData.packages || [], "Inventory");
      exportSheet(wb, fullData.orders || [], "Orders");
      exportSheet(wb, fullData.transactions || [], "Transactions");
      exportSheet(wb, fullData.customers || [], "Customers");
      exportSheet(wb, fullData.dueDateLogs || [], "HistoryLogs");

      const fileName = `SIM_PRO_BACKUP_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Export error:", error);
      alert("Lỗi khi xuất dữ liệu: " + (error as Error).message);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        
        // Hàm tìm Sheet linh hoạt theo tên
        const getSheetData = (possibleNames: string[]) => {
            const foundName = wb.SheetNames.find(name => 
                possibleNames.some(p => name.toLowerCase().includes(p.toLowerCase()))
            );
            if (!foundName) return [];
            return XLSX.utils.sheet_to_json(wb.Sheets[foundName]);
        };

        // Hàm lấy giá trị từ một object với nhiều key dự phòng
        const val = (obj: any, keys: string[], defaultValue: any = '') => {
            for (const key of keys) {
                if (obj[key] !== undefined && obj[key] !== null) return obj[key];
                // Thử cả lowercase
                const lowerKey = key.toLowerCase();
                if (obj[lowerKey] !== undefined) return obj[lowerKey];
            }
            return defaultValue;
        };

        const newData = {
          simTypes: getSheetData(["SimTypes", "LoaiSim", "Sản phẩm"]).map((t: any) => ({
              id: String(val(t, ['id', 'ID', 'id_loai'], generateId())),
              name: String(val(t, ['name', 'Name', 'tên', 'Tên Loại'], 'Không tên'))
          })),

          packages: getSheetData(["Inventory", "Packages", "Kho", "Nhập hàng"]).map((p: any) => ({
              id: String(val(p, ['id', 'ID'], generateId())),
              code: String(val(p, ['code', 'Code', 'Mã Lô'], 'BATCH-' + generateId())),
              name: String(val(p, ['name', 'Name', 'Tên sản phẩm'], '')),
              simTypeId: String(val(p, ['simTypeId', 'SimTypeID', 'loai_id'], '')),
              quantity: Number(val(p, ['quantity', 'Quantity', 'số lượng', 'SL'], 0)),
              totalImportPrice: Number(val(p, ['totalImportPrice', 'TotalImportPrice', 'tổng tiền', 'Giá nhập'], 0)),
              importDate: String(val(p, ['importDate', 'ImportDate', 'ngày nhập'], new Date().toISOString().split('T')[0]))
          })),

          orders: getSheetData(["Orders", "SaleOrders", "Đơn hàng", "Bán hàng"]).map((o: any) => ({
              id: String(val(o, ['id', 'ID'], generateId())),
              code: String(val(o, ['code', 'Code', 'Mã đơn'], 'SO-' + generateId())),
              date: String(val(o, ['date', 'Date', 'ngày bán'], new Date().toISOString().split('T')[0])),
              customerId: o.customerId ? String(o.customerId) : undefined,
              agentName: String(val(o, ['agentName', 'AgentName', 'Khách hàng', 'tên khách'], 'Khách lẻ')),
              saleType: (String(val(o, ['saleType', 'SaleType'], 'RETAIL')).toUpperCase() === 'WHOLESALE' ? 'WHOLESALE' : 'RETAIL') as any,
              simTypeId: String(val(o, ['simTypeId', 'SimTypeID', 'Sản phẩm ID'], '')),
              quantity: Number(val(o, ['quantity', 'Quantity', 'SL'], 1)),
              salePrice: Number(val(o, ['salePrice', 'SalePrice', 'Giá bán'], 0)),
              dueDate: String(val(o, ['dueDate', 'DueDate', 'Hạn trả'], '')),
              dueDateChanges: Number(val(o, ['dueDateChanges', 'Số lần gia hạn'], 0)),
              note: String(val(o, ['note', 'Ghi chú'], '')),
              isFinished: val(o, ['isFinished', 'Đã thanh toán', 'Trạng thái'], false) === true || val(o, ['isFinished'], '') === 'true' || val(o, ['isFinished'], 0) === 1
          })),

          transactions: getSheetData(["Transactions", "CashFlow", "Sổ quỹ", "Giao dịch"]).map((t: any) => ({
              id: String(val(t, ['id', 'ID'], generateId())),
              code: String(val(t, ['code', 'Code', 'Mã GD'], 'TX-' + generateId())),
              date: String(val(t, ['date', 'Date', 'Ngày'], new Date().toISOString().split('T')[0])),
              type: (String(val(t, ['type', 'Type'], 'IN')).toUpperCase() === 'OUT' ? 'OUT' : 'IN') as any,
              category: String(val(t, ['category', 'Category', 'Danh mục'], '')),
              amount: Number(val(t, ['amount', 'Amount', 'Số tiền'], 0)),
              method: (String(val(t, ['method', 'Method'], 'TRANSFER')).toUpperCase() || 'TRANSFER') as any,
              saleOrderId: t.saleOrderId ? String(t.saleOrderId) : undefined,
              note: String(val(t, ['note', 'Ghi chú'], ''))
          })),

          customers: getSheetData(["Customers", "CRM", "Khách hàng", "Đại lý"]).map((c: any) => ({
              id: String(val(c, ['id', 'ID'], generateId())),
              cid: String(val(c, ['cid', 'CID', 'Mã KH'], 'KH-' + generateId())),
              name: String(val(c, ['name', 'Name', 'Họ tên'], 'Khách chưa tên')),
              phone: String(val(c, ['phone', 'Phone', 'SĐT'], '')),
              email: String(val(c, ['email', 'Email'], '')),
              address: String(val(c, ['address', 'Địa chỉ'], '')),
              type: (String(val(c, ['type', 'Type'], 'RETAIL')).toUpperCase() === 'WHOLESALE' ? 'WHOLESALE' : 'RETAIL') as any,
              note: String(val(c, ['note', 'Ghi chú'], ''))
          })),

          dueDateLogs: getSheetData(["HistoryLogs", "Logs", "Lịch sử gia hạn"]).map((l: any) => ({
              id: String(val(l, ['id', 'ID'], generateId())),
              orderId: String(val(l, ['orderId', 'Mã đơn'], '')),
              oldDate: String(val(l, ['oldDate', 'Hạn cũ'], '')),
              newDate: String(val(l, ['newDate', 'Hạn mới'], '')),
              reason: String(val(l, ['reason', 'Lý do'], '')),
              updatedAt: String(val(l, ['updatedAt', 'Ngày tạo'], ''))
          })),
        };

        const hasAnyData = newData.simTypes.length > 0 || newData.orders.length > 0 || newData.customers.length > 0;

        if (!hasAnyData) {
            throw new Error("Không tìm thấy dữ liệu hợp lệ trong file Excel này. Vui lòng kiểm tra tên Sheet.");
        }

        const statsMsg = [
            `Tìm thấy:`,
            `- ${newData.simTypes.length} Loại sản phẩm`,
            `- ${newData.packages.length} Lô hàng trong kho`,
            `- ${newData.customers.length} Khách hàng`,
            `- ${newData.orders.length} Đơn bán hàng`,
            `- ${newData.transactions.length} Giao dịch sổ quỹ`,
            `\nBạn có muốn khôi phục và GHI ĐÈ dữ liệu hiện tại không?`
        ].join('\n');

        if (confirm(statsMsg)) {
            onImport(newData);
            alert("✅ Khôi phục dữ liệu thành công! Ứng dụng sẽ cập nhật ngay.");
        }
        
      } catch (err) {
        console.error("Import error:", err);
        alert("❌ Lỗi Import: " + (err as Error).message + "\n\nLời khuyên: Hãy xuất file backup từ phiên bản này để xem định dạng chuẩn nhất.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Database className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">Hệ Thống & Dữ Liệu</h2>
                <p className="text-sm text-gray-500">Nâng cấp cơ chế khôi phục từ file cũ</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Download className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Sao lưu (Export)</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Tải về file Excel chứa toàn bộ dữ liệu. File này có định dạng chuẩn nhất để import sau này.
                </p>
                <button 
                    onClick={handleExportAll}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                    <FileSpreadsheet className="w-4 h-4" /> Xuất File Backup Mới .xlsx
                </button>
            </div>

            <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Upload className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Khôi phục (Import)</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Hỗ trợ đọc file từ các phiên bản cũ. Hệ thống sẽ tự động tìm kiếm và ánh xạ dữ liệu phù hợp.
                </p>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xlsx,.xls" 
                    onChange={handleFileChange} 
                />
                <button 
                    onClick={handleImportClick}
                    className="w-full py-3 bg-white border-2 border-amber-500 text-amber-600 rounded-lg font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                >
                    <Upload className="w-4 h-4" /> Chọn File Backup Cũ
                </button>
            </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-4">
            <Info className="w-6 h-6 text-blue-600 shrink-0" />
            <div className="text-xs text-blue-800 leading-relaxed">
                <p className="font-bold mb-1">Cải tiến mới:</p>
                Cơ chế import hiện tại đã thông minh hơn, có khả năng nhận diện các cột dữ liệu tiếng Việt (như "Số lượng", "Giá bán", "Khách hàng") và các Sheet khác nhau. Tuy nhiên, nếu dữ liệu quá lệch chuẩn, hệ thống sẽ bỏ qua dòng đó để tránh làm hỏng cấu trúc ứng dụng.
            </div>
        </div>
      </div>
    </div>
  );
};

export default DataManager;
