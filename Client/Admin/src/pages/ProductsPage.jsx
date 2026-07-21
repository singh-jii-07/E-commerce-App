import React, { useState, useEffect } from "react";
import productService from "../services/productService";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

const UNITS = ["Kg", "Gram", "Piece", "Litre"];

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    unit: "Kg",
    images: "",
    isAvailable: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts();
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error("Fetch products error:", err);
      showFeedback("error", "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
  };

  const uniqueCategories = Array.from(
    new Map(
      products
        .filter((p) => p.category)
        .map((p) => [typeof p.category === "object" ? p.category._id : p.category, p.category])
    ).values()
  );

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: uniqueCategories[0] ? (typeof uniqueCategories[0] === "object" ? uniqueCategories[0]._id : uniqueCategories[0]) : "",
      stock: "",
      unit: "Kg",
      images: "",
      isAvailable: true,
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || "",
      description: prod.description || "",
      price: prod.price || "",
      category: typeof prod.category === "object" ? prod.category._id : prod.category || "",
      stock: prod.stock || "",
      unit: prod.unit || "Kg",
      images: Array.isArray(prod.images) ? prod.images.join(", ") : "",
      isAvailable: prod.isAvailable ?? true,
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        stock: Number(formData.stock),
        unit: formData.unit,
        images: formData.images
          .split(",")
          .map((img) => img.trim())
          .filter(Boolean),
        isAvailable: formData.isAvailable,
      };

      if (!payload.category) {
        showFeedback("error", "Category is required.");
        setSubmitting(false);
        return;
      }

      if (editingProduct) {
        const res = await productService.updateProduct(editingProduct._id, payload);
        if (res.success) {
          showFeedback("success", "Product updated.");
          setEditingProduct(null);
          fetchProducts();
        }
      } else {
        const res = await productService.createProduct(payload);
        if (res.success) {
          showFeedback("success", "Product added.");
          setIsAddOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      console.error("Save product error:", err);
      showFeedback("error", err.response?.data?.message || "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setSubmitting(true);
    try {
      const res = await productService.deleteProduct(deletingProduct._id);
      if (res.success) {
        showFeedback("success", "Product deleted.");
        setDeletingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      console.error("Delete product error:", err);
      showFeedback("error", err.response?.data?.message || "Failed to delete product.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const categoryId = typeof p.category === "object" ? p.category._id : p.category;
    const matchesCategory =
      selectedCategoryFilter === "ALL" || categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Products</h2>
          <p className="text-xs text-gray-500">Manage catalog products and stock levels</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
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

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {uniqueCategories.map((cat) => {
              const id = typeof cat === "object" ? cat._id : cat;
              const name = typeof cat === "object" ? cat.name : id;
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
          <p className="font-semibold text-gray-900">No Products Found</p>
          <p className="text-xs mt-1">Try adjusting filters or add a product.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price / Unit</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((prod) => {
                  const categoryName =
                    typeof prod.category === "object" ? prod.category?.name : "N/A";
                  return (
                    <tr key={prod._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images?.[0] || "https://via.placeholder.com/40"}
                            alt={prod.name}
                            className="w-10 h-10 rounded object-cover bg-gray-100 border border-gray-200 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-gray-900 text-xs">{prod.name}</p>
                            <p className="text-[11px] text-gray-500 line-clamp-1 max-w-xs">
                              {prod.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {categoryName}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        ₹{prod.price} <span className="font-normal text-gray-500">/ {prod.unit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-medium px-2 py-0.5 rounded border ${
                            prod.stock <= 5
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {prod.stock} left
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {prod.isAvailable ? (
                          <span className="text-green-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Available
                          </span>
                        ) : (
                          <span className="text-red-600 font-semibold inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Unavailable
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(prod)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAddOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl w-full max-w-lg p-5 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-900 text-base">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Fresh Bananas"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Item details..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {uniqueCategories.map((cat) => {
                      const id = typeof cat === "object" ? cat._id : cat;
                      const name = typeof cat === "object" ? cat.name : id;
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Image URLs (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {editingProduct && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isAvailable" className="text-xs font-medium text-gray-700">
                    Product Available for Orders
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl w-full max-w-sm p-5 shadow-lg space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">Delete Product</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{deletingProduct.name}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={submitting}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
