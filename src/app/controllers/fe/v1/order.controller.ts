import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  Post,
  Req,
} from '@nestjs/common';
import { IResponse } from 'src/app/interfaces/response.interface';
import { OrdersService } from 'src/app/services/orders.service';
import { BaseController } from '../../../../base/base.controllers';
import { Response } from 'express';
import { CreateOrderDto } from 'src/app/dto/orders/create-order.dto';
import { Body } from '@nestjs/common';
import { AuthGuard } from 'src/middlewares/fe.auth';
import { CreateOrderFEDto } from 'src/app/dto/orders/create-order.frontend.dto';
@Controller('/fe/v1/orders')
export class OrdersController extends BaseController {
  constructor(private service: OrdersService) {
    super();
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Res() res,
    @Body() data: CreateOrderFEDto,
    @Req() req,
  ): Promise<IResponse> {
    const result = await this.service.FEcreate(data, req.user);
    return this.responseSuccess(res, result, 'Tạo thành công');
  }

  @Get()
  async get(
    @Query('phone') phone: string,
    @Query('order_code') order_code: number,
    @Res() res: Response,
  ): Promise<IResponse> {
    const result = await this.service.getByPhoneAndId(phone, order_code);
    return this.responseSuccess(res, result);
  }

  @Get('/customers/:customer_id')
  async getByCustomerId(
    @Query() params,
    @Param('customer_id') customer_id: number,
    @Res() res: Response,
  ): Promise<IResponse> {
    const result = await this.service.getByCustomerId(customer_id, params);
    return this.responseSuccess(res, result);
  }

  @Get('/:order_id/order-details')
  async getOrderDetails(
    @Param('order_id') order_id: number,
    @Res() res: Response,
  ): Promise<IResponse> {
    const result = await this.service.getOrderDetails(order_id);
    return this.responseSuccess(res, result);
  }

  @Get('/:order_code')
  async getByOrderCode(
    @Res() res,
    @Param('order_code') order_code: number,
  ): Promise<IResponse> {
    const result = await this.service.getByOrderCode(order_code);
    return this.responseSuccess(res, result);
  }
}