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

    const { cartItems } = await req.json() as { cartItems: CartItem[] };

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
    const totalAmount = subtotal; // Customer pays full price, commission is deducted from producer

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: cartItems.map(item => ({
        price_data: {
          currency: "pln",
          product_data: {
            name: `Product ${item.product_id}`,
          },
          unit_amount: Math.round(item.price_per_unit * 100), // Convert to grosz
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cart`,
      metadata: {
        user_id: user.id,
        commission_rate: commissionRate.toString(),
        commission_amount: commissionAmount.toFixed(2),
      }
    });

    console.log(`Payment session created for user ${user.id}, amount: ${totalAmount} PLN, commission: ${commissionAmount.toFixed(2)} PLN`);

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