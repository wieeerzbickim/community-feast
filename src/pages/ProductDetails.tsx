import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import ProductReviewForm from '@/components/ProductReviewForm';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Star, 
  MapPin, 
  Clock, 
  Package,
  User,
  Store,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  image_url: string;
  ingredients: string;
  allergens: string;
  shelf_life_days: number;
  execution_time_hours: number;
  made_to_order: boolean;
  unit: string;
  producer_id: string;
  user_profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  product_categories: {
    name: string;
  } | null;
}

interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  alt_text: string | null;
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
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
      fetchProductImages();
      fetchReviews();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          user_profiles(id, full_name, avatar_url),
          product_categories(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductImages = async () => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('sort_order');

      if (error) throw error;
      setProductImages(data || []);
    } catch (error) {
      console.error('Error fetching product images:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user_profiles!reviews_consumer_id_fkey(full_name, avatar_url)
        `)
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const reviewsData = data || [];
      setReviews(reviewsData);
      
      // Calculate average rating
      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const onReviewSubmitted = () => {
    fetchReviews();
  };

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const addToCart = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!product) return;

    // Use user-specific cart key matching Cart.tsx
    const cartKey = `cart_${user.id}`;
    const cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    // Create cart item with proper structure matching Cart.tsx expectations
    const cartItem = {
      id: `${product.id}_${Date.now()}`, // unique id for cart item
      product_id: product.id,
      quantity: quantity,
      price_per_unit: product.price,
      product: {
        name: product.name,
        image_url: product.image_url,
        unit: product.unit,
        stock_quantity: product.stock_quantity,
        is_available: product.is_available,
        made_to_order: product.made_to_order,
        user_profiles: product.user_profiles
      }
    };

    // Check if product already exists in cart
    const existingItemIndex = cartItems.findIndex((item: any) => item.product_id === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cartItems.push(cartItem);
    }

    localStorage.setItem(cartKey, JSON.stringify(cartItems));
    
    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} added to cart`,
    });
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              {productImages.length > 1 ? (
                <Carousel 
                  className="w-full h-full" 
                  opts={{
                    align: "start",
                    loop: true,
                    dragFree: true,
                  }}
                >
                  <CarouselContent>
                    {productImages.map((image, index) => (
                      <CarouselItem key={image.id}>
                        <img
                          src={image.image_url}
                          alt={image.alt_text || `${product.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
                          draggable={false}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4 opacity-70 hover:opacity-100 transition-opacity" />
                  <CarouselNext className="right-4 opacity-70 hover:opacity-100 transition-opacity" />
                </Carousel>
              ) : productImages.length === 1 ? (
                <img
                  src={productImages[0].image_url}
                  alt={productImages[0].alt_text || product.name}
                  className="w-full h-full object-cover"
                />
              ) : product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {product.product_categories?.name || 'Uncategorized'}
                  </Badge>
                  {product.made_to_order && (
                    <Badge variant="outline">Made to Order</Badge>
                  )}
                </div>
                {averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {averageRating.toFixed(1)} ({reviews.length} reviews)
                    </span>
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-2xl font-bold text-primary mb-4">
                ${product.price.toFixed(2)} per {product.unit}
              </p>
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="text-sm">Stock: {product.stock_quantity}</span>
              </div>
              {product.shelf_life_days && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Shelf life: {product.shelf_life_days} days</span>
                </div>
              )}
              {product.execution_time_hours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Prep time: {product.execution_time_hours}h</span>
                </div>
              )}
            </div>

            {product.ingredients && (
              <div>
                <h3 className="font-semibold mb-2">Ingredients</h3>
                <p className="text-sm text-muted-foreground">{product.ingredients}</p>
              </div>
            )}

            {product.allergens && (
              <div>
                <h3 className="font-semibold mb-2">Allergens</h3>
                <p className="text-sm text-muted-foreground">{product.allergens}</p>
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                >
                  +
                </Button>
              </div>
              <Button
                onClick={addToCart}
                className="flex-1"
                disabled={!product.is_available || product.stock_quantity === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>

        {/* Producer Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              About the Producer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={product.user_profiles?.avatar_url} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">
                    {product.user_profiles?.full_name}
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/producer/${product.producer_id}`)}
                  >
                    View Profile
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  Local producer offering fresh, quality products
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <div className="mt-8 space-y-6">
          <ProductReviewForm 
            productId={id!} 
            producerId={product.producer_id} 
            onReviewSubmitted={onReviewSubmitted} 
          />
          
          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews ({reviews.length})</CardTitle>
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
                    <span className="text-sm text-muted-foreground">
                      {averageRating.toFixed(1)} out of 5
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.user_profiles?.avatar_url} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
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
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {reviews.length > 3 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="flex items-center gap-2"
                    >
                      {showAllReviews ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show All Reviews ({reviews.length})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;