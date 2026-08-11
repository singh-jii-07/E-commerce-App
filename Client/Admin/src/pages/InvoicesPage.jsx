import React, { useState, useEffect } from "react";
import orderService from "../services/orderService";
import { FileText, Search, Loader2, Download, Calendar } from "lucide-react";

const InvoicesPage = () => {
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
      console.error("Fetch invoices error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const searchLower = search.toLowerCase();
    const invoiceId = `INV-${o._id.slice(-6).toUpperCase()}`;
    return (
      invoiceId.toLowerCase().includes(searchLower) ||
      o._id.toLowerCase().includes(searchLower) ||
      o.address?.fullName?.toLowerCase().includes(searchLower)
    );
  });

  const handleDownloadInvoice = (orderId) => {
    const token = localStorage.getItem("admin_token");
    const backendUrl = "http://localhost:5001";
    window.open(`${backendUrl}/api/order/invoice/${orderId}?token=${token}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
        <p className="text-xs text-gray-500">Generate, view, and print legal customer invoices and receipts</p>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Invoice ID, Order ID, customer..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm">Loading invoices...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
          <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">No Invoices Found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Invoice ID</th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Invoice Date</th>
                  <th className="px-4 py-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((o) => {
                  const invoiceId = `INV-${o._id.slice(-6).toUpperCase()}`;
                  return (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                        {invoiceId}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-gray-500">
                        #{o._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {o.address?.fullName || "N/A"}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        ₹{o.totalAmount}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                          o.paymentStatus === "Paid" || (o.orderStatus === "Delivered" && o.paymentMethod === "COD")
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}>
                          {o.paymentStatus === "Paid" || (o.orderStatus === "Delivered" && o.paymentMethod === "COD") ? "Paid" : o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDownloadInvoice(o._id)}
                          title="View / Download PDF Invoice"
                          className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1 font-semibold text-[11px]"
                        >
                          <Download className="w-4 h-4" /> Download
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
    </div>
  );
};

export default InvoicesPage;
