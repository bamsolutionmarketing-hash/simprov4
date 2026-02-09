
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
  if (Array.isArray(obj)) return obj.map(toCamelCase);

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
            setData(prev => ({ ...prev, simTypes: [toCamelCase(payload.new), ...prev.simTypes] }));
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
            setData(prev => ({ ...prev, customers: [toCamelCase(payload.new), ...prev.customers] }));
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
            setData(prev => ({ ...prev, packages: [toCamelCase(payload.new), ...prev.packages] }));
          } else if (payload.eventType === 'DELETE') {
            setData(prev => ({ ...prev, packages: prev.packages.filter(p => p.id !== payload.old.id) }));
          }
        })
        .subscribe(),

      supabase.channel('orders_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sale_orders', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => ({ ...prev, orders: [toCamelCase(payload.new), ...prev.orders] }));
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
            setData(prev => ({ ...prev, transactions: [toCamelCase(payload.new), ...prev.transactions] }));
          } else if (payload.eventType === 'DELETE') {
            setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== payload.old.id) }));
          }
        })
        .subscribe(),

      supabase.channel('logs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'due_date_logs', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => ({ ...prev, dueDateLogs: [toCamelCase(payload.new), ...prev.dueDateLogs] }));
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
    if (!userId) return;

    try {
      // Delete all existing data
      await Promise.all([
        supabase.from('due_date_logs').delete().eq('user_id', userId),
        supabase.from('transactions').delete().eq('user_id', userId),
        supabase.from('sale_orders').delete().eq('user_id', userId),
        supabase.from('sim_packages').delete().eq('user_id', userId),
        supabase.from('customers').delete().eq('user_id', userId),
        supabase.from('sim_types').delete().eq('user_id', userId)
      ]);

      // Insert new data
      const insertPromises = [];

      if (newData.simTypes?.length) {
        insertPromises.push(
          supabase.from('sim_types').insert(
            newData.simTypes.map(t => ({ ...toSnakeCase(t), user_id: userId }))
          )
        );
      }

      if (newData.customers?.length) {
        insertPromises.push(
          supabase.from('customers').insert(
            newData.customers.map(c => ({ ...toSnakeCase(c), user_id: userId }))
          )
        );
      }

      if (newData.packages?.length) {
        insertPromises.push(
          supabase.from('sim_packages').insert(
            newData.packages.map(p => ({ ...toSnakeCase(p), user_id: userId }))
          )
        );
      }

      if (newData.orders?.length) {
        insertPromises.push(
          supabase.from('sale_orders').insert(
            newData.orders.map(o => ({ ...toSnakeCase(o), user_id: userId }))
          )
        );
      }

      if (newData.transactions?.length) {
        insertPromises.push(
          supabase.from('transactions').insert(
            newData.transactions.map(t => ({ ...toSnakeCase(t), user_id: userId }))
          )
        );
      }

      if (newData.dueDateLogs?.length) {
        insertPromises.push(
          supabase.from('due_date_logs').insert(
            newData.dueDateLogs.map(l => ({ ...toSnakeCase(l), user_id: userId }))
          )
        );
      }

      await Promise.all(insertPromises);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  }, [userId]);

  // --- PACKAGES ---
  const addPackage = useCallback(async (pkg: SimPackage) => {
    if (!userId) return;
    const { error } = await supabase.from('sim_packages').insert({ ...toSnakeCase(pkg), user_id: userId });
    if (error) console.error('Error adding package:', error);
  }, [userId]);

  const deletePackage = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from('sim_packages').delete().eq('id', id);
    if (error) console.error('Error deleting package:', error);
  }, [userId]);

  // --- ORDERS ---
  const addOrder = useCallback(async (order: SaleOrder) => {
    if (!userId) return;
    const { error } = await supabase.from('sale_orders').insert({ ...toSnakeCase(order), user_id: userId });
    if (error) console.error('Error adding order:', error);
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
    if (!userId) return;
    const { error } = await supabase.from('transactions').insert({ ...toSnakeCase(tx), user_id: userId });
    if (error) console.error('Error adding transaction:', error);
  }, [userId]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) console.error('Error deleting transaction:', error);
  }, [userId]);

  // --- SIM TYPES ---
  const addSimType = useCallback(async (type: SimType) => {
    if (!userId) return;
    const { error } = await supabase.from('sim_types').insert({ ...toSnakeCase(type), user_id: userId });
    if (error) console.error('Error adding sim type:', error);
  }, [userId]);

  const deleteSimType = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from('sim_types').delete().eq('id', id);
    if (error) console.error('Error deleting sim type:', error);
  }, [userId]);

  // --- CUSTOMERS ---
  const addCustomer = useCallback(async (customer: Customer) => {
    if (!userId) return;
    const { error } = await supabase.from('customers').insert({ ...toSnakeCase(customer), user_id: userId });
    if (error) console.error('Error adding customer:', error);
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
