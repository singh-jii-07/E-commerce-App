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

export const paymentService = {
  // Create Razorpay Order
  createRazorpayOrder: async (orderId) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/payment/create`,
      { orderId },
      { headers }
    );
    return response.data;
  },

  // Verify Razorpay Payment
  verifyPayment: async (paymentData) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/payment/verify`,
      paymentData,
      { headers }
    );
    return response.data;
  },
};

export default paymentService;
