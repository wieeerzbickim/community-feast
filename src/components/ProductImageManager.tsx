import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  alt_text: string | null;
}

interface ProductImageManagerProps {
  productId: string;
  onImagesChange?: (images: ProductImage[]) => void;
}

const ProductImageManager: React.FC<ProductImageManagerProps> = ({ 
  productId, 
  onImagesChange 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, [productId]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');

      if (error) throw error;
      setImages(data || []);
      onImagesChange?.(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (images.length + files.length > 5) {
      toast({
        title: 'Błąd',
        description: 'Maksymalnie 5 zdjęć na produkt',
        variant: 'destructive',
      });
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Błąd',
          description: 'Proszę wybrać pliki graficzne',
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Błąd',
          description: 'Rozmiar pliku nie może przekraczać 5MB',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = validFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${productId}/${Date.now()}_${index}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        return {
          product_id: productId,
          image_url: data.publicUrl,
          is_primary: images.length === 0 && index === 0,
          sort_order: images.length + index,
          alt_text: `Product image ${images.length + index + 1}`
        };
      });

      const imageData = await Promise.all(uploadPromises);

      const { error } = await supabase
        .from('product_images')
        .insert(imageData);

      if (error) throw error;

      toast({
        title: 'Sukces',
        description: 'Zdjęcia zostały przesłane',
      });

      fetchImages();
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Błąd',
        description: 'Błąd podczas przesyłania zdjęć',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: 'Sukces',
        description: 'Zdjęcie zostało usunięte',
      });

      fetchImages();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Błąd',
        description: 'Błąd podczas usuwania zdjęcia',
        variant: 'destructive',
      });
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      // First, unset all primary flags
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);

      // Then set the selected image as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: 'Sukces',
        description: 'Zdjęcie główne zostało zmienione',
      });

      fetchImages();
    } catch (error: any) {
      console.error('Error setting primary image:', error);
      toast({
        title: 'Błąd',
        description: 'Błąd podczas zmiany zdjęcia głównego',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Ładowanie zdjęć...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Zdjęcia produktu (maks. 5)</h3>
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={uploading || images.length >= 5}
        >
          <Upload className="h-4 w-4 mr-2" />
          {images.length === 0 ? 'Dodaj zdjęcia' : 'Dodaj więcej'}
        </Button>
      </div>

      <input
        id="image-upload"
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.image_url}
                alt={image.alt_text || 'Product image'}
                className="w-full h-32 object-cover rounded-lg border"
              />
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(image.id)}
                  >
                    Główne
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteImage(image.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {image.is_primary && (
                <div className="absolute top-2 left-2">
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Główne
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Brak zdjęć produktu</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Dodaj pierwsze zdjęcie
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Maksymalny rozmiar: 5MB każde. Pierwsze zdjęcie będzie używane jako miniatura.
      </p>
    </div>
  );
};

export default ProductImageManager;