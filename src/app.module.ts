import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, databaseConfig, queueConfig } from './config/index.config';
import { DatabaseModule } from './database/database.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { UserRepository } from './repositories/user.repository';
import { OrderRepository } from './repositories/order.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { RpcModulle } from './microservices/rabbitMQ/rpc/rpc.module';
import { NamedConnectionModule } from './microservices/rabbitMQ/named-connection/named-connection.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, queueConfig],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RpcModulle,
    NamedConnectionModule,
  ],
  providers: [AppService, UserRepository, OrderRepository, String],
  controllers: [AppController],
})
export class AppModule {}
