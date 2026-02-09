
import { useState, useEffect, useCallback } from 'react';
import { SimPackage, SaleOrder, Transaction, SimType, Customer, DueDateLog } from '../types';

const STORAGE_KEY = 'sim-manager-data-v2';

interface AppData {
  packages: SimPackage[];
  orders: SaleOrder[];
  transactions: Transaction[];
  simTypes: SimType[];
  customers: Customer[];
  dueDateLogs: DueDateLog[];
}

const initialData: AppData = {
  packages: [],
  orders: [],
  transactions: [],
  simTypes: [],
  customers: [],
  dueDateLogs: []
};

export const useAppStore = () => {
  const [data, setData] = useState<AppData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : initialData;
    // Đảm bảo luôn có đủ các mảng để tránh lỗi map/filter
    return {
      ...initialData,
      ...parsed
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // --- FULL DATA MANAGEMENT ---
  const importFullData = useCallback((newData: Partial<AppData>) => {
    setData({
      ...initialData,
      ...newData
    });
  }, []);

  // --- PACKAGES ---
  const addPackage = useCallback((pkg: SimPackage) => {
    setData(prev => ({ ...prev, packages: [pkg, ...prev.packages] }));
  }, []);

  const deletePackage = useCallback((id: string) => {
    setData(prev => ({ ...prev, packages: prev.packages.filter(p => p.id !== id) }));
  }, []);

  // --- ORDERS ---
  const addOrder = useCallback((order: SaleOrder) => {
    setData(prev => ({ ...prev, orders: [order, ...prev.orders] }));
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setData(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== id) }));
  }, []);

  const updateOrderDueDate = useCallback((orderId: string, newDate: string, log: DueDateLog) => {
    setData(prev => {
        const updatedOrders = prev.orders.map(o => {
            if (o.id === orderId) {
                return {
                    ...o,
                    dueDate: newDate,
                    dueDateChanges: (o.dueDateChanges || 0) + 1
                };
            }
            return o;
        });
        return {
            ...prev,
            orders: updatedOrders,
            dueDateLogs: [log, ...prev.dueDateLogs]
        };
    });
  }, []);

  // --- TRANSACTIONS ---
  const addTransaction = useCallback((tx: Transaction) => {
    setData(prev => ({ ...prev, transactions: [tx, ...prev.transactions] }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
      setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  }, []);

  // --- SIM TYPES ---
  const addSimType = useCallback((type: SimType) => {
    setData(prev => ({ ...prev, simTypes: [type, ...prev.simTypes] }));
  }, []);

  const deleteSimType = useCallback((id: string) => {
    setData(prev => ({ ...prev, simTypes: prev.simTypes.filter(t => t.id !== id) }));
  }, []);

  // --- CUSTOMERS ---
  const addCustomer = useCallback((customer: Customer) => {
      setData(prev => ({ ...prev, customers: [customer, ...prev.customers] }));
  }, []);
  
  const updateCustomer = useCallback((updated: Customer) => {
      setData(prev => ({ ...prev, customers: prev.customers.map(c => c.id === updated.id ? updated : c) }));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
      setData(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }));
  }, []);

  return {
    fullData: data,
    packages: data.packages,
    orders: data.orders,
    transactions: data.transactions,
    simTypes: data.simTypes,
    customers: data.customers,
    dueDateLogs: data.dueDateLogs,
    
    importFullData,
    addPackage, deletePackage,
    addOrder, deleteOrder, updateOrderDueDate,
    addTransaction, deleteTransaction,
    addSimType, deleteSimType,
    addCustomer, updateCustomer, deleteCustomer
  };
};
