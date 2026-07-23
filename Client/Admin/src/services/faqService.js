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
};

export default faqService;
