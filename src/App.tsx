import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Navbar from "./components/Navbar";
import Marketplace from "./pages/Marketplace";
import AuthPage from "./pages/AuthPage";
import ProducerDashboard from "./pages/ProducerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AddProduct from "./pages/AddProduct";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import ProductDetails from "./pages/ProductDetails";
import EditProduct from "./pages/EditProduct";
import NotFound from "./pages/NotFound";
import OrderHistory from "./pages/OrderHistory";
import ProducerProfile from "./pages/ProducerProfile";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Marketplace />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/producer-dashboard" element={<ProducerDashboard />} />
              <Route path="/producer/add-product" element={<AddProduct />} />
              <Route path="/producer/edit-product/:id" element={<EditProduct />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/producer/:id" element={<ProducerProfile />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<PaymentCancel />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
