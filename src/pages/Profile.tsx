import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Store, Settings, MapPin, Phone, Mail, Edit3 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Profile = () => {
  const { user, userProfile, isProducer, isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });
  const [producerData, setProducerData] = useState({
    business_name: '',
    description: '',
    pickup_location: '',
    pickup_instructions: '',
    delivery_available: false,
    delivery_radius_miles: 0,
    delivery_fee: 0,
    avatar_url: ''
  });

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        full_name: userProfile.full_name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        zip_code: userProfile.zip_code || ''
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (isProducer) {
      fetchProducerProfile();
    }
  }, [isProducer]);

  const fetchProducerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('producer_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProducerData({
          business_name: data.business_name || '',
          description: data.description || '',
          pickup_location: data.pickup_location || '',
          pickup_instructions: data.pickup_instructions || '',
          delivery_available: data.delivery_available || false,
          delivery_radius_miles: data.delivery_radius_miles || 0,
          delivery_fee: data.delivery_fee || 0,
          avatar_url: ''
        });
      }
    } catch (error) {
      console.error('Error fetching producer profile:', error);
    }
  };

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setEditMode(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateProducerProfile = async () => {
    try {
      const { error } = await supabase
        .from('producer_profiles')
        .upsert({
          id: user?.id,
          ...producerData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Producer profile updated successfully",
      });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <User className="h-8 w-8" />
              {t('nav.profile')}
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={userProfile?.role === 'admin' ? 'default' : 'secondary'}>
              {userProfile?.role}
            </Badge>
            {!editMode && (
              <Button onClick={() => setEditMode(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            {isProducer && <TabsTrigger value="business">Business</TabsTrigger>}
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={profileData.state}
                      onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      value={profileData.zip_code}
                      onChange={(e) => setProfileData(prev => ({ ...prev, zip_code: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                </div>
                
                {editMode && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={updateProfile}>
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isProducer && (
            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="business_name">Business Name</Label>
                      <Input
                        id="business_name"
                        value={producerData.business_name}
                        onChange={(e) => setProducerData(prev => ({ ...prev, business_name: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Business Description</Label>
                      <Textarea
                        id="description"
                        value={producerData.description}
                        onChange={(e) => setProducerData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Tell customers about your business..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="pickup_location">Pickup Location</Label>
                      <Input
                        id="pickup_location"
                        value={producerData.pickup_location}
                        onChange={(e) => setProducerData(prev => ({ ...prev, pickup_location: e.target.value }))}
                        placeholder="Where customers can pick up orders"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="pickup_instructions">Pickup Instructions</Label>
                      <Textarea
                        id="pickup_instructions"
                        value={producerData.pickup_instructions}
                        onChange={(e) => setProducerData(prev => ({ ...prev, pickup_instructions: e.target.value }))}
                        placeholder="Special instructions for pickup..."
                      />
                    </div>
                  </div>
                  
                  <Button onClick={updateProducerProfile} className="mt-4">
                    Update Business Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Account Type</h3>
                    <p className="text-sm text-muted-foreground">
                      Your current account role: {userProfile?.role}
                    </p>
                  </div>
                  <Badge variant={userProfile?.role === 'admin' ? 'default' : 'secondary'}>
                    {userProfile?.role}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Language</h3>
                    <p className="text-sm text-muted-foreground">
                      Change your preferred language
                    </p>
                  </div>
                  <Button variant="outline">
                    Change Language
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;