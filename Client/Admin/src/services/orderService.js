import { ecommerceAxios } from "../api/axiosInstance";

export const orderService = {
  getAllOrders: async () => {
    const response = await ecommerceAxios.get("/order/all");
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await ecommerceAxios.get(`/order/getbyid/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, orderStatus) => {
    const response = await ecommerceAxios.put(`/order/update/${id}`, {
      orderStatus,
    });
    return response.data;
  },
};

export default orderService;
