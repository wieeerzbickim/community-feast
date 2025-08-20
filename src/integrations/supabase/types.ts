export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price_per_unit: number
          product_id: string
          quantity: number
          total_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price_per_unit: number
          product_id: string
          quantity: number
          total_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price_per_unit?: number
          product_id?: string
          quantity?: number
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          consumer_id: string
          created_at: string | null
          delivery_address: string | null
          delivery_fee: number | null
          delivery_method: string
          delivery_time: string | null
          id: string
          payment_intent_id: string | null
          payment_status: string | null
          pickup_time: string | null
          producer_id: string
          special_instructions: string | null
          status: string
          total_amount: number
          transaction_fee: number | null
          updated_at: string | null
        }
        Insert: {
          consumer_id: string
          created_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_method: string
          delivery_time?: string | null
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          pickup_time?: string | null
          producer_id: string
          special_instructions?: string | null
          status?: string
          total_amount: number
          transaction_fee?: number | null
          updated_at?: string | null
        }
        Update: {
          consumer_id?: string
          created_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_method?: string
          delivery_time?: string | null
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          pickup_time?: string | null
          producer_id?: string
          special_instructions?: string | null
          status?: string
          total_amount?: number
          transaction_fee?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      producer_profiles: {
        Row: {
          business_name: string
          created_at: string | null
          delivery_available: boolean | null
          delivery_fee: number | null
          delivery_radius_miles: number | null
          description: string | null
          id: string
          pickup_instructions: string | null
          pickup_location: string
          rating: number | null
          review_count: number | null
          store_status: string | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          total_sales: number | null
          updated_at: string | null
        }
        Insert: {
          business_name: string
          created_at?: string | null
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_radius_miles?: number | null
          description?: string | null
          id: string
          pickup_instructions?: string | null
          pickup_location: string
          rating?: number | null
          review_count?: number | null
          store_status?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string | null
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_radius_miles?: number | null
          description?: string | null
          id?: string
          pickup_instructions?: string | null
          pickup_location?: string
          rating?: number | null
          review_count?: number | null
          store_status?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producer_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          execution_time_hours: number | null
          featured: boolean | null
          id: string
          image_url: string | null
          ingredients: string | null
          is_available: boolean | null
          made_to_order: boolean | null
          name: string
          price: number
          producer_id: string
          shelf_life_days: number | null
          stock_quantity: number
          storage_instructions: string | null
          tags: string[] | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          allergens?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          execution_time_hours?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_available?: boolean | null
          made_to_order?: boolean | null
          name: string
          price: number
          producer_id: string
          shelf_life_days?: number | null
          stock_quantity?: number
          storage_instructions?: string | null
          tags?: string[] | null
          unit?: string
          updated_at?: string | null
        }
        Update: {
          allergens?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          execution_time_hours?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_available?: boolean | null
          made_to_order?: boolean | null
          name?: string
          price?: number
          producer_id?: string
          shelf_life_days?: number | null
          stock_quantity?: number
          storage_instructions?: string | null
          tags?: string[] | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          consumer_id: string
          created_at: string | null
          id: string
          order_id: string
          producer_id: string
          product_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          consumer_id: string
          created_at?: string | null
          id?: string
          order_id: string
          producer_id: string
          product_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          consumer_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
          producer_id?: string
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          role: string
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          role?: string
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          role?: string
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      waiting_lists: {
        Row: {
          consumer_id: string
          created_at: string | null
          id: string
          notified: boolean | null
          product_id: string
        }
        Insert: {
          consumer_id: string
          created_at?: string | null
          id?: string
          notified?: boolean | null
          product_id: string
        }
        Update: {
          consumer_id?: string
          created_at?: string | null
          id?: string
          notified?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_lists_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_lists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
