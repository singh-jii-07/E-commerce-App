import Faq from "../models/Faq.js";


// =============================
// Create FAQ (Admin)
// =============================

const createFaq = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required.",
      });
    }

    const faq = await Faq.create({
      question,
      answer,
    });

    return res.status(201).json({
      success: true,
      message: "FAQ created successfully.",
      data: faq,
    });
  } catch (error) {
    console.error("CREATE FAQ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getFaqs = async (req, res) => {
  try {
    let faqs;

    if (req.role === "admin") {
      faqs = await Faq.find().sort({ createdAt: -1 });
    } else {
      faqs = await Faq.find({ isActive: true }).sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      total: faqs.length,
      data: faqs,
    });
  } catch (error) {
    console.error("GET FAQ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// =============================
// Update FAQ (Admin)
// =============================
const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, isActive } = req.body;

    const faq = await Faq.findById(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found.",
      });
    }

    if (question !== undefined) faq.question = question;
    if (answer !== undefined) faq.answer = answer;
    if (isActive !== undefined) faq.isActive = isActive;

    await faq.save();

    return res.status(200).json({
      success: true,
      message: "FAQ updated successfully.",
      data: faq,
    });
  } catch (error) {
    console.error("UPDATE FAQ ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// =============================
// Delete FAQ (Admin)
// =============================
const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await Faq.findByIdAndDelete(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "FAQ deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE FAQ ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export {
  createFaq,
  getFaqs,
  updateFaq,
  deleteFaq
};