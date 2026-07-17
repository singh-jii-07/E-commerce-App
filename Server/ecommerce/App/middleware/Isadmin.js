const admin = (req, res, next) => {
  if (req.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }

  next();
};

export default admin;