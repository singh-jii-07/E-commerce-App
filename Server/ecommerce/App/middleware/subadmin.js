const subadmin = (req, res, next) => {
  if (req.role !== "subAdmin" && req.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Sub-admin or Admin only.",
    });
  }

  next();
};

export default subadmin;
