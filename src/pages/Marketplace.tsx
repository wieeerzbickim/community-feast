import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, ShoppingCart, Heart, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock_quantity: number;
  is_available: boolean;
  featured: boolean;
  tags: string[];
  image_url: string | null;
  made_to_order: boolean;
  execution_time_hours: number | null;
  user_profiles: {
    full_name: string;
  } | null;
  product_categories: {
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
}

const Marketplace = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch products with producer and category info
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          user_profiles(full_name),
          product_categories(name)
        `)
        .eq('is_available', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const producerName = product.user_profiles?.full_name || '';
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           product.product_categories?.name === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    const cartKey = `cart_${user.id}`;
    const existingCart = localStorage.getItem(cartKey);
    let cartItems = existingCart ? JSON.parse(existingCart) : [];
    
    const existingItemIndex = cartItems.findIndex((item: any) => item.product_id === product.id);
    
    if (existingItemIndex !== -1) {
      cartItems[existingItemIndex].quantity += 1;
    } else {
      cartItems.push({
        id: `${product.id}_${Date.now()}`,
        product_id: product.id,
        quantity: 1,
        price_per_unit: product.price
      });
    }
    
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart`,
    });
  };

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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            {t('marketplace.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('marketplace.subtitle')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('marketplace.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t('marketplace.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('marketplace.allCategories')}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted relative">
                  {product.featured && (
                    <Badge className="absolute top-2 left-2 bg-primary">
                      {t('producer.featured')}
                    </Badge>
                  )}
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <Package className="h-16 w-16" />
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold line-clamp-1">
                    {product.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t('marketplace.by')} {product.user_profiles?.full_name}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xl font-bold text-primary">
                      {product.price.toFixed(2)} PLN
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        / {product.unit}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.product_categories?.name || t('admin.uncategorized')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {product.made_to_order ? (
                      <span className="text-sm text-muted-foreground">
                        Na zamówienie ({product.execution_time_hours}h)
                      </span>
                    ) : product.stock_quantity > 0 ? (
                      <span className="text-sm text-muted-foreground">
                        {product.stock_quantity} {t('producer.inStock')}
                      </span>
                    ) : (
                      <span className="text-sm text-destructive">
                        {t('marketplace.outOfStock')}
                      </span>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        disabled={!product.made_to_order && product.stock_quantity === 0}
                        onClick={() => addToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {t('marketplace.addToCart')}
                      </Button>
                    </div>
                  </div>
                  
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {product.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('marketplace.noProducts')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('marketplace.noProductsDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;