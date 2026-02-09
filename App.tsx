
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useAppStore } from './hooks/useAppStore';
import { InventoryProductStat, SaleOrderWithStats, CustomerWithStats, Transaction, SimPackage, SimPackageWithStats } from './types';
import SimInventory from './components/SimInventory';
import SalesList from './components/SalesList';
import CashFlow from './components/CashFlow';
import ControlCenter from './components/ControlCenter';
import ProductManager from './components/ProductManager';
import CustomerCRM from './components/CustomerCRM';
import Reports from './components/Reports';
import DataManager from './components/DataManager';
import { Auth } from './components/Auth';
import { DataMigration } from './components/DataMigration';
import { ShieldCheck, Package, ShoppingCart, Wallet, Tags, Users, Database, Cpu, Menu, X, LogOut } from 'lucide-react';
import { generateCode, generateId } from './utils';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<'CONTROL_CENTER' | 'PRODUCTS' | 'INVENTORY' | 'SALES' | 'CASHFLOW' | 'CUSTOMERS' | 'FINANCE' | 'DATA'>('CONTROL_CENTER');
  const [reportSubTab, setReportSubTab] = useState<'CALENDAR' | 'DEBT'>('CALENDAR');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };



  const inventoryStats: InventoryProductStat[] = useMemo(() => {
    return store.simTypes.map(type => {
      const rawBatches = store.packages.filter(p => p.simTypeId === type.id);
      const batches: SimPackageWithStats[] = rawBatches.map(pkg => {
        const sold = store.orders.filter(o => o.simPackageId === pkg.id).reduce((s, o) => s + o.quantity, 0);
        const paidToSupplier = store.transactions
          .filter(t => t.simPackageId === pkg.id && t.type === 'OUT')
          .reduce((s, t) => s + t.amount, 0);

        return {
          ...pkg,
          sold,
          stock: pkg.quantity - sold,
          costPerSim: pkg.quantity > 0 ? pkg.totalImportPrice / pkg.quantity : 0,
          status: (pkg.quantity - sold) < 10 ? 'LOW_STOCK' : 'OK',
          paidAmount: paidToSupplier,
          remainingPayable: Math.max(0, pkg.totalImportPrice - paidToSupplier)
        };
      });

      const importedQty = batches.reduce((s, p) => s + p.quantity, 0);
      const totalCost = batches.reduce((s, p) => s + p.totalImportPrice, 0);
      const avgCost = importedQty > 0 ? totalCost / importedQty : 0;
      const sold = store.orders.filter(o => o.simTypeId === type.id).reduce((s, o) => s + o.quantity, 0);
      const remainingPayable = batches.reduce((s, p) => s + p.remainingPayable, 0);

      return {
        simTypeId: type.id,
        name: type.name,
        totalImported: importedQty,
        totalSold: sold,
        currentStock: importedQty - sold,
        weightedAvgCost: avgCost,
        status: (importedQty - sold) <= 50 ? 'LOW_STOCK' : 'OK',
        totalPayable: totalCost,
        totalRemainingPayable: remainingPayable,
        batches
      };
    });
  }, [store.simTypes, store.packages, store.orders, store.transactions]);

  const orderStats: SaleOrderWithStats[] = useMemo(() => {
    return store.orders.map(order => {
      const stats = inventoryStats.find(s => s.simTypeId === order.simTypeId);
      const totalAmount = order.quantity * order.salePrice;
      const costPerUnit = stats?.weightedAvgCost || 0;
      const totalCost = order.quantity * costPerUnit;
      const profit = totalAmount - totalCost;
      const paid = store.transactions.filter(t => t.saleOrderId === order.id && t.type === 'IN').reduce((s, t) => s + t.amount, 0);
      const remaining = Math.max(0, totalAmount - paid);
      const customer = store.customers.find(c => c.id === order.customerId);

      let debtLevel: 'NORMAL' | 'WARNING' | 'OVERDUE' | 'RECOVERY' = 'NORMAL';
      if (remaining > 0) {
        const today = new Date();
        const due = order.dueDate ? new Date(order.dueDate) : today;
        const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 3600 * 24));
        if ((order.dueDateChanges || 0) >= 3 || diffDays > 30) debtLevel = 'RECOVERY';
        else if (diffDays > 0) debtLevel = 'OVERDUE';
        else if (diffDays > -3) debtLevel = 'WARNING';
      }

      return {
        ...order,
        productName: stats?.name || 'Chưa rõ',
        customerName: customer?.name || order.agentName,
        totalAmount, cost: totalCost, profit, paidAmount: paid, remaining,
        isOverdue: debtLevel === 'OVERDUE' || debtLevel === 'RECOVERY',
        status: remaining <= 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID'),
        debtLevel, isBadDebt: debtLevel === 'RECOVERY'
      };
    });
  }, [store.orders, inventoryStats, store.transactions, store.customers]);

  const customerStats: CustomerWithStats[] = useMemo(() => {
    return store.customers.map(c => {
      const cOrders = orderStats.filter(o => o.customerId === c.id);
      const levelRank: Record<string, number> = { 'NORMAL': 0, 'WARNING': 1, 'OVERDUE': 2, 'RECOVERY': 3 };
      const worstLevel = cOrders.reduce((w, o) => levelRank[o.debtLevel] > levelRank[w] ? o.debtLevel : w, 'NORMAL' as any);
      let score: 'A' | 'B' | 'C' | 'D' = 'A';
      if (worstLevel === 'RECOVERY') score = 'D';
      else if (worstLevel === 'OVERDUE') score = 'C';
      else if (worstLevel === 'WARNING') score = 'B';
      else if (cOrders.length > 5 && cOrders.every(o => o.status === 'PAID')) score = 'A';
      else score = 'B';

      return {
        ...c,
        gmv: cOrders.reduce((s, o) => s + o.totalAmount, 0),
        currentDebt: cOrders.reduce((s, o) => s + o.remaining, 0),
        nextDueDate: cOrders.filter(o => o.remaining > 0 && o.dueDate).map(o => o.dueDate).sort()[0] || null,
        worstDebtLevel: worstLevel,
        creditScore: score
      };
    });
  }, [store.customers, orderStats]);

  if (!session) {
    return <Auth />;
  }

  if (store.loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const handleAddInventory = (pkg: SimPackage, method: 'TRANSFER' | 'CASH' | 'CREDIT') => {
    store.addPackage(pkg);
    if (method !== 'CREDIT') {
      store.addTransaction({
        id: generateId(), code: generateCode('TX'), type: 'OUT', date: pkg.importDate,
        amount: pkg.totalImportPrice, category: 'Chi nhập SIM', method: method,
        simPackageId: pkg.id, note: `Tự động chi lô ${pkg.code}`
      });
    }
  };

  const menu = [
    { id: 'CONTROL_CENTER', icon: ShieldCheck, label: 'Đ.Khiển' },
    { id: 'FINANCE', icon: Database, label: 'Sổ Sách' },
    { id: 'SALES', icon: ShoppingCart, label: 'Bán Hàng' },
    { id: 'CASHFLOW', icon: Wallet, label: 'Sổ Quỹ' },
    { id: 'INVENTORY', icon: Package, label: 'Kho Sim' },
    { id: 'CUSTOMERS', icon: Users, label: 'Đối Tác' },
    { id: 'PRODUCTS', icon: Tags, label: 'Sản Phẩm' },
    { id: 'DATA', icon: Database, label: 'Hệ Thống' }
  ];

  const handleTabChange = (id: any) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false); // Thu gọn menu sau khi chọn
  };

  return (
    <>
      <DataMigration />
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased font-['Inter']">
        {/* Header cho Mobile */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-[60] shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Cpu className="text-white w-5 h-5" />
            </div>
            <h1 className="text-sm font-black uppercase tracking-tighter">SIM<span className="text-indigo-600">Pro</span></h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 bg-slate-100 rounded-lg transition-all active:scale-95">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation (Sidebar Desktop & Mobile Overlay) */}
        <nav className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-[55] transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
          <div className="hidden md:flex items-center gap-3 p-6 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase">SIM<span className="text-indigo-600">Wholesale</span></h1>
          </div>
          <div className="p-4 flex flex-col gap-1 overflow-y-auto h-[calc(100vh-80px)] md:h-auto no-scrollbar pt-20 md:pt-4">
            {menu.map(item => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 font-bold' : 'text-slate-500 hover:bg-slate-50 font-semibold'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-black"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest">Đăng xuất</span>
            </button>
          </div>
        </nav>

        {/* Overlay cho Mobile khi mở menu */}
        {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

        <main className="flex-1 md:ml-64 p-3 md:p-8">
          <div className="max-w-7xl mx-auto pb-10">
            {activeTab === 'CONTROL_CENTER' && (
              <ControlCenter inventory={inventoryStats} orders={orderStats} transactions={store.transactions} customers={customerStats}
                onNavigateToCalendar={() => { handleTabChange('FINANCE'); setReportSubTab('CALENDAR'); }}
                onNavigateToDebt={() => { handleTabChange('FINANCE'); setReportSubTab('DEBT'); }}
              />
            )}
            {activeTab === 'FINANCE' && <Reports transactions={store.transactions} orders={orderStats} inventoryStats={inventoryStats} onUpdateDueDate={store.updateOrderDueDate} initialTab={reportSubTab} />}
            {activeTab === 'SALES' && <SalesList orders={store.orders} inventoryStats={inventoryStats} customers={store.customers} getOrderStats={(o) => orderStats.find(os => os.id === o.id) || ({} as any)} onAdd={store.addOrder} onAddTransaction={store.addTransaction} onDelete={store.deleteOrder} onUpdateDueDate={store.updateOrderDueDate} />}
            {activeTab === 'CASHFLOW' && <CashFlow transactions={store.transactions} orders={orderStats} packages={store.packages} onAdd={store.addTransaction} onDelete={store.deleteTransaction} />}
            {activeTab === 'INVENTORY' && <SimInventory inventoryStats={inventoryStats} simTypes={store.simTypes} onAdd={handleAddInventory} onDeleteBatch={store.deletePackage} onNavigateToProducts={() => handleTabChange('PRODUCTS')} />}
            {activeTab === 'CUSTOMERS' && <CustomerCRM customers={customerStats} onAdd={store.addCustomer} onUpdate={store.updateCustomer} onDelete={store.deleteCustomer} />}
            {activeTab === 'PRODUCTS' && <ProductManager simTypes={store.simTypes} onAdd={store.addSimType} onDelete={store.deleteSimType} />}
            {activeTab === 'DATA' && <DataManager fullData={store.fullData} onImport={store.importFullData} />}
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
