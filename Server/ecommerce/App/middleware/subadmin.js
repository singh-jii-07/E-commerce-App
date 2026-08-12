const subadmin = (req, res, next) => {
  if (req.role !== "subAdmin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Sub-admin only.",
    });
  }

  next();
};

export default subadmin;
