import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId && user) {
      // Clear cart after successful payment
      localStorage.removeItem(`cart_${user.id}`);
      setLoading(false);
    }
  }, [sessionId, user]);

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/orders');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-6">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-600 mb-2">
                Payment Successful!
              </CardTitle>
              <p className="text-muted-foreground">
                Thank you for your purchase. Your order has been confirmed.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="font-medium">What happens next?</span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• You will receive an email confirmation shortly</p>
                  <p>• The producer will be notified about your order</p>
                  <p>• You'll get updates on order preparation and pickup/delivery</p>
                  <p>• Check your order history for detailed information</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={handleViewOrders}
                  className="flex-1"
                >
                  View My Orders
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleContinueShopping}
                  className="flex-1"
                >
                  Continue Shopping
                </Button>
              </div>
              
              {sessionId && (
                <p className="text-xs text-muted-foreground">
                  Order ID: {sessionId}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;