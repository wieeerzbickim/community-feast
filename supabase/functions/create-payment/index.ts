import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  product_id: string;
  quantity: number;
  price_per_unit: number;
}

interface PaymentRequest {
  cartItems: CartItem[];
  deliveryMethod?: string;
  deliveryAddress?: string | null;
  deliveryFee?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    // Create Supabase client for user authentication
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data } = await supabase.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const { cartItems, deliveryMethod = 'pickup', deliveryAddress = null, deliveryFee = 0 } = await req.json() as PaymentRequest;

    if (!cartItems || cartItems.length === 0) {
      throw new Error("No items in cart");
    }

    // Get commission rate from admin settings
    const { data: commissionSetting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'commission_rate')
      .single();

    const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 5; // Default 5%

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Calculate totals
    const subtotal = cartItems.reduce((total, item) => total + (item.price_per_unit * item.quantity), 0);
    const commissionAmount = subtotal * (commissionRate / 100);
    const totalAmount = subtotal + deliveryFee; // Customer pays subtotal + delivery fee

    // Create line items for Stripe
    const lineItems = [
      // Product line items
      ...cartItems.map(item => ({
        price_data: {
          currency: "pln",
          product_data: {
            name: `Product ${item.product_id}`,
          },
          unit_amount: Math.round(item.price_per_unit * 100), // Convert to grosz
        },
        quantity: item.quantity,
      }))
    ];

    // Add delivery fee as separate line item if applicable
    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: "pln",
          product_data: {
            name: "Warsaw Delivery",
          },
          unit_amount: Math.round(deliveryFee * 100), // Convert to grosz
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cart`,
      metadata: {
        user_id: user.id,
        commission_rate: commissionRate.toString(),
        commission_amount: commissionAmount.toFixed(2),
        delivery_method: deliveryMethod,
        delivery_address: deliveryAddress || '',
        delivery_fee: deliveryFee.toString(),
        subtotal: subtotal.toFixed(2),
      }
    });

    console.log(`Payment session created for user ${user.id}, subtotal: ${subtotal} PLN, delivery: ${deliveryFee} PLN, total: ${totalAmount} PLN, commission: ${commissionAmount.toFixed(2)} PLN`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});