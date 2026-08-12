import React, { useState, useEffect } from "react";
import { ecommerceAxios } from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import {
  Star,
  Search,
  MessageSquare,
  Loader2,
  Calendar,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

const ReviewsPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRating, setSelectedRating] = useState("ALL");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await ecommerceAxios.get("/review/all");
      if (res.data.success && Array.isArray(res.data.data)) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.error("Fetch reviews error:", err);
      showFeedback("error", "Failed to fetch reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
  };

  // Helper to render stars
  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  // Metrics
  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0";
  const positiveReviews = reviews.filter((r) => r.rating >= 4).length;

  const filteredReviews = reviews.filter((rev) => {
    const matchesRating = selectedRating === "ALL" || rev.rating === Number(selectedRating);
    const matchesSearch =
      (rev.product?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (rev.userId || rev.user || "").toLowerCase().includes(search.toLowerCase()) ||
      (rev.comment || "").toLowerCase().includes(search.toLowerCase());
    return matchesRating && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-955 tracking-tight">Product Reviews</h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitor and manage customer ratings, suggestions, and feedback comments.
          </p>
        </div>
      </div>

      {/* Feedback alerts */}
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Reviews</p>
            <h3 className="text-3xl font-extrabold text-gray-955 mt-1">{totalReviews}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Positive Feedback</p>
            <h3 className="text-3xl font-extrabold text-gray-955 mt-1">
              {totalReviews ? `${Math.round((positiveReviews / totalReviews) * 100)}%` : "0%"}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["ALL", "5", "4", "3", "2", "1"].map((star) => (
            <button
              key={star}
              onClick={() => setSelectedRating(star)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedRating === star
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {star === "ALL" ? "All Stars" : `${star} Star`}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Product name, User ID, or comment..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm">Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
          <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">No Reviews Found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Customer (User ID)</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Comment / Feedback</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReviews.map((rev) => (
                  <tr key={rev._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={rev.product?.images?.[0] || "https://via.placeholder.com/64"}
                          alt={rev.product?.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-200"
                        />
                        <div>
                          <p className="font-bold text-gray-950 text-xs line-clamp-1">
                            {rev.product?.name || "Deleted Product"}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            ID: {rev.product?._id || rev.product || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 truncate max-w-[200px]" title={rev.userId || rev.user}>
                        {rev.userId || rev.user || "N/A"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-gray-950 text-xs">{rev.rating}.0</span>
                        {renderStars(rev.rating)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-sm">
                      <p className="line-clamp-2 leading-relaxed">{rev.comment || <span className="text-gray-400 italic">No comment provided</span>}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
