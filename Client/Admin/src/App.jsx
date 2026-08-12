import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import DashboardHome from "./pages/DashboardHome";
import ProductsPage from "./pages/ProductsPage";
import CategoriesPage from "./pages/CategoriesPage";
import OrdersPage from "./pages/OrdersPage";
import UsersPage from "./pages/UsersPage";
import FaqsPage from "./pages/FaqsPage";
import ContactsPage from "./pages/ContactsPage";
import PaymentsPage from "./pages/PaymentsPage";
import TransactionsPage from "./pages/TransactionsPage";
import InvoicesPage from "./pages/InvoicesPage";
import Register from "./pages/Register";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="faqs" element={<FaqsPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="register" element={<Register/>} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
