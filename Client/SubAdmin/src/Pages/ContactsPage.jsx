import React, { useState, useEffect } from "react";
import contactService from "../services/contactService";
import {
  Mail,
  Loader2,
  Calendar,
  User,
  MessageSquare,
} from "lucide-react";

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await contactService.getContacts();
      if (res.success && Array.isArray(res.data)) {
        setContacts(res.data);
      }
    } catch (err) {
      console.error("Fetch contacts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Customer Messages</h2>
        <p className="text-xs text-gray-500">View and respond to inquiries submitted via the Contact Us form</p>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-indigo-600" /> Incoming Messages ({contacts.length})
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-1" />
            <p className="text-xs">Loading messages...</p>
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-8">No customer messages received yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 uppercase tracking-wider text-[10px] font-semibold border-b border-gray-200">
                  <th className="p-3">Customer Info</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Message Preview</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600">
                {contacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {contact.name || "Anonymous"}
                      </div>
                      <div className="text-[10px] text-gray-500 ml-5 font-mono">{contact.email}</div>
                    </td>
                    <td className="p-3 font-medium text-gray-900">{contact.subject}</td>
                    <td className="p-3 max-w-xs truncate">{contact.message}</td>
                    <td className="p-3 text-gray-500 flex items-center gap-1 mt-1 border-none">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="p-3 text-right border-none">
                      <button
                        onClick={() => setSelectedMessage(contact)}
                        className="py-1 px-2.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[10px] shadow-sm transition-colors"
                      >
                        View Message
                      </button>
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
              <MessageSquare className="w-5 h-5 text-indigo-600" /> Message Details
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">From</p>
                  <p className="font-bold text-gray-800 mt-0.5">{selectedMessage.name || "Anonymous"}</p>
                  <p className="text-gray-500 font-mono text-[10px]">{selectedMessage.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Submitted On</p>
                  <p className="font-medium text-gray-800 mt-1">{formatDate(selectedMessage.createdAt)}</p>
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

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="py-1.5 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs transition-colors shadow-sm"
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
