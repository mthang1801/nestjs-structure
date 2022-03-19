const CORE_API = 'http://mb.viendidong.com/core-api/v1';

export const UPLOAD_IMAGE_API = `${CORE_API}/files/website`;

export const CREATE_CUSTOMER_API = `${CORE_API}/customers/cms`;

export const GET_CUSTOMERS_API = `${CORE_API}/customers`;

export const PUSH_ORDER_TO_APPCORE_API = `${CORE_API}/orders/cms/create`;

export const GET_ORDERS_FROM_APPCORE_API = `${CORE_API}/orders`;

export const GET_ORDER_BY_ID_FROM_APPCORE_API = (order_id) =>
  `${CORE_API}/orders?id=${order_id}`;

export const GET_PRODUCTS_STORES_API = (product_id) =>
  `${CORE_API}/product-stocks/product/${product_id}`;
