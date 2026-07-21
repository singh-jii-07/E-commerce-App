const getBaseUrl = (port) => {
  return `http://localhost:${port}/api`;
};

export const API_CONFIG = {
  AUTH_BASE_URL: getBaseUrl(5000),
  ECOMMERCE_BASE_URL: getBaseUrl(5001),
};

export default API_CONFIG;
