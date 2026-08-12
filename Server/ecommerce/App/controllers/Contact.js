import Contact from "../models/Contact.js";
import User from "../models/User.js";


// =========================

const createContact = async (req, res) => {
  try {
    const userId = req.userId;
    const { subject, message, name, email, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required.",
      });
    }

    
    let user = await User.findOne({
      authUserId: userId,
    });

    if (!user) {
      user = await User.create({
        authUserId: userId,
      });
    }

    let contactName = name;
    let contactEmail = email;

    
    if ((!contactName || !contactEmail) && req.headers.authorization) {
      try {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:5000";
        const authRes = await fetch(`${authUrl}/api/user/profile`, {
          headers: {
            Authorization: req.headers.authorization,
          },
        });
        const authData = await authRes.json();
        if (authData && authData.success && authData.user) {
          if (!contactName) contactName = authData.user.username;
          if (!contactEmail) contactEmail = authData.user.email;
        }
      } catch (authErr) {
        console.error("Error fetching user details from Auth service:", authErr.message);
      }
    }

  
    contactName = contactName || "User";
    contactEmail = contactEmail || "user@example.com";

    // Generate unique ticket ID
    let ticketId = "TKT-" + Math.floor(100000 + Math.random() * 900000);
    let exists = await Contact.findOne({ ticketId });
    while (exists) {
      ticketId = "TKT-" + Math.floor(100000 + Math.random() * 900000);
      exists = await Contact.findOne({ ticketId });
    }

    // Set priority weight
    let priorityWeight = 1;
    let finalPriority = priority || "Low";
    if (finalPriority === "High") priorityWeight = 3;
    else if (finalPriority === "Medium") priorityWeight = 2;
 
    const contact = await Contact.create({
      user: user._id,
      name: contactName,
      email: contactEmail,
      subject,
      message,
      ticketId,
      priority: finalPriority,
      priorityWeight,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: contact,
    });
  } catch (error) {
    console.error("CREATE CONTACT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

const getAllContacts = async (req, res) => {
  try {
    if (req.role !== "admin" && req.role !== "subAdmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Sub-admin only.",
      });
    }

    let query = {};
    if (req.role === "subAdmin") {
      query.assignedTo = req.userId;
    }

    const contacts = await Contact.find(query).sort({ priorityWeight: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("GET CONTACTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const assignContactSupport = async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { id } = req.params;
    const { subAdminId } = req.body; // Sub-admin authUserId string

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact request not found.",
      });
    }

    contact.assignedTo = subAdminId || null;
    await contact.save();

    return res.status(200).json({
      success: true,
      message: "Sub-admin assigned successfully.",
      data: contact,
    });
  } catch (error) {
    console.error("ASSIGN CONTACT SUPPORT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    if (req.role !== "admin" && req.role !== "subAdmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Sub-admin only.",
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Solved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value.",
      });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact request not found.",
      });
    }

    if (req.role === "subAdmin" && contact.assignedTo !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This ticket is not assigned to you.",
      });
    }

    contact.status = status;
    await contact.save();

    return res.status(200).json({
      success: true,
      message: `Status updated to ${status} successfully.`,
      data: contact,
    });
  } catch (error) {
    console.error("UPDATE CONTACT STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export { createContact, getAllContacts, assignContactSupport, updateContactStatus };
