const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5000";

const getAllUsers = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const response = await fetch(`${AUTH_SERVICE_URL}/api/user/all`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("GET ALL USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    const response = await fetch(`${AUTH_SERVICE_URL}/api/user/find/${id}`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("GET USER BY ID ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export {
  getAllUsers,
  getUserById,
};