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
import { } from '../../interfaces/response.interface';
import { OrdersService } from 'src/app/services/orders.service';
import { AuthGuard } from '../../../middlewares/be.auth';
import { OrderCreateDTO } from 'src/app/dto/orders/create-order.dto';

@Controller('/be/v1/orders')
export class OrderController extends BaseController {
    constructor(private service: OrdersService) {
        super();
    }
    //@UseGuards(AuthGuard)
    @Get()
    async getList(@Res() res, @Param() param): Promise<IResponse> {

        return this.responseSuccess(res, {}, `action return all orders`);
    }
    @Get('/:id')
    async getById(@Res() res, @Param('id') id): Promise<IResponse> {


        return this.responseSuccess(res, {}, `action return orders by id`);
    }
    @Post()
    async create(@Res() res, @Body() body: OrderCreateDTO,
    ): Promise<IResponse> {
        const result = this.service.create(body);
        return this.responseSuccess(res, result, `action create an order`);
    }
    @Put('/:id')
    async update(
        @Res() res,
        @Param('id') id,
        @Body() body: UpdateCustomerDTO,
    ): Promise<IResponse> {

        return this.responseSuccess(res, {}, `action update orders`);
    }
}
