import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ProductService } from 'src/app/services/products.service';
import { BaseController } from '../../../../base/base.controllers';
import { CreateProductDto } from '../../../dto/product/create-product.dto';
import { IResponse } from '../../../interfaces/response.interface';
import { Response } from 'express';
@Controller('fe/v1/products')
export class ProductsController extends BaseController {
  constructor(private service: ProductService) {
    super();
  }

  @Get('/search')
  async searchList(@Query() params, @Res() res: Response): Promise<IResponse> {
    const result = await this.service.searchList(params);
    return this.responseSuccess(res, result);
  }

  @Get(':slug')
  async get(
    @Param('slug') slug: string,
    @Res() res: Response,
  ): Promise<IResponse> {
    const result = await this.service.getBySlug(slug);
    return this.responseSuccess(res, result);
  }

  @Get('/:id/products-stores')
  async getProductsStores(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<IResponse> {
    const result = await this.service.getProductsStores(id);
    return this.responseSuccess(res, result);
  }

  @Get()
  async getList(@Query() params, @Res() res: Response): Promise<IResponse> {
    const result = await this.service.getListFE(params);
    return this.responseSuccess(res, result);
  }
}