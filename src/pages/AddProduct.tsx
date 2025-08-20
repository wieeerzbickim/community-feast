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
import { ArrowLeft, Package, Upload, X, Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'addProduct.nameRequired'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'addProduct.categoryRequired'),
  price: z.string().min(1, 'addProduct.priceRequired'),
  unit: z.string().min(1, 'addProduct.unitRequired'),
  stock_quantity: z.string().optional(),
  made_to_order: z.boolean().default(false),
  execution_time_hours: z.string().optional(),
  ingredients: z.string().optional(),
  allergens: z.string().optional(),
  storage_instructions: z.string().optional(),
  shelf_life_days: z.string().optional(),
  tags: z.string().optional(),
  is_available: z.boolean().default(true),
  featured: z.boolean().default(false),
}).refine((data) => {
  if (data.made_to_order) {
    return data.execution_time_hours && data.execution_time_hours.length > 0;
  } else {
    return data.stock_quantity && data.stock_quantity.length > 0;
  }
}, {
  message: 'addProduct.stockRequired',
  path: ['stock_quantity']
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      made_to_order: false,
    }
  });

  const watchedIsAvailable = watch('is_available');
  const watchedFeatured = watch('featured');
  const watchedMadeToOrder = watch('made_to_order');

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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('common.error'),
          description: 'Proszę wybrać plik graficzny',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('common.error'),
          description: 'Rozmiar pliku nie może przekraczać 5MB',
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: t('common.error'),
        description: t('addProduct.imageError'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          setLoading(false);
          return;
        }
      }

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
        stock_quantity: data.made_to_order ? 0 : parseInt(data.stock_quantity || '0'),
        made_to_order: data.made_to_order,
        execution_time_hours: data.made_to_order && data.execution_time_hours ? parseInt(data.execution_time_hours) : null,
        ingredients: data.ingredients || null,
        allergens: data.allergens || null,
        storage_instructions: data.storage_instructions || null,
        shelf_life_days: data.shelf_life_days ? parseInt(data.shelf_life_days) : null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        is_available: data.is_available,
        featured: data.featured,
        image_url: imageUrl,
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

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>{t('addProduct.image')}</Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={uploadingImage}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {imagePreview ? t('addProduct.changeImage') : t('addProduct.uploadImage')}
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maksymalny rozmiar: 5MB
                    </p>
                  </div>
                </div>
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

                {!watchedMadeToOrder ? (
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
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="execution_time_hours">{t('addProduct.executionTime')} *</Label>
                    <Input
                      id="execution_time_hours"
                      type="number"
                      {...register('execution_time_hours')}
                      placeholder={t('addProduct.executionTimePlaceholder')}
                    />
                    {errors.execution_time_hours && (
                      <p className="text-sm text-destructive">{t(errors.execution_time_hours.message || '')}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Made to Order Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="made_to_order">{t('addProduct.madeToOrder')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('addProduct.madeToOrderDesc')}
                  </p>
                </div>
                <Switch
                  id="made_to_order"
                  checked={watchedMadeToOrder}
                  onCheckedChange={(checked) => setValue('made_to_order', checked)}
                />
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
            <Button type="submit" disabled={loading || uploadingImage}>
              {loading ? t('common.loading') : 
               uploadingImage ? t('addProduct.uploadingImage') : 
               t('addProduct.createProduct')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;