import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth.module';
import { UsersModule } from './users.module';
import { MailModule } from './mail.module';
import { BannerModule } from './banner.module';
import { OrderStatusModule } from './orderStatus.module';
import { PaymentModule } from './payment.module';
import { DatabaseModule } from '../../database/database.module';
import {
  appConfig,
  databaseConfig,
  authConfig,
  mailConfig,
  redisConfig,
} from '../../config/index.config';
import { LoggerModule } from '../../logger/logger.module';
import { StringModule } from './string.module';
import { ObjectModule } from './object.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from '../../middlewares/allExeptionsFilter';
import { RoleModule } from './role.module';
import { CategoryModule } from './category.module';
import { ImageModule } from './image.module';
import { ShippingModule } from './shippings.module';
import { UserRoleModule } from './userRole.module';
import { RoleFunctionModule } from './roleFunction.module';
import { OrdersModule } from './orders.module';
import { ProductsModule } from './products.module';
import { CustomerModule } from './customer.module';
import { ProductFeaturesModule } from './productFeatures.module';
import { StoreModule } from './store.module';
import { UserSystemModule } from './userSystem.module';
import { MulterModule } from '@nestjs/platform-express';
import { LocatorModule } from './locator.module';
import { StatusModule } from './status.module';
import { ProductGroupModule } from './productGroup.module';
import { UploadModule } from './upload.module';
import { CartModule } from './cart.module';
import { StickerModule } from './sticker.module';
import { PromotionAccessoryModule } from './promotionAccessory.module';
import { IndexModule } from './index.module';
import { PromotionModule } from './promotion.module';
import { FlashSaleModule } from './flashSale.module';
import { CityModule } from './city.module';
import { DistrictModule } from './district.module';
import { WardModule } from './ward.module';
import { DashboardModule } from './dashboard.module';
import { ShippingFeeModule } from './shippingFee.module';
import { ReviewsCommentsModule } from './reviewsComment.module';
import { TradeinProgramModule } from './tradeinProgram.module';
import { HomepageConfigModule } from './homepageConfig.module';
import { LogsModule } from './logs.module';
import { PageModule } from './page.module';
import { RedisCacheModule } from './redisCache.module';
import { DiscountProgramModule } from './discountProgram.module';
import { CatalogModule } from './catalog.module';
import { CronModule } from './cron.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, authConfig, mailConfig, redisConfig],
    }),
    MulterModule.registerAsync({
      useFactory: () => ({
        dest: './uploads',
      }),
    }),
    RedisCacheModule,
    CronModule,
    DashboardModule,
    UploadModule,
    AuthModule,
    UsersModule,
    UserSystemModule,
    MailModule,
    DatabaseModule,
    LoggerModule,
    LogsModule,
    BannerModule,
    StringModule,
    ObjectModule,
    RoleModule,
    UserRoleModule,
    RoleFunctionModule,
    CategoryModule,
    OrderStatusModule,
    StatusModule,
    OrdersModule,
    PaymentModule,
    ImageModule,
    ShippingModule,
    ShippingFeeModule,
    ProductsModule,
    CustomerModule,
    ProductFeaturesModule,
    StoreModule,
    LocatorModule,
    ProductGroupModule,
    CartModule,
    StickerModule,
    PromotionAccessoryModule,
    DiscountProgramModule,
    IndexModule,
    PromotionModule,
    FlashSaleModule,
    CityModule,
    DistrictModule,
    WardModule,
    ReviewsCommentsModule,
    TradeinProgramModule,
    HomepageConfigModule,
    PageModule,
    CatalogModule,
    ScheduleModule.forRoot(),
    CronModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
