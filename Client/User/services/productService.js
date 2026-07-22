import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

export const productService = {
  // Get all products
  getProducts: async () => {
    try {
      const response = await axios.get(`${API_CONFIG.ECOMMERCE_BASE_URL}/product/get`);
      return response.data;
    } catch (error) {
      console.log('Error fetching products:', error?.response?.data || error.message);
      return { success: false, data: [] };
    }
  },

  // Get single product by ID
  getProductById: async (id) => {
    try {
      const response = await axios.get(`${API_CONFIG.ECOMMERCE_BASE_URL}/product/get/${id}`);
      return response.data;
    } catch (error) {
      console.log(`Error fetching product ${id}:`, error?.response?.data || error.message);
      return { success: false, data: null };
    }
  },
};

export default productService;
