import { Controller, Post, Body, Res } from '@nestjs/common';
import { BaseController } from '../../../../base/base.controllers';
import { PaymentService } from '../../../services/payment.service';

import { CreatePaynowDto } from '../../../dto/orders/create-paynow.dto';
import { Response } from 'express';
import { IResponse } from 'src/app/interfaces/response.interface';
import { CreateInstallmentDto } from 'src/app/dto/orders/create-installment.dto';
@Controller('fe/v1/payment')
export class PaymentControllerFE extends BaseController {
  constructor(private service: PaymentService) {
    super();
  }
  @Post('payoo/paynow')
  async payooPaymentPaynow(
    @Res() res: Response,
    @Body() data: CreatePaynowDto,
  ): Promise<IResponse> {
    const result = await this.service.payooPaymentPaynow(data);
    return this.responseSuccess(res, result);
  }

  @Post('/payoo/installment')
  async payooPaymentInstallment(
    @Res() res: Response,
    @Body() data: CreateInstallmentDto,
  ) {
    const result = await this.service.payooPaymentInstallment(data);
    return this.responseSuccess(res, result);
  }

  @Post('/installment')
  async paymentInstallment(@Res() res: Response, @Body() data) {
    const result = await this.service.paymentInstallment(data);
    return this.responseSuccess(res, result);
  }
}