import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import ReviewForm from '@/components/ReviewForm';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  producer_id: string;
  order_items: {
    id: string;
    product_id: string;
    quantity: number;
    price_per_unit: number;
    products: {
      id: string;
      name: string;
      image_url: string;
    };
  }[];
}

const OrderHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState<{
    orderId: string;
    productId: string;
    producerId: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            id,
            product_id,
            quantity,
            price_per_unit,
            products(id, name, image_url)
          )
        `)
        .eq('consumer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'confirmed':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const canReview = (order: Order) => {
    return order.status === 'completed';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading orders...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-8">Order History</h1>

        {showReviewForm && (
          <div className="mb-8">
            <ReviewForm
              orderId={showReviewForm.orderId}
              productId={showReviewForm.productId}
              producerId={showReviewForm.producerId}
              onReviewSubmitted={() => {
                setShowReviewForm(null);
                toast({
                  title: "Review submitted",
                  description: "Thank you for your feedback!",
                });
              }}
            />
          </div>
        )}

        <div className="space-y-6">
          {orders.length > 0 ? (
            orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(order.status) as any}>
                        {order.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                          {item.products.image_url ? (
                            <img
                              src={item.products.image_url}
                              alt={item.products.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.products.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × ${item.price_per_unit.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ${(item.quantity * Number(item.price_per_unit)).toFixed(2)}
                          </div>
                          {canReview(order) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowReviewForm({
                                orderId: order.id,
                                productId: item.product_id,
                                producerId: order.producer_id
                              })}
                              className="mt-2"
                            >
                              Write Review
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-lg font-semibold">
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground">
                Your order history will appear here when you make purchases.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;