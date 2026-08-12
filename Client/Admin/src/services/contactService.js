import { ecommerceAxios } from "../api/axiosInstance";

export const contactService = {
  getContacts: async () => {
    const response = await ecommerceAxios.get("/contact/get");
    return response.data;
  },
  assignSupport: async (id, subAdminId) => {
    const response = await ecommerceAxios.put(`/contact/assign/${id}`, { subAdminId });
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await ecommerceAxios.put(`/contact/status/${id}`, { status });
    return response.data;
  },
};

export default contactService;
