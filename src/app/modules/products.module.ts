import { Module } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { ProductService } from '../services/products.service';
import { ProductDescriptionsRepository } from '../repositories/productDescriptions.respository';
import { ProductPointPriceRepository } from '../repositories/productPointPrice.repository';
import { ProductOptionsInventoryRepository } from '../repositories/productOptionsInventory.repository';
import { ProductFeatureValueRepository } from '../repositories/productFeaturesValues.repository';
import { ProductOptionsRepository } from '../repositories/productOptions.repository';
import { ProductOptionDescriptionRepository } from '../repositories/productOptionsDescriptions.repository';
import { ProductOptionVariantsRepository } from '../repositories/productOptionVariants.repository';
import { ProductOptionVariantDescriptionRepository } from '../repositories/productOptionsVariantsDescriptions.respository';
import { ProductsController as ProductsControllerBE } from '../controllers/be/products.controller';
import { ProductPricesRepository } from '../repositories/productPrices.repository';
import { ProductSalesRepository } from '../repositories/productSales.repository';
import { ProductVariationGroupsRepository } from '../repositories/productVariationGroups.repository';
import { ProductVariationGroupProductsRepository } from '../repositories/productVariationGroupProducts.entity';
import { ProductVariationGroupFeaturesRepository } from '../repositories/productVariationGroupFeatures.repository';
import { CategoryModule } from './category.module';
import { ProductsCategoriesRepository } from '../repositories/productsCategories.repository';
import { ProductsController as ProductsControllerFE } from '../controllers/fe/product.controller';

@Module({
  imports: [CategoryModule],
  providers: [
    ProductService,
    ProductsRepository,
    ProductDescriptionsRepository,
    ProductPointPriceRepository,
    ProductOptionsInventoryRepository,
    ProductFeatureValueRepository,
    ProductOptionsRepository,
    ProductOptionDescriptionRepository,
    ProductOptionVariantsRepository,
    ProductOptionVariantDescriptionRepository,
    ProductPricesRepository,
    ProductSalesRepository,
    ProductVariationGroupsRepository,
    ProductVariationGroupProductsRepository,
    ProductVariationGroupFeaturesRepository,
    ProductsCategoriesRepository,
  ],
  exports: [
    ProductService,
    ProductsRepository,
    ProductDescriptionsRepository,
    ProductPointPriceRepository,
    ProductOptionsInventoryRepository,
    ProductFeatureValueRepository,
    ProductOptionsRepository,
    ProductOptionDescriptionRepository,
    ProductOptionVariantsRepository,
    ProductOptionVariantDescriptionRepository,
    ProductPricesRepository,
    ProductSalesRepository,
    ProductVariationGroupsRepository,
    ProductVariationGroupProductsRepository,
    ProductVariationGroupFeaturesRepository,
    ProductsCategoriesRepository,
  ],
  controllers: [ProductsControllerBE, ProductsControllerFE],
})
export class ProductsModule {}
