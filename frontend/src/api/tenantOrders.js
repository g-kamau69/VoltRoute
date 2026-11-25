import api from "./client.js";
const BASE_URL = "/tenant/orders";

export async function getOrders(params = {}, signal){
    const response = await api.get(`${BASE_URL}`, { params, signal });
    return response.data;
}

export async function getOrderSummary(signal){
    const response = await api.get(`${BASE_URL}/summary`, { signal });
    return response.data;
}

export async function getOrder(orderId){
    const response = await api.get(`${BASE_URL}/${orderId}`);
    return response.data;
}

export async function createOrder(payload){
    const response = await api.post(`${BASE_URL}`, payload);
    return response.data;
}

export async function updateOrder(orderId, payload){
    const response = await api.patch(`${BASE_URL}/${orderId}`, payload);
    return response.data;
}

export async function cancelOrder(orderId){
    const response = await api.delete(`${BASE_URL}/${orderId}`);
    return response.data;
}

export function getOrderError(error){
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)){
        return detail
            .map((item) => {
                const field = item.loc?.slice(1).join(".");

                return field
                    ? `${field}: ${item.msg}`
                    : item.msg;
            })
            .join(";");
    }
    return error.message || "Unable to complete the request.";
}