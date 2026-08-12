import { ecommerceAxios } from "../api/axiosInstance";

export const productService = {
  getProducts: async () => {
    const response = await ecommerceAxios.get("/product/get");
    return response.data;
  },

  getProductById: async (id) => {
    const response = await ecommerceAxios.get(`/product/get/${id}`);
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await ecommerceAxios.post("/product/add", productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await ecommerceAxios.put(`/product/update/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await ecommerceAxios.delete(`/product/delete/${id}`);
    return response.data;
  },
};

export default productService;
