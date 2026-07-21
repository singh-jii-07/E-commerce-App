import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

export const categoryService = {
  // Get all categories from server
  getCategories: async () => {
    try {
      const response = await axios.get(`${API_CONFIG.ECOMMERCE_BASE_URL}/Category/get`);
      return response.data;
    } catch (error) {
      console.log('Error fetching categories:', error?.response?.data || error.message);
      return { success: false, data: [] };
    }
  },
};

export default categoryService;
