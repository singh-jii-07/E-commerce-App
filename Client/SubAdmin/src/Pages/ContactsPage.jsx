import React, { useState, useEffect } from "react";
import contactService from "../services/contactService";
import {
  Mail,
  Loader2,
  Calendar,
  User,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await contactService.getContacts();
      if (res.success && Array.isArray(res.data)) {
        setContacts(res.data);
      }
    } catch (err) {
      console.error("Fetch support contacts error:", err);
      showFeedback("error", "Failed to fetch support messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
  };

  const handleStatusUpdate = async (contactId, status) => {
    try {
      const res = await contactService.updateStatus(contactId, status);
      if (res.success) {
        setContacts((prev) =>
          prev.map((c) => (c._id === contactId ? { ...c, status } : c))
        );
        if (selectedMessage && selectedMessage._id === contactId) {
          setSelectedMessage((prev) => ({ ...prev, status }));
        }
        showFeedback("success", `Ticket marked as ${status}.`);
      }
    } catch (err) {
      console.error("Update status error:", err);
      showFeedback("error", err.response?.data?.message || "Failed to update status.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getStatusBadge = (status) => {
    if (status === "Solved") {
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-955">My Assigned Support</h2>
        <p className="text-xs text-gray-500">View and resolve support tickets assigned to you</p>
      </div>

      {feedback.message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-indigo-600" /> Support Tickets ({contacts.length})
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-1" />
            <p className="text-xs">Loading tickets...</p>
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-8">No assigned support messages.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 uppercase tracking-wider text-[10px] font-semibold border-b border-gray-200">
                  <th className="p-3">Ticket ID</th>
                  <th className="p-3">Customer Info</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Subject / Message</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600">
                {contacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-gray-900">
                      {contact.ticketId || "N/A"}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {contact.name || "Anonymous"}
                      </div>
                      <div className="text-[10px] text-gray-500 ml-5 font-mono">{contact.email}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded border font-semibold text-[10px] ${getPriorityBadge(contact.priority)}`}>
                        {contact.priority || "Low"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded border font-semibold text-[10px] ${getStatusBadge(contact.status)}`}>
                        {contact.status || "Pending"}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <p className="font-bold text-gray-900 truncate">{contact.subject}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{contact.message}</p>
                    </td>
                    <td className="p-3 text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(contact.createdAt)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {contact.status !== "Solved" ? (
                          <button
                            onClick={() => handleStatusUpdate(contact._id, "Solved")}
                            className="py-1 px-2.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] transition-colors border border-emerald-200"
                          >
                            Solve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusUpdate(contact._id, "Pending")}
                            className="py-1 px-2.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[10px] transition-colors border border-amber-200"
                          >
                            Reopen
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedMessage(contact)}
                          className="py-1 px-2.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[10px] transition-colors border border-indigo-200"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedMessage(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" /> Ticket Details
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Ticket ID / Status</p>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedMessage.ticketId || "N/A"}</p>
                  <div className="flex gap-1.5 mt-1">
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${getPriorityBadge(selectedMessage.priority)}`}>
                      {selectedMessage.priority || "Low"}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${getStatusBadge(selectedMessage.status)}`}>
                      {selectedMessage.status || "Pending"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">From / Date</p>
                  <p className="font-bold text-gray-800 mt-0.5">{selectedMessage.name || "Anonymous"}</p>
                  <p className="text-gray-500 font-mono text-[10px]">{selectedMessage.email}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Subject</p>
                <p className="font-bold text-gray-900 text-xs mt-0.5">{selectedMessage.subject}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Message</p>
                <p className="text-xs text-gray-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line mt-1">
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <div className="flex gap-2">
                {selectedMessage.status !== "Solved" ? (
                  <button
                    onClick={() => handleStatusUpdate(selectedMessage._id, "Solved")}
                    className="py-1.5 px-3 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 transition-colors"
                  >
                    Mark Solved
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusUpdate(selectedMessage._id, "Pending")}
                    className="py-1.5 px-3 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs border border-amber-200 transition-colors"
                  >
                    Reopen Ticket
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="py-1.5 px-4 rounded bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs transition-colors shadow-sm"
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

// Lucide X Icon import fallback
const X = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default ContactsPage;
