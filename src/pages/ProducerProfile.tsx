import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Package,
  User,
  Store,
  Clock
} from 'lucide-react';

interface ProducerProfile {
  id: string;
  business_name: string;
  description: string;
  rating: number;
  review_count: number;
  pickup_location: string;
  delivery_available: boolean;
  delivery_radius_miles: number;
  delivery_fee: number;
  store_status: string;
  user_profiles: {
    full_name: string;
    avatar_url: string;
    city: string;
    state: string;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock_quantity: number;
  is_available: boolean;
  image_url: string;
  rating?: number;
  review_count?: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_profiles: {
    full_name: string;
    avatar_url: string;
  };
  products: {
    name: string;
  };
}

const ProducerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [producer, setProducer] = useState<ProducerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProducerData();
    }
  }, [id]);

  const fetchProducerData = async () => {
    try {
      // Fetch producer profile
      const { data: producerData, error: producerError } = await supabase
        .from('producer_profiles')
        .select(`
          *,
          user_profiles(full_name, avatar_url, city, state)
        `)
        .eq('id', id)
        .single();

      if (producerError) throw producerError;
      setProducer(producerData);

      // Fetch producer's products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('producer_id', id)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Calculate rating for each product
      const productsWithRating = await Promise.all(
        (productsData || []).map(async (product) => {
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('product_id', product.id);
          
          const avgRating = reviews && reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;
          
          return {
            ...product,
            rating: avgRating,
            review_count: reviews?.length || 0
          };
        })
      );

      setProducts(productsWithRating);

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          user_profiles(full_name, avatar_url),
          products(name)
        `)
        .eq('producer_id', id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

    } catch (error) {
      console.error('Error fetching producer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading producer profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Producer not found</h1>
            <Button onClick={() => navigate('/')}>
              Back to Marketplace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>

        {/* Producer Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={producer.user_profiles?.avatar_url} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-bold">{producer.business_name}</h1>
                  <Badge variant={producer.store_status === 'open' ? 'default' : 'secondary'}>
                    {producer.store_status}
                  </Badge>
                </div>
                
                <p className="text-xl text-muted-foreground mb-3">
                  {producer.user_profiles?.full_name}
                </p>
                
                <div className="flex items-center gap-6 mb-4">
                  {producer.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(producer.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">
                        {producer.rating.toFixed(1)} ({producer.review_count} reviews)
                      </span>
                    </div>
                  )}
                  
                  {producer.user_profiles?.city && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {producer.user_profiles.city}, {producer.user_profiles.state}
                    </div>
                  )}
                </div>
                
                {producer.description && (
                  <p className="text-muted-foreground mb-4">{producer.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Pickup Location:</strong> {producer.pickup_location}
                  </div>
                  {producer.delivery_available && (
                    <>
                      <div>
                        <strong>Delivery:</strong> Available within {producer.delivery_radius_miles} miles
                      </div>
                      <div>
                        <strong>Delivery Fee:</strong> ${producer.delivery_fee.toFixed(2)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card 
                  key={product.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="aspect-square bg-muted relative">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold line-clamp-1">
                      {product.name}
                    </CardTitle>
                    {product.rating && product.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">
                          {product.rating.toFixed(1)} ({product.review_count})
                        </span>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold text-primary">
                        ${product.price.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          / {product.unit}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {product.stock_quantity} in stock
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {products.length === 0 && (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No products available</h3>
                <p className="text-muted-foreground">
                  This producer hasn't added any products yet.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.user_profiles?.avatar_url} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{review.user_profiles?.full_name}</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          Product: {review.products?.name}
                        </p>
                        
                        {review.comment && (
                          <p className="text-sm">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {reviews.length === 0 && (
              <div className="text-center py-16">
                <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground">
                  This producer hasn't received any reviews yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProducerProfile;