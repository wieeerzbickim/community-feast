import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdmin = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const promoteUserToAdmin = useCallback(async (userEmail: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('promote_user_to_admin', {
        user_email: userEmail
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${userEmail} has been promoted to admin`,
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getAdminSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*');

      if (error) throw error;

      // Convert to object for easier access
      const settings = data.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      return { success: true, data: settings };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch admin settings",
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [toast]);

  const updateAdminSetting = useCallback(async (key: string, value: string | number) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key,
          value: value.toString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update ${key}`,
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [toast]);

  const getPlatformStats = useCallback(async () => {
    try {
      const [usersResult, producersResult, ordersResult, productsResult] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact' }),
        supabase.from('producer_profiles').select('id', { count: 'exact' }),
        supabase.from('orders').select('id, total_amount, status', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' })
      ]);

      const totalRevenue = ordersResult.data
        ?.filter((order: any) => order.status === 'completed')
        ?.reduce((sum: number, order: any) => {
          const amount = typeof order.total_amount === 'string' 
            ? parseFloat(order.total_amount) 
            : order.total_amount;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0) || 0;

      const pendingOrders = ordersResult.data
        ?.filter(order => order.status === 'pending').length || 0;

      return {
        success: true,
        data: {
          totalUsers: usersResult.count || 0,
          totalProducers: producersResult.count || 0,
          totalOrders: ordersResult.count || 0,
          totalProducts: productsResult.count || 0,
          totalRevenue,
          pendingOrders
        }
      };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch platform statistics",
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [toast]);

  return {
    loading,
    promoteUserToAdmin,
    getAdminSettings,
    updateAdminSetting,
    getPlatformStats
  };
};