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

export const addressService = {
  // Get all user addresses
  getAddresses: async () => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_CONFIG.ECOMMERCE_BASE_URL}/address/get`, { headers });
    return response.data;
  },

  // Get single address by ID
  getAddressById: async (id) => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_CONFIG.ECOMMERCE_BASE_URL}/address/get/${id}`, { headers });
    return response.data;
  },

  // Add new address
  addAddress: async (addressData) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/address/add`,
      addressData,
      { headers }
    );
    return response.data;
  },

  // Update existing address
  updateAddress: async (id, addressData) => {
    const headers = await getAuthHeaders();
    const response = await axios.put(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/address/update/${id}`,
      addressData,
      { headers }
    );
    return response.data;
  },

  // Delete address
  deleteAddress: async (id) => {
    const headers = await getAuthHeaders();
    const response = await axios.delete(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/address/delete/${id}`,
      { headers }
    );
    return response.data;
  },

  // Set default address
  setDefaultAddress: async (id) => {
    const headers = await getAuthHeaders();
    const response = await axios.patch(
      `${API_CONFIG.ECOMMERCE_BASE_URL}/address/default/${id}`,
      {},
      { headers }
    );
    return response.data;
  },
};

export default addressService;
