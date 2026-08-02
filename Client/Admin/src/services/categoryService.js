import { ecommerceAxios } from "../api/axiosInstance";

export const categoryService = {
  addCategory: async (name) => {
    const response = await ecommerceAxios.post("/Category/add", { name });
    return response.data;
  },

  getCategories: async () => {
    const response = await ecommerceAxios.get("/Category/get");
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await ecommerceAxios.delete(`/Category/delete/${id}`);
    return response.data;
  },
};

export default categoryService;
