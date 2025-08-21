import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Trash2, Plus, Minus, Package, MapPin } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price_per_unit: number;
  product: {
    name: string;
    image_url: string | null;
    unit: string;
    stock_quantity: number;
    is_available: boolean;
    made_to_order: boolean;
    user_profiles: {
      full_name: string;
    };
    producer_profiles?: {
      business_name: string;
    };
  };
}

const Cart = () => {
  const { user, isConsumer } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  useEffect(() => {
    if (user && isConsumer) {
      fetchCartItems();
    }
  }, [user, isConsumer]);

  const fetchCartItems = async () => {
    try {
      // For now, we'll use localStorage for cart items since we don't have a cart table
      const savedCart = localStorage.getItem(`cart_${user?.id}`);
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        
        // Fetch current product data for cart items
        const productIds = cartData.map((item: any) => item.product_id);
        if (productIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select(`
              *,
              user_profiles(full_name)
            `)
            .in('id', productIds);

          const enrichedCartItems = cartData.map((cartItem: any) => {
            const product = products?.find(p => p.id === cartItem.product_id);
            return {
              ...cartItem,
              product: product || null
            };
          }).filter((item: any) => item.product);

          setCartItems(enrichedCartItems);
        }
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedItems = cartItems.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    setCartItems(updatedItems);
    localStorage.setItem(`cart_${user?.id}`, JSON.stringify(updatedItems));
  };

  const removeFromCart = (productId: string) => {
    const updatedItems = cartItems.filter(item => item.product_id !== productId);
    setCartItems(updatedItems);
    localStorage.setItem(`cart_${user?.id}`, JSON.stringify(updatedItems));
    
    toast({
      title: "Success",
      description: "Item removed from cart",
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(`cart_${user?.id}`);
    toast({
      title: "Success",
      description: "Cart cleared",
    });
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price_per_unit * item.quantity), 0);
  };

  const getDeliveryFee = () => {
    return deliveryMethod === 'delivery' ? 15 : 0;
  };

  const getTotalPrice = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const warsawDeliveryLocations = [
    'Centrum',
    'Mokotów', 
    'Żoliborz',
    'Praga-Południe',
    'Praga-Północ',
    'Ochota',
    'Wola',
    'Ursynów'
  ];

  const proceedToCheckout = async () => {
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      toast({
        title: "Error",
        description: "Please provide a delivery address for Warsaw delivery.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Prepare cart items for payment
      const paymentItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit
      }));

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          cartItems: paymentItems,
          deliveryMethod,
          deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
          deliveryFee: getDeliveryFee()
        }
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to create payment session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">{t('common.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            {t('cart.title')}
          </h1>
          {cartItems.length > 0 && (
            <Button variant="outline" onClick={clearCart}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Browse our marketplace and add some delicious local products to your cart.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.product.image_url ? (
                          <img 
                            src={item.product.image_url} 
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          by {item.product.user_profiles?.full_name}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-bold text-primary">
                            {item.price_per_unit.toFixed(2)} PLN / {item.product.unit}
                          </span>
                          {!item.product.is_available && (
                            <Badge variant="destructive">Unavailable</Badge>
                          )}
                          {item.product.made_to_order && (
                            <Badge variant="outline">Made to Order</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                          disabled={!item.product.made_to_order && item.quantity >= item.product.stock_quantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {(item.price_per_unit * item.quantity).toFixed(2)} PLN
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Delivery Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup">Pickup (Free)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery">Warsaw Delivery (15 PLN)</Label>
                    </div>
                  </RadioGroup>

                  {deliveryMethod === 'delivery' && (
                    <div className="space-y-3">
                      <Label htmlFor="address">Delivery Address in Warsaw</Label>
                      <Input
                        id="address"
                        placeholder="Enter your address in Warsaw"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-2">Available delivery areas:</p>
                        <div className="grid grid-cols-2 gap-1">
                          {warsawDeliveryLocations.map(location => (
                            <span key={location} className="text-xs">• {location}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>{getSubtotal().toFixed(2)} PLN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery fee</span>
                    <span>{getDeliveryFee().toFixed(2)} PLN</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{getTotalPrice().toFixed(2)} PLN</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={proceedToCheckout}
                    disabled={cartItems.length === 0 || loading}
                  >
                    {loading ? 'Processing...' : 'Proceed to Checkout'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;