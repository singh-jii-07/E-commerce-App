import Contact from "../models/Contact.js";
import User from "../models/User.js";


// =========================

const createContact = async (req, res) => {
  try {
    const userId = req.userId;
    const { subject, message, name, email } = req.body;

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

 
    const contact = await Contact.create({
      user: user._id,
      name: contactName,
      email: contactEmail,
      subject,
      message,
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
    const contacts = await Contact.find().sort({ createdAt: -1 });

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

export { createContact, getAllContacts };
