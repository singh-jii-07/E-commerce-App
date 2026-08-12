import { ecommerceAxios } from "../api/axiosInstance";

export const faqService = {
  getFaqs: async () => {
    const response = await ecommerceAxios.get("/faq/get");
    return response.data;
  },

  createFaq: async (faqData) => {
    const response = await ecommerceAxios.post("/faq/add", faqData);
    return response.data;
  },

  updateFaq: async (id, faqData) => {
    const response = await ecommerceAxios.put(`/faq/update/${id}`, faqData);
    return response.data;
  },

  deleteFaq: async (id) => {
    const response = await ecommerceAxios.delete(`/faq/delete/${id}`);
    return response.data;
  },
};

export default faqService;
