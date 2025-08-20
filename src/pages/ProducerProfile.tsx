import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ProducerReviewForm from '@/components/ProducerReviewForm';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Package,
  User,
  Store,
  Clock,
  Filter
} from 'lucide-react';

interface ProducerProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  city: string;
  state: string;
  bio?: string;
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
  product_id?: string;
  producer_id?: string;
  user_profiles: {
    full_name: string;
    avatar_url: string;
  };
  products?: {
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
  const [reviewFilter, setReviewFilter] = useState<'all' | 'products' | 'producer'>('all');
  const [averageRating, setAverageRating] = useState(0);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProducerData();
    }
  }, [id]);

  const fetchProducerData = async () => {
    try {
      // Fetch producer profile from user_profiles
      const { data: producerData, error: producerError } = await supabase
        .from('user_profiles')
        .select('*')
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

      // Fetch all reviews (both product and producer reviews)
      const { data: productReviews, error: productReviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          user_profiles!reviews_consumer_id_fkey(full_name, avatar_url),
          products(name)
        `)
        .in('product_id', (productsData || []).map(p => p.id))
        .order('created_at', { ascending: false });

      const { data: producerReviews, error: producerReviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          user_profiles!reviews_consumer_id_fkey(full_name, avatar_url)
        `)
        .eq('producer_id', id)
        .is('product_id', null)
        .order('created_at', { ascending: false });

      const allReviews = [
        ...(productReviews || []),
        ...(producerReviews || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setReviews(allReviews);

      // Calculate average rating
      if (allReviews.length > 0) {
        const avg = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
        setAverageRating(avg);
      }

    } catch (error) {
      console.error('Error fetching producer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onReviewSubmitted = () => {
    fetchProducerData();
    setIsReviewDialogOpen(false);
  };

  const filteredReviews = reviews.filter(review => {
    if (reviewFilter === 'products') return review.product_id;
    if (reviewFilter === 'producer') return review.producer_id && !review.product_id;
    return true;
  });

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
                <AvatarImage src={producer.avatar_url} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-bold">{producer.full_name}</h1>
                  <div className="flex items-center gap-2">
                    <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Star className="h-4 w-4 mr-2" />
                          Rate Producer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rate {producer.full_name}</DialogTitle>
                        </DialogHeader>
                        <ProducerReviewForm producerId={id!} onReviewSubmitted={onReviewSubmitted} />
                      </DialogContent>
                    </Dialog>
                    <Badge variant="default">Producer</Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 mb-4">
                  {averageRating > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(averageRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">
                        {averageRating.toFixed(1)} ({reviews.length} reviews)
                      </span>
                    </div>
                  )}
                  
                  {producer.city && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {producer.city}, {producer.state}
                    </div>
                  )}
                </div>
                
                {producer.bio && (
                  <p className="text-muted-foreground mb-4">{producer.bio}</p>
                )}
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
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Filter className="h-4 w-4" />
                <Select value={reviewFilter} onValueChange={(value: 'all' | 'products' | 'producer') => setReviewFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter reviews" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reviews ({reviews.length})</SelectItem>
                    <SelectItem value="products">Product Reviews ({reviews.filter(r => r.product_id).length})</SelectItem>
                    <SelectItem value="producer">Producer Reviews ({reviews.filter(r => r.producer_id && !r.product_id).length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                {filteredReviews.map((review) => (
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
                              <Badge variant="outline" className="text-xs">
                                {review.product_id ? 'Product' : 'Producer'}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {review.products?.name && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Product: {review.products.name}
                            </p>
                          )}
                          
                          {review.comment && (
                            <p className="text-sm">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredReviews.length === 0 && (
                <div className="text-center py-16">
                  <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground">
                    {reviewFilter === 'all' 
                      ? "This producer hasn't received any reviews yet."
                      : `No ${reviewFilter} reviews found.`
                    }
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProducerProfile;