import React, { useState, useEffect } from "react";
import orderService from "../services/orderService";
import {
  ShoppingBag,
  Search,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Eye,
} from "lucide-react";

const STATUS_OPTIONS = [
  "ALL",
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const ALLOWED_NEXT_STATUSES = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Packed", "Cancelled"],
  Packed: ["Shipped"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getAllOrders();
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      showFeedback("error", "Failed to fetch orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await orderService.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        showFeedback("success", `Order #${orderId.slice(-6)} updated to "${newStatus}".`);
        fetchOrders();
        if (selectedOrderDetails && selectedOrderDetails._id === orderId) {
          setSelectedOrderDetails((prev) => ({ ...prev, orderStatus: newStatus }));
        }
      }
    } catch (err) {
      console.error("Update status error:", err);
      showFeedback(
        "error",
        err.response?.data?.message || `Failed to set status to ${newStatus}.`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === "ALL" || o.orderStatus === selectedStatus;
    const matchesSearch =
      o._id.toLowerCase().includes(search.toLowerCase()) ||
      o.address?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      o.address?.phone?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Packed":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Shipped":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Orders</h2>
        <p className="text-xs text-gray-500">Track and manage customer order fulfillments</p>
      </div>

      {/* Feedback Alert */}
      {feedback.message && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback({ type: "", message: "" })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-1.5 border-b border-gray-100 pb-2.5">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedStatus === status
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, Name, or Phone..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
          <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">No Orders Found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const allowedNext = ALLOWED_NEXT_STATUSES[order.orderStatus] || [];
                  const isUpdating = updatingId === order._id;

                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-indigo-600">
                          #{order._id.substring(order._id.length - 8)}
                        </p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{order.address?.fullName || "Customer"}</p>
                        <p className="text-[11px] text-gray-500">{order.address?.phone || "N/A"}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">UID: {order.user?._id || order.user}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{order.items?.length || 0} items</p>
                        {order.items?.map((item, idx) => (
                          <p key={idx} className="text-[10px] text-gray-400 font-mono mt-0.5">
                            PID: {item.product?._id || item.product}
                          </p>
                        ))}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        ₹{order.totalAmount}
                        <span className="block font-normal text-[10px] text-gray-500">{order.paymentMethod}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(order.orderStatus)}`}>
                            {order.orderStatus}
                          </span>

                          {allowedNext.length > 0 && (
                            <div className="flex items-center gap-1 pt-0.5">
                              {allowedNext.map((st) => (
                                <button
                                  key={st}
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateStatus(order._id, st)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors disabled:opacity-50"
                                >
                                  Mark {st}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-950 text-lg flex items-center gap-2">
                  <span>Order Details</span>
                  <span className="font-mono text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                    #{selectedOrderDetails._id.substring(selectedOrderDetails._id.length - 8)}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Ordered on {new Date(selectedOrderDetails.createdAt).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrderDetails(null)} 
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Details */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50/50 p-4 rounded-xl border border-gray-100 text-xs space-y-2 shadow-sm border-l-4 border-l-indigo-600">
              <p className="font-bold text-gray-900 flex items-center gap-2 text-[13px] border-b border-gray-100 pb-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Shipping & Customer Details</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold">Recipient</p>
                  <p className="font-bold text-gray-955 text-sm">{selectedOrderDetails.address?.fullName}</p>
                  <p className="text-gray-600 flex items-center gap-1 mt-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {selectedOrderDetails.address?.phone}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold">Delivery Address</p>
                  <p className="text-gray-700 leading-relaxed font-semibold">
                    {selectedOrderDetails.address?.addressLine1}
                  </p>
                  <p className="text-gray-600">
                    {selectedOrderDetails.address?.city}, {selectedOrderDetails.address?.state} - {selectedOrderDetails.address?.postalCode}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400">
                <span>User ID: <span className="font-mono">{selectedOrderDetails.user?._id || selectedOrderDetails.user}</span></span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Order Items ({selectedOrderDetails.items?.length || 0})</span>
              </p>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selectedOrderDetails.items?.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-3 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={item.product?.images?.[0] || "https://via.placeholder.com/64"}
                          alt={item.product?.name}
                          className="w-14 h-14 rounded-lg object-cover bg-gray-50 border border-gray-200 shadow-sm"
                        />
                        <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-950 text-xs hover:text-indigo-600 transition-colors line-clamp-1">
                          {item.product?.name || "Product"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                            ID: {(item.product?._id || item.product).substring(0, 8)}...
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            ₹{item.price} each
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <p className="font-bold text-gray-950 text-sm">
                        ₹{item.price * item.quantity}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Payment Method</span>
                <span className="font-semibold text-gray-900 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full text-[10px]">
                  {selectedOrderDetails.paymentMethod}
                </span>
              </div>
              <div className="border-t border-gray-200/60 pt-2.5 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total Amount</span>
                <span className="font-extrabold text-indigo-700 text-lg">
                  ₹{selectedOrderDetails.totalAmount}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
