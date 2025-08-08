import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Edit,
  Trash2,
  Eye,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  featured: boolean;
  created_at: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  consumer_id: string;
  user_profiles: {
    full_name: string;
    email: string;
  };
  order_items: {
    quantity: number;
    price_per_unit: number;
    products: {
      name: string;
    };
  }[];
}

const ProducerDashboard = () => {
  const { user, userProfile, isProducer } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [producerProfile, setProducerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    if (!isProducer) {
      navigate('/');
      return;
    }
    
    fetchDashboardData();
  }, [user, isProducer]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch producer profile
      const { data: profile } = await supabase
        .from('producer_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProducerProfile(profile);

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });
      
      setProducts(productsData || []);

      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          user_profiles!orders_consumer_id_fkey(full_name, email),
          order_items(
            quantity,
            price_per_unit,
            products(name)
          )
        `)
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });
      
      setOrders(ordersData || []);

      // Calculate stats
      const totalProducts = productsData?.length || 0;
      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const pendingOrders = ordersData?.filter(order => order.status === 'pending').length || 0;

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Order updated",
        description: `Order status changed to ${status}`,
      });
      fetchDashboardData();
    }
  };

  const toggleProductAvailability = async (productId: string, isAvailable: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !isAvailable })
      .eq('id', productId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update product availability",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Product updated",
        description: `Product ${!isAvailable ? 'enabled' : 'disabled'}`,
      });
      fetchDashboardData();
    }
  };

  if (!isProducer) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Producer Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {producerProfile?.business_name || userProfile?.full_name}
            </p>
          </div>
          <Button onClick={() => navigate('/producer/add-product')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Your Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>${product.price.toFixed(2)}</span>
                          <span>{product.stock_quantity} in stock</span>
                          <Badge variant={product.is_available ? "default" : "secondary"}>
                            {product.is_available ? "Available" : "Unavailable"}
                          </Badge>
                          {product.featured && (
                            <Badge variant="outline">Featured</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleProductAvailability(product.id, product.is_available)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {products.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first product to start selling
                      </p>
                      <Button onClick={() => navigate('/producer/add-product')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold">Order #{order.id.slice(0, 8)}</span>
                          <Badge variant={
                            order.status === 'pending' ? 'default' :
                            order.status === 'confirmed' ? 'secondary' :
                            order.status === 'completed' ? 'default' : 'destructive'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                        <span className="font-bold">${Number(order.total_amount).toFixed(2)}</span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        Customer: {order.user_profiles?.full_name} ({order.user_profiles?.email})
                      </div>
                      
                      <div className="text-sm mb-3">
                        <strong>Items:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {order.order_items?.map((item, index) => (
                            <li key={index}>
                              {item.quantity}x {item.products?.name} @ ${Number(item.price_per_unit).toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {order.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          >
                            Accept Order
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          >
                            Decline Order
                          </Button>
                        </div>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <Button 
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                        >
                          Mark as Completed
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {orders.length === 0 && (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                      <p className="text-muted-foreground">
                        Orders will appear here when customers start purchasing your products
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Profile management features coming soon. You can update your business information,
                    delivery settings, and store preferences here.
                  </p>
                  
                  {producerProfile && (
                    <div className="space-y-2">
                      <p><strong>Business Name:</strong> {producerProfile.business_name}</p>
                      <p><strong>Store Status:</strong> {producerProfile.store_status}</p>
                      <p><strong>Delivery Available:</strong> {producerProfile.delivery_available ? 'Yes' : 'No'}</p>
                      {producerProfile.delivery_available && (
                        <p><strong>Delivery Fee:</strong> ${producerProfile.delivery_fee}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProducerDashboard;