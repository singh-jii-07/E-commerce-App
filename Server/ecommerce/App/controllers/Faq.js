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



export {
  createFaq,
  getFaqs
};