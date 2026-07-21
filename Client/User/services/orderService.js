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

export const orderService = {
  // Get logged-in user's orders
  getMyOrders: async () => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_CONFIG.ECOMMERCE_BASE_URL}/order/get`, {
      headers,
    });
    return response.data;
  },

  // Get order details by ID
  getOrderById: async (id) => {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/order/getbyid/${id}`,
      { headers }
    );
    return response.data;
  },

  // Create a new order
  createOrder: async (orderData) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/order/create`,
      orderData,
      { headers }
    );
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    const headers = await getAuthHeaders();
    const response = await axios.delete(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/order/cancel/${orderId}`,
      { headers }
    );
    return response.data;
  },
};

export default orderService;
