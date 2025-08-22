import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PricingBreakdownProps {
  customerPrice: number;
  commissionRate: number;
}

const PricingBreakdown: React.FC<PricingBreakdownProps> = ({ customerPrice, commissionRate }) => {
  const { t } = useLanguage();
  const commissionAmount = customerPrice * (commissionRate / 100);
  const producerEarnings = customerPrice - commissionAmount;

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="h-4 w-4" />
          {t('pricing.breakdown')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{t('pricing.customerPrice')}</span>
            <span className="font-medium">{customerPrice.toFixed(2)} PLN</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t('pricing.platformCommission')} ({commissionRate}%):</span>
            <span>-{commissionAmount.toFixed(2)} PLN</span>
          </div>
          <div className="flex justify-between font-medium text-primary border-t pt-2">
            <span>{t('pricing.yourEarnings')}</span>
            <span>{producerEarnings.toFixed(2)} PLN</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingBreakdown;