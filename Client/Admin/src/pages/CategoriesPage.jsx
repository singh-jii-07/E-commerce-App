import React, { useState, useEffect } from "react";
import categoryService from "../services/categoryService";
import productService from "../services/productService";
import {
  Plus,
  Tags,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  X,
} from "lucide-react";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchCategoriesFromProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts();
      if (res.success && Array.isArray(res.data)) {
        const catMap = new Map();
        res.data.forEach((prod) => {
          if (prod.category) {
            if (typeof prod.category === "object") {
              catMap.set(prod.category._id, prod.category);
            } else {
              catMap.set(prod.category, { _id: prod.category, name: prod.category });
            }
          }
        });
        setCategories(Array.from(catMap.values()));
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesFromProducts();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setSubmitting(true);
    try {
      const res = await categoryService.addCategory(categoryName.trim());
      if (res.success) {
        showFeedback("success", `Category "${res.data?.name || categoryName}" added successfully.`);
        setCategoryName("");
        if (res.data) {
          setCategories((prev) => [...prev, res.data]);
        } else {
          fetchCategoriesFromProducts();
        }
      }
    } catch (err) {
      console.error("Add category error:", err);
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to create category."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Categories</h2>
        <p className="text-xs text-gray-500">Manage grocery product categories</p>
      </div>


      {/* Feedback Banner */}
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

      {/* Form & List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Category Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" /> Add Category
          </h3>

          <form onSubmit={handleAddCategory} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Fresh Vegetables"
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Save Category</span>
            </button>
          </form>
        </div>

        {/* Active Categories Grid */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
            <Tags className="w-4 h-4 text-indigo-600" /> Active Categories ({categories.length})
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-1" />
              <p className="text-xs">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-8">No categories created yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs">
                      {cat.name ? cat.name.charAt(0).toUpperCase() : "C"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-xs">{cat.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">ID: {cat._id}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                    Active
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

export default CategoriesPage;
