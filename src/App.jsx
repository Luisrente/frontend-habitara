import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import DashboardPage from './features/landlord/pages/DashboardPage';
import ListingsPage from './features/landlord/pages/ListingsPage';
import NewListingPage from './features/landlord/pages/NewListingPage';
import ReservationsPage from './features/landlord/pages/ReservationsPage';
import CatalogPage from './features/public/pages/CatalogPage';
import AccommodationDetailPage from './features/public/pages/AccommodationDetailPage';
import FavoritesPage from './features/public/pages/FavoritesPage';
import MyReservationsPage from './features/public/pages/MyReservationsPage';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import Layout from './shared/components/Layout';
import LandlordRequestPage from './features/auth/pages/LandlordRequestPage';
import AdminLandlordRequestsPage from './features/admin/pages/AdminLandlordRequestsPage';
import AccountPage from './features/public/pages/AccountPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/accommodation/:id" element={<AccommodationDetailPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reservations" element={<MyReservationsPage />} />
      <Route path="/become-landlord" element={<LandlordRequestPage />} />
      <Route path="/account" element={<AccountPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
      </Route>

      <Route
        path="/dashboard/listings/new"
        element={
          <ProtectedRoute>
            <NewListingPage />
          </ProtectedRoute>
        }
      />

      <Route path="/admin/landlord-requests" element={<AdminLandlordRequestsPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
