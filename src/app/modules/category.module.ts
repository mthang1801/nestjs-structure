import { Module, forwardRef } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CategoryController as CategoryControllerBE } from '../controllers/be/v1/category.controller';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryDescriptionRepository } from '../repositories/categoryDescriptions.repository';
import { CategoryController as CategoryControllerFE } from '../controllers/fe/v1/category.controller';
import { ProductService } from '../services/products.service';
import { ProductsModule } from './products.module';
import { CategoryController as CategoryControllerIntegration } from '../controllers/integration/v1/category.controller';
import { CategorySyncController } from '../controllers/sync/v1/category.controller';
import { CatalogCategoryRepository } from '../repositories/catalogCategory.repository';
import { CatalogCategoryDescriptionRepository } from '../repositories/catalogCategoryDescription.repository';
import { ReviewsCommentsModule } from './reviewsComment.module';
import { AccessoryCategoryRepository } from '../repositories/accessoryCategory.repository';

@Module({
  imports: [forwardRef(() => ProductsModule), ReviewsCommentsModule],
  providers: [
    CategoryService,
    CategoryDescriptionRepository,
    CategoryRepository,
    ProductService,
    CatalogCategoryRepository,
    CatalogCategoryDescriptionRepository,
    AccessoryCategoryRepository,
  ],
  exports: [
    CategoryService,
    CategoryDescriptionRepository,
    CategoryRepository,
    CatalogCategoryRepository,
    CatalogCategoryDescriptionRepository,
    AccessoryCategoryRepository,
  ],
  controllers: [
    CategoryControllerBE,
    CategoryControllerFE,
    CategoryControllerIntegration,
    CategorySyncController,
  ],
})
export class CategoryModule {}
