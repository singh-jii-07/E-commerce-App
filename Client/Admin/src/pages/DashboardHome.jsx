import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import productService from "../services/productService";
import orderService from "../services/orderService";
import userService from "../services/userService";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";

const DashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    statusCounts: {
      Pending: 0,
      Confirmed: 0,
      Packed: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    },
    recentOrders: [],
    lowStockProducts: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [prodRes, orderRes, userRes] = await Promise.allSettled([
          productService.getProducts(),
          orderService.getAllOrders(),
          userService.getAllUsers(),
        ]);

        const products = prodRes.status === "fulfilled" && prodRes.value.success ? prodRes.value.data : [];
        const orders = orderRes.status === "fulfilled" && orderRes.value.success ? orderRes.value.data : [];
        const users = userRes.status === "fulfilled" && userRes.value.success ? userRes.value.users : [];

        let revenue = 0;
        const counts = {
          Pending: 0,
          Confirmed: 0,
          Packed: 0,
          Shipped: 0,
          Delivered: 0,
          Cancelled: 0,
        };

        orders.forEach((o) => {
          if (o.orderStatus !== "Cancelled") {
            revenue += o.totalAmount || 0;
          }
          if (counts[o.orderStatus] !== undefined) {
            counts[o.orderStatus] += 1;
          }
        });

        const lowStock = products.filter((p) => p.stock <= 5);

        setStats({
          totalRevenue: revenue,
          totalOrders: orders.length,
          totalProducts: products.length,
          totalUsers: users.length,
          statusCounts: counts,
          recentOrders: orders.slice(0, 5),
          lowStockProducts: lowStock.slice(0, 5),
        });
      } catch (err) {
        console.error("Dashboard data error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{stats.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Products</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProducts}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Users</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Status Cards */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Order Status Pipeline</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(stats.statusCounts).map(([status, count]) => (
            <div key={status} className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-center">
              <p className="text-xs font-medium text-gray-500">{status}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">Recent Orders</h3>
            <Link to="/orders" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <p className="text-gray-500 text-xs py-6 text-center">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5">Order ID</th>
                    <th className="px-4 py-2.5">Items</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-medium text-indigo-600">
                        #{o._id.substring(o._id.length - 6)}
                      </td>
                      <td className="px-4 py-3">{o.items?.length || 0} items</td>
                      <td className="px-4 py-3 font-bold text-gray-900">₹{o.totalAmount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            o.orderStatus === "Delivered"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : o.orderStatus === "Cancelled"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {o.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-gray-900 text-sm">Low Stock Alerts</h3>
            </div>
            <Link to="/products" className="text-xs text-indigo-600 font-semibold">
              Manage
            </Link>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-xs py-6 text-center">All stocks are healthy.</p>
          ) : (
            <div className="space-y-2.5">
              {stats.lowStockProducts.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={p.images?.[0] || "https://via.placeholder.com/32"}
                      alt={p.name}
                      className="w-8 h-8 rounded object-cover bg-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-500">₹{p.price} / {p.unit}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold shrink-0">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
