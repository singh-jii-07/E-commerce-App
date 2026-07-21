import React, { useState, useEffect } from "react";
import userService from "../services/userService";
import {
  Users,
  Search,
  ShieldCheck,
  User,
  Calendar,
  Mail,
  Loader2,
  AlertCircle,
  Eye,
  X,
} from "lucide-react";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await userService.getAllUsers();
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
      } else {
        setError(res.message || "Failed to fetch users.");
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.response?.data?.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Users</h2>
        <p className="text-xs text-gray-500">Registered user and administrator accounts</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
          <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">No Users Found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Registered Date</th>
                  <th className="px-4 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{u.username}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200 inline-flex items-center gap-1">
                          <User className="w-3 h-3" /> Customer
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
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

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl w-full max-w-sm p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-900 text-base">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p><span className="font-semibold text-gray-700">Username:</span> {selectedUser.username}</p>
              <p><span className="font-semibold text-gray-700">Email:</span> {selectedUser.email}</p>
              <p><span className="font-semibold text-gray-700">Role:</span> {selectedUser.role}</p>
              <p><span className="font-semibold text-gray-700">User ID:</span> <code className="bg-gray-100 px-1 py-0.5 rounded">{selectedUser._id}</code></p>
              <p><span className="font-semibold text-gray-700">Created:</span> {new Date(selectedUser.createdAt).toLocaleString()}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-200">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
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

export default UsersPage;
