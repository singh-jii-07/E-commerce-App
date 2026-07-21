import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/apiConfig';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const reviewService = {
  // Get all reviews for a specific product
  getReviewsByProduct: async (productId) => {
    const response = await axios.get(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/review/get/${productId}`
    );
    return response.data;
  },

  // Add a review for a purchased product
  addReview: async ({ product, rating, comment }) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/review/add`,
      { product, rating, comment },
      { headers }
    );
    return response.data;
  },
};

export default reviewService;
