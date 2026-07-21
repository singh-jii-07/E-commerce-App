import { ecommerceAxios } from "../api/axiosInstance";

export const categoryService = {
  addCategory: async (name) => {
    const response = await ecommerceAxios.post("/Category/add", { name });
    return response.data;
  },
};

export default categoryService;
