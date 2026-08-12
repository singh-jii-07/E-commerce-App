import { ecommerceAxios } from "../api/axiosInstance";

export const contactService = {
  getContacts: async () => {
    const response = await ecommerceAxios.get("/contact/get");
    return response.data;
  },
};

export default contactService;
