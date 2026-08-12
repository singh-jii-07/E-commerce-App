import { authAxios } from "../api/axiosInstance";

export const authService = {
  login: async (email, password) => {
    const response = await authAxios.post("/user/login", { email, password });
    if (response.data.success && response.data.user?.role !== "admin") {
      throw new Error("Access denied. Admin privileges required.");
    }
    return response.data;
  },

  logout: async () => {
    const response = await authAxios.post("/user/logout");
    return response.data;
  },

  getProfile: async () => {
    const response = await authAxios.get("/user/profile");
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await authAxios.post("/user/forgot", { email });
    return response.data;
  },

  verifyOtp: async (email, otp) => {
    const response = await authAxios.post("/user/otp", { email, otp });
    return response.data;
  },

  resetPassword: async (email, newPassword, confirmPassword) => {
    const response = await authAxios.post("/user/changepassword", {
      email,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },
};

export default authService;
