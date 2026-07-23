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

export const faqService = {
  getFaqs: async () => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_CONFIG.ECOMMERCE_BASE_URL}/faq/get`, { headers });
    return response.data;
  },
};

export default faqService;
