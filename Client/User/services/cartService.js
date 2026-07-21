import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/apiConfig';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const cartService = {
  // Add item to cart
  addToCart: async (productId, quantity = 1) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/cart/add`,
      { product: productId, quantity },
      { headers }
    );
    return response.data;
  },

  // Get user cart items
  getMyCart: async () => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_CONFIG.ECOMMERCE_BASE_URL}/cart/get`, {
      headers,
    });
    return response.data;
  },

  // Remove item from cart
  deleteCartItem: async (id) => {
    const headers = await getAuthHeaders();
    const response = await axios.delete(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/cart/delete/${id}`,
      { headers }
    );
    return response.data;
  },
};

export default cartService;
