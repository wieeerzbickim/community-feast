import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface PricingBreakdownProps {
  customerPrice: number;
  commissionRate: number;
}

const PricingBreakdown: React.FC<PricingBreakdownProps> = ({ customerPrice, commissionRate }) => {
  const commissionAmount = customerPrice * (commissionRate / 100);
  const producerEarnings = customerPrice - commissionAmount;

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="h-4 w-4" />
          Podział zarobków
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Cena dla klienta:</span>
            <span className="font-medium">{customerPrice.toFixed(2)} PLN</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Prowizja platformy ({commissionRate}%):</span>
            <span>-{commissionAmount.toFixed(2)} PLN</span>
          </div>
          <div className="flex justify-between font-medium text-primary border-t pt-2">
            <span>Twoje zarobki:</span>
            <span>{producerEarnings.toFixed(2)} PLN</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingBreakdown;