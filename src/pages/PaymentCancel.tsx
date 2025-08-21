import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();

  const handleBackToCart = () => {
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-6">
                <XCircle className="h-16 w-16 text-orange-500" />
              </div>
              <CardTitle className="text-2xl text-orange-600 mb-2">
                Payment Cancelled
              </CardTitle>
              <p className="text-muted-foreground">
                Your payment was cancelled. No charges were made to your account.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <span className="font-medium">Your cart is still saved</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Don't worry! All items are still in your cart and ready for checkout when you're ready.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={handleBackToCart}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Cart
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleContinueShopping}
                  className="flex-1"
                >
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;