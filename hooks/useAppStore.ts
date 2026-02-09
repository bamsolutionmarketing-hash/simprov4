
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
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

// Helper to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase).filter((i: any) => i);

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any);
};

// Helper to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {} as any);
};

export const useAppStore = () => {
  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Handle Auth Session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data when userId changes
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [simTypesRes, customersRes, packagesRes, ordersRes, transactionsRes, logsRes] = await Promise.all([
          supabase.from('sim_types').select('*').eq('user_id', userId),
          supabase.from('customers').select('*').eq('user_id', userId),
          supabase.from('sim_packages').select('*').eq('user_id', userId),
          supabase.from('sale_orders').select('*').eq('user_id', userId),
          supabase.from('transactions').select('*').eq('user_id', userId),
          supabase.from('due_date_logs').select('*').eq('user_id', userId)
        ]);

        setData({
          simTypes: toCamelCase(simTypesRes.data || []),
          customers: toCamelCase(customersRes.data || []),
          packages: toCamelCase(packagesRes.data || []),
          orders: toCamelCase(ordersRes.data || []),
          transactions: toCamelCase(transactionsRes.data || []),
          dueDateLogs: toCamelCase(logsRes.data || [])
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const channels = [
      supabase.channel('sim_types_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sim_types', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => {
              if (prev.simTypes.some(item => item.id === payload.new.id)) return prev;
              return { ...prev, simTypes: [toCamelCase(payload.new), ...prev.simTypes] };
            });
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => ({ ...prev, simTypes: prev.simTypes.map(t => t.id === payload.new.id ? toCamelCase(payload.new) : t) }));
          } else if (payload.eventType === 'DELETE') {
            setData(prev => ({ ...prev, simTypes: prev.simTypes.filter(t => t.id !== payload.old.id) }));
          }
        })
        .subscribe(),

      supabase.channel('customers_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => {
              if (prev.customers.some(item => item.id === payload.new.id)) return prev;
              return { ...prev, customers: [toCamelCase(payload.new), ...prev.customers] };
            });
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => ({ ...prev, customers: prev.customers.map(c => c.id === payload.new.id ? toCamelCase(payload.new) : c) }));
          } else if (payload.eventType === 'DELETE') {
            setData(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== payload.old.id) }));
          }
        })
        .subscribe(),

      supabase.channel('packages_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sim_packages', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => {
              if (prev.packages.some(item => item.id === payload.new.id)) return prev;
              return { ...prev, packages: [toCamelCase(payload.new), ...prev.packages] };
            });
          } else if (payload.eventType === 'DELETE') {
            setData(prev => ({ ...prev, packages: prev.packages.filter(p => p.id !== payload.old.id) }));
          }
        })
        .subscribe(),

      supabase.channel('orders_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sale_orders', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => {
              if (prev.orders.some(item => item.id === payload.new.id)) return prev;
              return { ...prev, orders: [toCamelCase(payload.new), ...prev.orders] };
            });
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => ({ ...prev, orders: prev.orders.map(o => o.id === payload.new.id ? toCamelCase(payload.new) : o) }));
          } else if (payload.eventType === 'DELETE') {
            setData(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== payload.old.id) }));
          }
        })
        .subscribe(),

      supabase.channel('transactions_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => {
              if (prev.transactions.some(item => item.id === payload.new.id)) return prev;
              return { ...prev, transactions: [toCamelCase(payload.new), ...prev.transactions] };
            });
          } else if (payload.eventType === 'DELETE') {
            setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== payload.old.id) }));
          }
        })
        .subscribe(),

      supabase.channel('logs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'due_date_logs', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => {
              if (prev.dueDateLogs.some(item => item.id === payload.new.id)) return prev;
              return { ...prev, dueDateLogs: [toCamelCase(payload.new), ...prev.dueDateLogs] };
            });
          }
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [userId]);

  // --- FULL DATA MANAGEMENT ---
  const importFullData = useCallback(async (newData: Partial<AppData>) => {
    if (!userId) {
      alert('Lỗi: Chưa đăng nhập (User ID missing). Vui lòng tải lại trang.');
      return;
    }

    try {
      // 1. Prepare ID Mapping (Old ID -> New UUID)
      const idMap = new Map<string, string>();
      const getNewId = (oldId: string) => {
        if (!oldId) return undefined;
        // If already UUID, keep it. If not, generate new one.
        // Simple UUID regex check
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(oldId)) {
          return oldId;
        }
        if (!idMap.has(oldId)) {
          // Generate new UUID
          // We can use crypto.randomUUID() if available or a polyfill
          let uuid = '';
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            uuid = crypto.randomUUID();
          } else {
            uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          }
          idMap.set(oldId, uuid);
        }
        return idMap.get(oldId);
      };

      // 2. Process and Map Data
      const simTypes = (newData.simTypes || []).map(t => ({
        ...t,
        id: getNewId(t.id)!
      }));

      const customers = (newData.customers || []).map(c => ({
        ...c,
        id: getNewId(c.id)!
      }));

      const packages = (newData.packages || []).map(p => ({
        ...p,
        id: getNewId(p.id)!,
        simTypeId: p.simTypeId ? getNewId(p.simTypeId) : undefined
      }));

      const orders = (newData.orders || []).map(o => ({
        ...o,
        id: getNewId(o.id)!,
        simTypeId: getNewId(o.simTypeId)!,
        customerId: o.customerId ? getNewId(o.customerId) : undefined,
        simPackageId: o.simPackageId ? getNewId(o.simPackageId) : undefined
      }));

      const transactions = (newData.transactions || []).map(t => ({
        ...t,
        id: getNewId(t.id)!,
        saleOrderId: t.saleOrderId ? getNewId(t.saleOrderId) : undefined,
        simPackageId: t.simPackageId ? getNewId(t.simPackageId) : undefined
      }));

      const logs = (newData.dueDateLogs || []).map(l => ({
        ...l,
        id: getNewId(l.id)!,
        orderId: l.orderId ? getNewId(l.orderId) : undefined
      }));

      // 3. Delete existing data (Clear before import)
      // Note: Delete in reverse order of dependencies
      await Promise.all([
        supabase.from('due_date_logs').delete().eq('user_id', userId),
        supabase.from('transactions').delete().eq('user_id', userId)
      ]);
      await supabase.from('sale_orders').delete().eq('user_id', userId);
      await supabase.from('sim_packages').delete().eq('user_id', userId);
      await Promise.all([
        supabase.from('customers').delete().eq('user_id', userId),
        supabase.from('sim_types').delete().eq('user_id', userId)
      ]);


      // 4. Insert new data (In order of dependencies)
      // Sim Types & Customers first
      if (simTypes.length) {
        const { error } = await supabase.from('sim_types').insert(simTypes.map(t => ({ ...toSnakeCase(t), user_id: userId })));
        if (error) console.error('Error importing sim_types:', error);
      }

      if (customers.length) {
        const { error } = await supabase.from('customers').insert(customers.map(c => ({ ...toSnakeCase(c), user_id: userId })));
        if (error) console.error('Error importing customers:', error);
      }

      // Packages
      if (packages.length) {
        const { error } = await supabase.from('sim_packages').insert(packages.map(p => ({ ...toSnakeCase(p), user_id: userId })));
        if (error) console.error('Error importing sim_packages:', error);
      }

      // Orders (depend on Customers, Types, Packages)
      if (orders.length) {
        const { error } = await supabase.from('sale_orders').insert(orders.map(o => ({ ...toSnakeCase(o), user_id: userId })));
        if (error) console.error('Error importing sale_orders:', error);
      }

      // Transactions & Logs (depend on Orders, Packages)
      if (transactions.length) {
        const { error } = await supabase.from('transactions').insert(transactions.map(t => ({ ...toSnakeCase(t), user_id: userId })));
        if (error) console.error('Error importing transactions:', error);
      }

      if (logs.length) {
        const { error } = await supabase.from('due_date_logs').insert(logs.map(l => ({ ...toSnakeCase(l), user_id: userId })));
        if (error) console.error('Error importing due_date_logs:', error);
      }

    } catch (error) {
      console.error('Error importing data:', error);
    }
  }, [userId]);

  // --- PACKAGES ---
  const addPackage = useCallback(async (pkg: SimPackage) => {
    if (!userId) { alert('Lỗi: Mất kết nối Auth (User ID null)'); return; }
    const { data: inserted, error } = await supabase.from('sim_packages').insert({ ...toSnakeCase(pkg), user_id: userId }).select();
    if (error) {
      console.error('Error adding package:', error);
      alert(`Lỗi thêm gói sim: ${error.message}`);
    } else if (inserted && inserted[0]) {
      setData(prev => {
        if (prev.packages.some(item => item.id === inserted[0].id)) return prev;
        return { ...prev, packages: [toCamelCase(inserted[0]), ...prev.packages] };
      });
    }
  }, [userId]);

  const deletePackage = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from('sim_packages').delete().eq('id', id);
    if (error) console.error('Error deleting package:', error);
  }, [userId]);

  // --- ORDERS ---
  const addOrder = useCallback(async (order: SaleOrder) => {
    if (!userId) { alert('Lỗi: Mất kết nối Auth (User ID null)'); return; }
    const { data: inserted, error } = await supabase.from('sale_orders').insert({ ...toSnakeCase(order), user_id: userId }).select();
    if (error) {
      console.error('Error adding order:', error);
      alert(`Lỗi thêm đơn hàng: ${error.message}`);
    } else if (inserted && inserted[0]) {
      setData(prev => {
        if (prev.orders.some(item => item.id === inserted[0].id)) return prev;
        return { ...prev, orders: [toCamelCase(inserted[0]), ...prev.orders] };
      });
    }
  }, [userId]);

  const deleteOrder = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from('sale_orders').delete().eq('id', id);
    if (error) console.error('Error deleting order:', error);
  }, [userId]);

  const updateOrderDueDate = useCallback(async (orderId: string, newDate: string, log: DueDateLog) => {
    if (!userId) return;

    // Update order
    const order = data.orders.find(o => o.id === orderId);
    if (order) {
      const { error: orderError } = await supabase.from('sale_orders').update({
        due_date: newDate,
        due_date_changes: (order.dueDateChanges || 0) + 1
      }).eq('id', orderId);

      if (orderError) console.error('Error updating order due date:', orderError);
    }

    // Add log
    const { error: logError } = await supabase.from('due_date_logs').insert({ ...toSnakeCase(log), user_id: userId });
    if (logError) console.error('Error adding due date log:', logError);
  }, [userId, data.orders]);

  // --- TRANSACTIONS ---
  const addTransaction = useCallback(async (tx: Transaction) => {
    if (!userId) { alert('Lỗi: Mất kết nối Auth (User ID null)'); return; }
    const { data: inserted, error } = await supabase.from('transactions').insert({ ...toSnakeCase(tx), user_id: userId }).select();
    if (error) {
      console.error('Error adding transaction:', error);
      alert(`Lỗi thêm giao dịch: ${error.message}`);
    } else if (inserted && inserted[0]) {
      setData(prev => {
        if (prev.transactions.some(item => item.id === inserted[0].id)) return prev;
        return { ...prev, transactions: [toCamelCase(inserted[0]), ...prev.transactions] };
      });
    }
  }, [userId]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) console.error('Error deleting transaction:', error);
  }, [userId]);

  // --- SIM TYPES ---
  const addSimType = useCallback(async (type: SimType) => {
    if (!userId) { alert('Lỗi: Mất kết nối Auth (User ID null)'); return; }
    const { data: inserted, error } = await supabase.from('sim_types').insert({ ...toSnakeCase(type), user_id: userId }).select();
    if (error) {
      console.error('Error adding sim type:', error);
      alert(`Lỗi thêm loại sim: ${error.message}`);
    } else if (inserted && inserted[0]) {
      setData(prev => {
        if (prev.simTypes.some(item => item.id === inserted[0].id)) return prev;
        return { ...prev, simTypes: [toCamelCase(inserted[0]), ...prev.simTypes] };
      });
    }
  }, [userId]);

  const deleteSimType = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from('sim_types').delete().eq('id', id);
    if (error) console.error('Error deleting sim type:', error);
  }, [userId]);

  // --- CUSTOMERS ---
  const addCustomer = useCallback(async (customer: Customer) => {
    if (!userId) { alert('Lỗi: Mất kết nối Auth (User ID null)'); return; }
    const { data: inserted, error } = await supabase.from('customers').insert({ ...toSnakeCase(customer), user_id: userId }).select();
    if (error) {
      console.error('Error adding customer:', error);
      alert(`Lỗi thêm khách hàng: ${error.message}`);
    } else if (inserted && inserted[0]) {
      setData(prev => {
        if (prev.customers.some(item => item.id === inserted[0].id)) return prev;
        return { ...prev, customers: [toCamelCase(inserted[0]), ...prev.customers] };
      });
    }
  }, [userId]);

  const updateCustomer = useCallback(async (updated: Customer) => {
    if (!userId) return;
    const { error } = await supabase.from('customers').update(toSnakeCase(updated)).eq('id', updated.id);
    if (error) console.error('Error updating customer:', error);
  }, [userId]);

  const deleteCustomer = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) console.error('Error deleting customer:', error);
  }, [userId]);

  return {
    fullData: data,
    packages: data.packages,
    orders: data.orders,
    transactions: data.transactions,
    simTypes: data.simTypes,
    customers: data.customers,
    dueDateLogs: data.dueDateLogs,
    loading,

    importFullData,
    addPackage, deletePackage,
    addOrder, deleteOrder, updateOrderDueDate,
    addTransaction, deleteTransaction,
    addSimType, deleteSimType,
    addCustomer, updateCustomer, deleteCustomer
  };
};
