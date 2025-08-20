import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isProducer } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
    ingredients: '',
    allergens: '',
    shelf_life_days: '',
    execution_time_hours: '',
    made_to_order: false,
    is_available: true,
    featured: false,
    unit: 'each',
    image_url: ''
  });

  useEffect(() => {
    if (!isProducer) {
      navigate('/');
      return;
    }
    
    fetchProduct();
    fetchCategories();
  }, [id, isProducer]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('producer_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProductData({
          name: data.name || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          stock_quantity: data.stock_quantity?.toString() || '',
          category_id: data.category_id || '',
          ingredients: data.ingredients || '',
          allergens: data.allergens || '',
          shelf_life_days: data.shelf_life_days?.toString() || '',
          execution_time_hours: data.execution_time_hours?.toString() || '',
          made_to_order: data.made_to_order || false,
          is_available: data.is_available || true,
          featured: data.featured || false,
          unit: data.unit || 'each',
          image_url: data.image_url || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Product not found or you don't have permission to edit it",
        variant: "destructive",
      });
      navigate('/producer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('product_categories')
      .select('*')
      .order('name');
    
    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: productData.name,
          description: productData.description || null,
          price: parseFloat(productData.price),
          stock_quantity: parseInt(productData.stock_quantity),
          category_id: productData.category_id || null,
          ingredients: productData.ingredients || null,
          allergens: productData.allergens || null,
          shelf_life_days: productData.shelf_life_days ? parseInt(productData.shelf_life_days) : null,
          execution_time_hours: productData.execution_time_hours ? parseInt(productData.execution_time_hours) : null,
          made_to_order: productData.made_to_order,
          is_available: productData.is_available,
          featured: productData.featured,
          unit: productData.unit,
          image_url: productData.image_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('producer_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      
      navigate('/producer/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('producer_id', user?.id);

      if (error) throw error;

      toast({
        title: "Product deleted",
        description: "Product has been successfully deleted",
      });
      
      navigate('/producer/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading product...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/producer/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Product
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={productData.name}
                    onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={productData.price}
                    onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={productData.stock_quantity}
                    onChange={(e) => setProductData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={productData.unit} onValueChange={(value) => setProductData(prev => ({ ...prev, unit: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="each">Each</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="lb">Pound</SelectItem>
                      <SelectItem value="dozen">Dozen</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={productData.category_id} onValueChange={(value) => setProductData(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={productData.image_url}
                    onChange={(e) => setProductData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="shelf_life_days">Shelf Life (days)</Label>
                  <Input
                    id="shelf_life_days"
                    type="number"
                    min="1"
                    value={productData.shelf_life_days}
                    onChange={(e) => setProductData(prev => ({ ...prev, shelf_life_days: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="execution_time_hours">Preparation Time (hours)</Label>
                  <Input
                    id="execution_time_hours"
                    type="number"
                    min="1"
                    value={productData.execution_time_hours}
                    onChange={(e) => setProductData(prev => ({ ...prev, execution_time_hours: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={productData.description}
                  onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your product..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="ingredients">Ingredients</Label>
                <Textarea
                  id="ingredients"
                  value={productData.ingredients}
                  onChange={(e) => setProductData(prev => ({ ...prev, ingredients: e.target.value }))}
                  placeholder="List all ingredients..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="allergens">Allergens</Label>
                <Input
                  id="allergens"
                  value={productData.allergens}
                  onChange={(e) => setProductData(prev => ({ ...prev, allergens: e.target.value }))}
                  placeholder="e.g., Contains nuts, dairy, gluten"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="made_to_order"
                    checked={productData.made_to_order}
                    onCheckedChange={(checked) => setProductData(prev => ({ ...prev, made_to_order: checked }))}
                  />
                  <Label htmlFor="made_to_order">Made to Order</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_available"
                    checked={productData.is_available}
                    onCheckedChange={(checked) => setProductData(prev => ({ ...prev, is_available: checked }))}
                  />
                  <Label htmlFor="is_available">Available</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={productData.featured}
                    onCheckedChange={(checked) => setProductData(prev => ({ ...prev, featured: checked }))}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/producer/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProduct;