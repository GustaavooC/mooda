import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { TenantProvider } from './contexts/TenantContext';
import { useAuth } from './hooks/useAuth';
import AdminDashboard from './components/AdminDashboard';
import TenantDashboard from './components/TenantDashboard';
import ProductList from './components/ProductList';
import StoreCustomization from './components/StoreCustomization';
import ThemeSelector from './components/ThemeSelector';
import OrderManagement from './components/OrderManagement';
import CustomerManagement from './components/CustomerManagement';
import CategoryManagement from './components/CategoryManagement';
import ReportsAnalytics from './components/ReportsAnalytics';
import StoreSettings from './components/StoreSettings';
import TenantLayout from './components/TenantLayout';
import PublicStoreFront from './components/PublicStoreFront';
import AuthForm from './components/AuthForm';

// Public store wrapper component
const PublicStoreWrapper: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  return (
    <TenantProvider tenantSlug={slug}>
      <PublicStoreFront />
    </TenantProvider>
  );
};

// Dashboard wrapper component for authenticated users
const DashboardWrapper: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm mode="signin" />;
  }

  // Admin users go to admin dashboard
  if (user.isAdmin) {
    return <AdminDashboard />;
  }

  // Regular users go to tenant dashboard
  return (
    <TenantProvider>
      <Routes>
        <Route path="/" element={<TenantDashboard />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/customization" element={<StoreCustomization />} />
        <Route path="/themes" element={<ThemeSelector />} />
        <Route path="/categories" element={<CategoryManagement />} />
        <Route path="/orders" element={<OrderManagement />} />
        <Route path="/customers" element={<CustomerManagement />} />
        <Route path="/reports" element={<ReportsAnalytics />} />
        <Route path="/settings" element={<StoreSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TenantProvider>
  );
};

// Admin wrapper component
const AdminWrapper: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm mode="admin" />;
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public store routes */}
          <Route path="/loja/:slug" element={<PublicStoreWrapper />} />
          <Route path="/store/:slug" element={<PublicStoreWrapper />} />
          
          {/* Authentication routes */}
          <Route path="/auth/signin" element={<AuthForm mode="signin" />} />
          <Route path="/auth/signup" element={<AuthForm mode="signup" />} />
          
          {/* Admin routes */}
          <Route path="/admin/*" element={<AdminWrapper />} />
          
          {/* Dashboard routes (protected) */}
          <Route path="/dashboard/*" element={<DashboardWrapper />} />
          
          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/store" element={<Navigate to="/loja/moda-bella" replace />} />
          <Route path="/loja" element={<Navigate to="/loja/moda-bella" replace />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;