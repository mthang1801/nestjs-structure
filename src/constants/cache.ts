export const cacheKeys = {
  catalog: (queryParameters = '') => `catalog${queryParameters}`,
  banner: (bannerId) => `banner-${bannerId}`,
  banners: (params) => `banners${params}`,
  productByCategorySlug: (categorySlug) => `cat-${categorySlug}`,
  flashSaleFE: `flash-sale-fe`,
  category: (categoryId) => `category-${categoryId}`,
  categories: (params) => `categories${params}`,
  categoryLevel: (level) => `categories-level-${level}`,
  product: (productId) => `product-${productId}`,
  products: (params) => `products${params}`,
  bannerLocations: `banner-locations`,
  bannerTargets: (params) => `banner-targets${params}`,
  carts: (params) => `carts${params}`,
  cart: (id) => `cart-${id}`,
};

export const cacheTables = {
  category: 'Category',
  product: 'Product',
  productFeature: 'Product Feature',
  sticker: 'Sticker',
  banner: 'Banner',
  cart: 'Cart',
};

export const prefixCacheKey = {
  categories: 'categories',
  categoriesLevel: 'categories-level',
  products: 'products',
  category: 'category',
  banner: 'banner',
  bannerId: 'banner',
  productId: 'product',
  banners: 'banners',
  bannerTargets: 'banner-targets',
  cart: 'cart',
  carts: 'carts',
};
