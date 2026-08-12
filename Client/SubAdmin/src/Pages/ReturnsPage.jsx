import React, { useState, useEffect } from "react";
import { ecommerceAxios } from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Eye,
  Calendar,
  User,
  ShoppingBag,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

const STATUS_COLORS = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Processing: "bg-blue-50 text-blue-700 border-blue-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed: "bg-green-50 text-green-700 border-green-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

const ReturnsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await ecommerceAxios.get("/order/return-requests");
      if (res.data.success && Array.isArray(res.data.data)) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error("Fetch return requests error:", err);
      showFeedback("error", "Failed to fetch return requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    setUpdatingId(requestId);
    try {
      const res = await ecommerceAxios.put(`/order/return-request/${requestId}`, {
        status: newStatus,
        adminNotes: adminNotes,
      });
      if (res.data.success) {
        showFeedback("success", `Request status updated to "${newStatus}".`);
        fetchRequests();
        setSelectedRequest(null);
        setAdminNotes("");
      }
    } catch (err) {
      console.error("Update request status error:", err);
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to update request status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    const matchesSearch =
      r._id.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
      r.order?._id?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Returns & Refunds</h2>
        <p className="text-xs text-gray-500">Review and authorize customer product returns and refunds</p>
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

      {/* Filters & Search */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-1.5 border-b border-gray-100 pb-2.5">
          {["ALL", "Pending", "Processing", "Approved", "Completed", "Rejected"].map((status) => (
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
            placeholder="Search by Request ID, Order ID, or Username..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm">Loading return requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
          <RotateCcw className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">No Return Requests Found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600">
                      #{request._id.substring(request._id.length - 8)}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500">
                      #{request.order?._id ? request.order._id.substring(request.order._id.length - 8) : "Deleted"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">
                        {request.order?.address?.fullName || "Guest User"}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        ID: {typeof request.user === "object" && request.user !== null ? (request.user._id || request.user.id) : (request.user || "N/A")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        request.requestType === "Refund"
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : request.requestType === "Replace"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {request.requestType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_COLORS[request.status]}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setAdminNotes(request.adminNotes || "");
                        }}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-950 text-lg flex items-center gap-2">
                  <span>Return Request</span>
                  <span className="font-mono text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                    #{selectedRequest._id.substring(selectedRequest._id.length - 8)}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Submitted on {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Type and Status Overview */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-gray-100">
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Request Type</p>
                <p className="font-bold text-gray-900 text-sm">{selectedRequest.requestType}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Current Status</p>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${STATUS_COLORS[selectedRequest.status]}`}>
                  {selectedRequest.status}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-gray-100 text-xs">
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Customer Name</p>
                <p className="font-bold text-gray-900">{selectedRequest.order?.address?.fullName || "Guest User"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">User ID</p>
                <p 
                  className="font-mono text-gray-900 font-bold truncate" 
                  title={typeof selectedRequest.user === "object" && selectedRequest.user !== null ? (selectedRequest.user._id || selectedRequest.user.id) : (selectedRequest.user || "N/A")}
                >
                  {typeof selectedRequest.user === "object" && selectedRequest.user !== null ? (selectedRequest.user._id || selectedRequest.user.id) : (selectedRequest.user || "N/A")}
                </p>
              </div>
            </div>

            {/* Customer Reason */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Reason for Request</span>
              </p>
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-900 leading-relaxed font-medium">
                {selectedRequest.reason}
              </div>
            </div>

            {/* Product items to return */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Affected Products</span>
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedRequest.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product?.images?.[0] || "https://via.placeholder.com/64"}
                        alt={item.product?.name}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-50 border border-gray-200"
                      />
                      <div>
                        <p className="font-bold text-gray-950 text-xs line-clamp-1">
                          {item.product?.name || "Product"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          ID: {item.product?._id || item.product}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-955 text-xs">₹{item.price * item.quantity}</p>
                      <p className="text-[10px] text-gray-400">{item.quantity} Qty</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Admin Notes / Action Response
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                readOnly={user?.role === "admin"}
                placeholder={user?.role === "admin" ? "Only sub-admins can edit response notes." : "Enter details regarding authorization, refund transaction IDs, or return instructions..."}
                className={`w-full p-3 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[70px] ${user?.role === "admin" ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
              />
            </div>

            {/* Actions Panel */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                {user?.role !== "admin" && selectedRequest.status === "Pending" && (
                  <>
                    <button
                      disabled={updatingId}
                      onClick={() => handleUpdateStatus(selectedRequest._id, "Processing")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Set Processing
                    </button>
                    <button
                      disabled={updatingId}
                      onClick={() => handleUpdateStatus(selectedRequest._id, "Approved")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve Request
                    </button>
                    <button
                      disabled={updatingId}
                      onClick={() => handleUpdateStatus(selectedRequest._id, "Rejected")}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </>
                )}

                {user?.role !== "admin" && selectedRequest.status === "Processing" && (
                  <>
                    <button
                      disabled={updatingId}
                      onClick={() => handleUpdateStatus(selectedRequest._id, "Approved")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve Request
                    </button>
                    <button
                      disabled={updatingId}
                      onClick={() => handleUpdateStatus(selectedRequest._id, "Rejected")}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </>
                )}

                {user?.role !== "admin" && selectedRequest.status === "Approved" && (
                  <button
                    disabled={updatingId}
                    onClick={() => handleUpdateStatus(selectedRequest._id, "Completed")}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Completed
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl bg-gray-150 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
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

export default ReturnsPage;
