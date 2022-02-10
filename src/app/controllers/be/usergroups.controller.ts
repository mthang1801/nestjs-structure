import {
  Body,
  Controller,
  Get,
  Put,
  Post,
  UseGuards,
  Res,
  Param,
  Delete,
  Query,
} from '@nestjs/common';

import { UserGroupsService } from '../../services/usergroups.service';
import { BaseController } from '../../../base/base.controllers';
import { IResponse } from '../../interfaces/response.interface';
import { AuthGuard } from '../../../middlewares/be.auth';
import { Response } from 'express';
import {
  CreateUserGroupsDto,
  UpdateUserGroupsDto,
} from 'src/app/dto/usergroups/usergroups.dto';

/**
 * User groups controllers
 * @author MvThang
 */
@Controller('/be/v1/usergroups')
export class UsergroupsController extends BaseController {
  constructor(private readonly usersGroupService: UserGroupsService) {
    super();
  }

  /**
   * Create a record in ddv_usergroups and ddv_usergroup_description
   * @param data type : string, usergroup : string, company_id : number, lang_code : string
   * @param res
   * @returns
   */
  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() data: CreateUserGroupsDto,
    @Res() res: Response,
  ): Promise<IResponse> {
    const newUserGroup = await this.usersGroupService.create(data);
    return this.responseSuccess(res, newUserGroup);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getAll(@Res() res: Response, @Query() params): Promise<IResponse> {
    const listUserGroup = await this.usersGroupService.getAll(params);
    return this.responseSuccess(res, listUserGroup);
  }

  /**
   * Get usergroup by usergroup_id
   * @param id
   * @param res
   * @returns
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  async get(@Param('id') id: number, @Res() res: Response): Promise<IResponse> {
    const userGroupRes = await this.usersGroupService.get(id);
    return this.responseSuccess(res, userGroupRes);
  }

  /**
   * Update record by usergroup_id
   * @param id
   * @param data  type : string, usergroup : string, company_id : number, lang_code : string
   * @param res
   * @returns
   */
  @Put(':id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id') id: number,
    @Body() data: UpdateUserGroupsDto,
    @Res() res: Response,
  ): Promise<IResponse> {
    const updatedUserGroup = await this.usersGroupService.update(id, data);
    return this.responseSuccess(res, updatedUserGroup);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(
    @Param('id') id: number,
    @Res() res: Response,
  ): Promise<IResponse> {
    const boolRes = await this.usersGroupService.delete(id);
    return boolRes
      ? this.responseSuccess(res, null, 'Xoá dữ liệu thành công')
      : this.responseNotFound(res, 'Xoá dữ liệu không thành công.');
  }
}