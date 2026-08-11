import React, { useState, useEffect } from "react";
import faqService from "../services/faqService";
import {
  Plus,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Edit,
  Trash2,
} from "lucide-react";

const FaqsPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [editingFaqId, setEditingFaqId] = useState(null);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await faqService.getFaqs();
      if (res.success && Array.isArray(res.data)) {
        setFaqs(res.data);
      }
    } catch (err) {
      console.error("Fetch FAQs error:", err);
      showFeedback("error", "Failed to load FAQs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    setSubmitting(true);
    try {
      if (editingFaqId) {
        // Update mode
        const res = await faqService.updateFaq(editingFaqId, {
          question: question.trim(),
          answer: answer.trim(),
        });
        if (res.success) {
          showFeedback("success", "FAQ updated successfully.");
          setQuestion("");
          setAnswer("");
          setEditingFaqId(null);
          setFaqs((prev) =>
            prev.map((item) => (item._id === editingFaqId ? res.data : item))
          );
        }
      } else {
        // Create mode
        const res = await faqService.createFaq({
          question: question.trim(),
          answer: answer.trim(),
        });
        if (res.success) {
          showFeedback("success", "FAQ added successfully.");
          setQuestion("");
          setAnswer("");
          if (res.data) {
            setFaqs((prev) => [res.data, ...prev]);
          } else {
            fetchFaqs();
          }
        }
      }
    } catch (err) {
      console.error("Save FAQ error:", err);
      showFeedback(
        "error",
        err.response?.data?.message || `Failed to ${editingFaqId ? "update" : "create"} FAQ.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (faq) => {
    setEditingFaqId(faq._id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
  };

  const handleCancelEdit = () => {
    setEditingFaqId(null);
    setQuestion("");
    setAnswer("");
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      const res = await faqService.deleteFaq(id);
      if (res.success) {
        showFeedback("success", "FAQ deleted successfully.");
        setFaqs((prev) => prev.filter((item) => item._id !== id));
        if (editingFaqId === id) {
          handleCancelEdit();
        }
      }
    } catch (err) {
      console.error("Delete FAQ error:", err);
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to delete FAQ."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">FAQs</h2>
        <p className="text-xs text-gray-500">Manage Frequently Asked Questions for customer application</p>
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
        {/* Add/Edit FAQ Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            {editingFaqId ? (
              <>
                <Edit className="w-4 h-4 text-indigo-600" /> Edit FAQ
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-indigo-600" /> Add FAQ
              </>
            )}
          </h3>

          <form onSubmit={handleAddFaq} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Question *
              </label>
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. How do I track my order?"
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Answer *
              </label>
              <textarea
                required
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter details..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : editingFaqId ? (
                  <Edit className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{editingFaqId ? "Update FAQ" : "Save FAQ"}</span>
              </button>

              {editingFaqId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* FAQs List */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
            <HelpCircle className="w-4 h-4 text-indigo-600" /> Active FAQs ({faqs.length})
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-1" />
              <p className="text-xs">Loading FAQs...</p>
            </div>
          ) : faqs.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-8">No FAQs created yet.</p>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq._id}
                  className={`p-4 rounded-lg border space-y-2 transition-colors ${
                    editingFaqId === faq._id
                      ? "bg-indigo-50/30 border-indigo-300 shadow-sm"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      Q
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-xs">{faq.question}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {faq._id}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEditClick(faq)}
                        title="Edit FAQ"
                        className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq._id)}
                        title="Delete FAQ"
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium ml-1">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 pt-2 border-t border-gray-200">
                    <div className="w-7 h-7 rounded bg-gray-200 text-gray-700 border border-gray-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      A
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaqsPage;
