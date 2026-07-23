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

export const authService = {
  // Login user
  login: async (credentials) => {
    const response = await axios.post(
      `${API_CONFIG.AUTH_BASE_URL}/user/login`,
      credentials
    );
    return response.data;
  },

  // Register / Sign up user
  register: async (userData) => {
    const response = await axios.post(
      `${API_CONFIG.AUTH_BASE_URL}/user/register`,
      userData
    );
    return response.data;
  },

  // Request forgot password (send OTP)
  forgotPassword: async (data) => {
    const payload = typeof data === 'string' ? { email: data } : data;
    const response = await axios.post(
      `${API_CONFIG.AUTH_BASE_URL}/user/forgot`,
      payload
    );
    return response.data;
  },

  // Verify OTP code
  verifyOtp: async (data) => {
    const response = await axios.post(
      `${API_CONFIG.AUTH_BASE_URL}/user/otp`,
      data
    );
    return response.data;
  },

  // Reset / Change password
  resetPassword: async (data) => {
    const response = await axios.post(
      `${API_CONFIG.AUTH_BASE_URL}/user/changepassword`,
      data
    );
    return response.data;
  },

  // Logout user
  logout: async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return { success: true };
    const response = await axios.post(
      `${API_CONFIG.AUTH_BASE_URL}/user/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  // Get logged-in user profile
  getProfile: async () => {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${API_CONFIG.AUTH_BASE_URL}/user/profile`,
      { headers }
    );
    return response.data;
  },
};

export default authService;
