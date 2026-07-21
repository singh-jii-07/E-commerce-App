import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

export const productService = {
  // Get all products from server
  getProducts: async () => {
    const response = await axios.get(`${API_CONFIG.ECOMMERCE_BASE_URL}/product/get`);
    return response.data;
  },

  // Get single product by ID
  getProductById: async (id) => {
    const response = await axios.get(`${API_CONFIG.ECOMMERCE_BASE_URL}/product/get/${id}`);
    return response.data;
  },
};

export default productService;
