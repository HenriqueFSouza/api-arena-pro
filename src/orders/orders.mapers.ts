import { Client, Order, Product } from "@prisma/client";

interface OrderWithClientsAndItems extends Order {
    clients: { client: Client, id: string }[];
    items: { product: Product, id: string }[];
}

export const ordersMapper = (orders: OrderWithClientsAndItems[] | OrderWithClientsAndItems) => {
    if (Array.isArray(orders)) {
        return orders.map((order) => {
            return orderMapper(order);
        });
    }
    return orderMapper(orders);
}

const orderMapper = (order: OrderWithClientsAndItems) => {
    const isOrderClient = order.clients.length > 0;
    const clients = isOrderClient ? { ...order.clients[0].client, orderClientId: order.clients[0].id } : order.clientsData[0];

    delete order.clientsData;
    return {
        ...order,
        clients: [clients],
        items: order.items.map((item) => ({
            ...item,
            product: {
                // Optional chaining used to prevent errors from deleted products, it was fixed, but I left it here for now
                id: item.product?.id || null,
                name: item.product?.name || null,
                price: item.product?.price || null,
                categoryId: item.product?.categoryId || null,
            },
        })),
    }
}