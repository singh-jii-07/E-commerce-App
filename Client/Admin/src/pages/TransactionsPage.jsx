import React, { useState, useEffect } from "react";
import orderService from "../services/orderService";
import { History, Search, Loader2, Calendar } from "lucide-react";

const TransactionsPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getAllOrders();
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error("Fetch transactions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const searchLower = search.toLowerCase();
    const txnId = o.razorpayPaymentId || `COD-TXN-${o._id.toUpperCase()}`;
    return (
      txnId.toLowerCase().includes(searchLower) ||
      o._id.toLowerCase().includes(searchLower) ||
      o.address?.fullName?.toLowerCase().includes(searchLower)
    );
  });

  const getTransactionStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "Refunded":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Failed":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Transactions</h2>
        <p className="text-xs text-gray-500">Track raw payment gateway responses, merchant refs, and transaction IDs</p>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Transaction ID, Order ID, customer..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm">Loading transactions...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
          <History className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">No Transactions Found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Gateway</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((o) => {
                  const txnId = o.razorpayPaymentId || `COD-TXN-${o._id.toUpperCase()}`;
                  return (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-semibold text-indigo-600">
                        {txnId}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-gray-500">
                        #{o._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {o.address?.fullName || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 uppercase tracking-wider font-semibold">
                        {o.paymentMethod === "Razorpay" ? "Razorpay" : "Cash on Delivery"}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        ₹{o.totalAmount}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getTransactionStatusBadge(
                          o.orderStatus === "Delivered" && o.paymentMethod === "COD" ? "Paid" : o.paymentStatus
                        )}`}>
                          {o.orderStatus === "Delivered" && o.paymentMethod === "COD" ? "Success" : o.paymentStatus === "Paid" ? "Success" : o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(o.createdAt).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
