import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'addProduct.nameRequired'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'addProduct.categoryRequired'),
  price: z.string().min(1, 'addProduct.priceRequired'),
  unit: z.string().min(1, 'addProduct.unitRequired'),
  stock_quantity: z.string().min(1, 'addProduct.stockRequired'),
  ingredients: z.string().optional(),
  allergens: z.string().optional(),
  storage_instructions: z.string().optional(),
  shelf_life_days: z.string().optional(),
  tags: z.string().optional(),
  is_available: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

const AddProduct = () => {
  const { user, isProducer } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      is_available: true,
      featured: false,
    }
  });

  const watchedIsAvailable = watch('is_available');
  const watchedFeatured = watch('featured');

  useEffect(() => {
    if (!isProducer) {
      navigate('/');
      return;
    }
    fetchCategories();
  }, [isProducer, navigate]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const tagsArray = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const productData = {
        producer_id: user.id,
        name: data.name,
        description: data.description || null,
        category_id: data.category_id,
        price: parseFloat(data.price),
        unit: data.unit,
        stock_quantity: parseInt(data.stock_quantity),
        ingredients: data.ingredients || null,
        allergens: data.allergens || null,
        storage_instructions: data.storage_instructions || null,
        shelf_life_days: data.shelf_life_days ? parseInt(data.shelf_life_days) : null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        is_available: data.is_available,
        featured: data.featured,
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('addProduct.success'),
      });

      navigate('/producer-dashboard');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('addProduct.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isProducer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/producer-dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{t('addProduct.title')}</h1>
            <p className="text-muted-foreground">{t('addProduct.description')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('addProduct.productDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('addProduct.name')} *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder={t('addProduct.namePlaceholder')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{t(errors.name.message || '')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">{t('addProduct.category')} *</Label>
                  <Select onValueChange={(value) => setValue('category_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('addProduct.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-sm text-destructive">{t(errors.category_id.message || '')}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('addProduct.productDescription')}</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder={t('addProduct.descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">{t('addProduct.price')} (PLN) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price')}
                    placeholder={t('addProduct.pricePlaceholder')}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{t(errors.price.message || '')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">{t('addProduct.unit')} *</Label>
                  <Input
                    id="unit"
                    {...register('unit')}
                    placeholder={t('addProduct.unitPlaceholder')}
                  />
                  {errors.unit && (
                    <p className="text-sm text-destructive">{t(errors.unit.message || '')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">{t('addProduct.stockQuantity')} *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    {...register('stock_quantity')}
                    placeholder={t('addProduct.stockPlaceholder')}
                  />
                  {errors.stock_quantity && (
                    <p className="text-sm text-destructive">{t(errors.stock_quantity.message || '')}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('addProduct.additionalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ingredients">{t('addProduct.ingredients')}</Label>
                <Textarea
                  id="ingredients"
                  {...register('ingredients')}
                  placeholder={t('addProduct.ingredientsPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="allergens">{t('addProduct.allergens')}</Label>
                  <Input
                    id="allergens"
                    {...register('allergens')}
                    placeholder={t('addProduct.allergensPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shelf_life_days">{t('addProduct.shelfLifeDays')}</Label>
                  <Input
                    id="shelf_life_days"
                    type="number"
                    {...register('shelf_life_days')}
                    placeholder={t('addProduct.shelfLifePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage_instructions">{t('addProduct.storageInstructions')}</Label>
                <Textarea
                  id="storage_instructions"
                  {...register('storage_instructions')}
                  placeholder={t('addProduct.storageInstructionsPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">{t('addProduct.tags')}</Label>
                <Input
                  id="tags"
                  {...register('tags')}
                  placeholder={t('addProduct.tagsPlaceholder')}
                />
                <p className="text-sm text-muted-foreground">
                  Oddziel tagi przecinkami
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('addProduct.settings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="is_available">{t('addProduct.isAvailable')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Produkt będzie widoczny dla klientów
                  </p>
                </div>
                <Switch
                  id="is_available"
                  checked={watchedIsAvailable}
                  onCheckedChange={(checked) => setValue('is_available', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="featured">{t('addProduct.featured')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Produkt będzie wyróżniony na stronie głównej
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={watchedFeatured}
                  onCheckedChange={(checked) => setValue('featured', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/producer-dashboard')}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : t('addProduct.createProduct')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;