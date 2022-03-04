import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Res,
} from '@nestjs/common';
import { BaseController } from '../../../base/base.controllers';
import { IResponse } from '../../interfaces/response.interface';
import { UpdateCustomerDTO } from 'src/app/dto/customer/update-customer.dto';
import {} from '../../interfaces/response.interface';
import { OrdersService } from 'src/app/services/orders.service';
import { AuthGuard } from '../../../middlewares/be.auth';

import { UpdateOrderDto } from 'src/app/dto/orders/update-order.dto';
import { CreateOrderDto } from 'src/app/dto/orders/create-order.dto';

@Controller('/be/v1/orders')
export class OrderController extends BaseController {
  constructor(private service: OrdersService) {
    super();
  }

  @Post()
  async create(@Res() res, @Body() body: CreateOrderDto): Promise<IResponse> {
    const { result, message } = await this.service.create(body);
    return this.responseSuccess(res, result, message);
  }
  @Put('/:id')
  async update(
    @Res() res,
    @Param('id') id,
    @Body() body: UpdateOrderDto,
  ): Promise<IResponse> {
    const result = await this.service.update(id, body);
    return this.responseSuccess(res, result, `Cập nhật thành công.`);
  }
}
