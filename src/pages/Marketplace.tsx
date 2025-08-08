import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, ShoppingCart, MapPin, Star, Bell } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock_quantity: number;
  is_available: boolean;
  featured: boolean;
  producer_profiles: {
    business_name: string;
    pickup_location: string;
    delivery_available: boolean;
    delivery_fee: number;
    rating: number;
  };
  product_categories: {
    name: string;
  };
  product_images: {
    image_url: string;
    is_primary: boolean;
  }[];
}

const Marketplace = () => {
  const { user, isConsumer } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        producer_profiles(business_name, pickup_location, delivery_available, delivery_fee, rating),
        product_categories(name),
        product_images(image_url, is_primary)
      `)
      .eq('is_available', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error loading products",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('product_categories')
      .select('*')
      .order('name');
    
    setCategories(data || []);
  };

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
    toast({
      title: "Added to cart",
      description: "Item added to your cart successfully.",
    });
  };

  const joinWaitingList = async (productId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join the waiting list.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('waiting_lists')
      .insert({
        product_id: productId,
        consumer_id: user.id
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Added to waiting list",
        description: "You'll be notified when this product is available.",
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.producer_profiles.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           product.product_categories?.name === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading products...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Fresh Local Products
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing homemade and artisanal food products from local producers in your community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products, producers, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const primaryImage = product.product_images?.find(img => img.is_primary)?.image_url;
            const isOutOfStock = product.stock_quantity === 0;
            
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted relative">
                  {primaryImage ? (
                    <img 
                      src={primaryImage} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                  {product.featured && (
                    <Badge className="absolute top-2 left-2 bg-accent">
                      Featured
                    </Badge>
                  )}
                  {isOutOfStock && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {product.producer_profiles.business_name}
                  </div>
                  {product.producer_profiles.rating > 0 && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-accent mr-1" />
                      <span className="text-sm">{product.producer_profiles.rating.toFixed(1)}</span>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-primary">
                      ${product.price.toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{product.unit}
                      </span>
                    </div>
                    {!isOutOfStock && (
                      <span className="text-sm text-muted-foreground">
                        {product.stock_quantity} available
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {isOutOfStock ? (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => joinWaitingList(product.id)}
                        disabled={!isConsumer}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Notify When Available
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => addToCart(product.id)}
                        disabled={!isConsumer}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    )}
                    
                    {product.producer_profiles.delivery_available && (
                      <div className="text-xs text-muted-foreground text-center">
                        Delivery available (+${product.producer_profiles.delivery_fee})
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or category filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;