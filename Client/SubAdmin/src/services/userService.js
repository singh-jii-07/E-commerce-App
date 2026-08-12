import { ecommerceAxios } from "../api/axiosInstance";

export const userService = {
  getAllUsers: async () => {
    const response = await ecommerceAxios.get("/adminuser/getuser");
    return response.data;
  },

  getUserById: async (id) => {
    const response = await ecommerceAxios.get(`/adminuser/getUserById/${id}`);
    return response.data;
  },
};

export default userService;
