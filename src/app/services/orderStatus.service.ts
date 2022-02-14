import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { OrderStatusEntity } from '../entities/orderStatus.entity';
import { OrderStatusRepository } from '../repositories/orderStatus.repository';

import { Table, JoinTable } from '../../database/enums/index';
import { OrderStatusDescriptionRepository } from '../repositories/orderStatusDescription.repository';
import { OrderStatusDataRepository } from '../repositories/orderStatusData.repository';
import { OrderStatusDescriptionEntity } from '../entities/orderStatusDescription.entity';
import { OrderStatusDataEntity } from '../entities/orderStatusData.entity';
import { Like } from 'typeorm';
import { OrderStatusCreateDTO } from '../dto/orderStatus/create-orderStatus.dto';

@Injectable()
export class OrderStatusService{
  constructor(
    private repository: OrderStatusRepository<OrderStatusEntity>,
    
    private orderStatusDescriptionRepo: OrderStatusDescriptionRepository<OrderStatusDescriptionEntity>,
    private orderStatusDataRepo: OrderStatusDataRepository<OrderStatusDataEntity>,
  ) {

  }
  async getList(params) {
    //=====Filter param
    let { page, limit, ...others } = params;
    page = +page || 1;
    limit = +limit || 9999;
    let skip = (page - 1) * limit;

    let filterCondition = {};
    if (others && typeof others === 'object' && Object.entries(others).length) {
      for (let [key, val] of Object.entries(others)) {
        if (this.repository.tableProps.includes(key)) {
          filterCondition[`${Table.ORDER_STATUS}.${key}`] = Like(val);
        } else {
          filterCondition[`${Table.ORDER_STATUS_DESCRIPTION}.${key}`] =
            Like(val);
        }
      }
    }
    //===
    const orders = this.repository.find({
      select: ['*'],
      join: {
        [JoinTable.join]: {
          ddv_status_descriptions: {
            fieldJoin: 'status_id',
            rootJoin: 'status_id',
          },
        },
      },

      skip: skip,
      limit: limit,
    });
    const orderData = this.orderStatusDataRepo.find({
      select: ['*'],
      skip: 0,
      limit: 9999,
    });
    const result = await Promise.all([orderData, orders]);
    let _order = [];
    result[1].forEach((ele) => {
      _order.push({
        ...ele,
        data: result[0].filter((img) => img.status_id == ele.status_id),
      });
    });
    return _order;
  }
  async getById(id) {
    const string = `${Table.ORDER_STATUS}.status_id`;
    const string1 = `${Table.ORDER_STATUS_DATA}.status_id`;
    const orders = this.repository.findOne({
      select: ['*'],
      join: {
        [JoinTable.join]: {
          ddv_status_descriptions: {
            fieldJoin: 'status_id',
            rootJoin: 'status_id',
          },
        },
      },
      where: { [string]: +id },
      skip: 0,
      limit: 30,
    });
    const orderData = this.orderStatusDataRepo.find({
      select: ['*'],
      where: { [string1]: id },

      skip: 0,
      limit: 30,
    });
    const result = await Promise.all([orderData, orders]);
    return { ...result[1], data: result[0] };
  }
  async create(data: OrderStatusCreateDTO) {
    //====Check if exist

    const check = await this.repository.findOne({
      where: { status: data.status, type: data.type },
    });

    if (check && typeof check === 'object' && Object.keys(check).length != 0) {
      throw new HttpException('Status and Type bị trùng', 422);
    }
    ///==========================|Add to ddv_statuses table|==============
    const orderStatusData = {
      ...this.repository.setData(data),
    };

    let _orderStatus = await this.repository.create(orderStatusData);
    ///==========================|Add to ddv_status_data table|==============

    const orderStatusDataData = {
      status_id: _orderStatus.status_id,
      ...this.orderStatusDataRepo.setData(data),
    };

    let _orderStatusData = await this.orderStatusDataRepo.create(
      orderStatusDataData,
    );
    ///==========================|Add to ddv_status_data table|==============

    const orderStatusDataDes = {
      status_id: _orderStatus.status_id,
      ...this.orderStatusDescriptionRepo.setData(data),
    };

    let _orderStatusDes = await this.orderStatusDescriptionRepo.create(
      orderStatusDataDes,
    );
    return _orderStatus;
  }
  async update(id, data) {
    //=== check if data changes ?====
    const changed = await this.repository.findOne({ where: { status_id: id } });
    if (!(changed.status === data.status && changed.type === data.type)) {
      //====Check if exist
      const check = await this.repository.findOne({
        where: { status: data.status, type: data.type },
      });
      if (
        check &&
        typeof check === 'object' &&
        Object.keys(check).length != 0
      ) {
        throw new HttpException('Status and Type bị trùng', 422);
      }
    }

    ///==========================|Add to ddv_statuses table|==============

    const orderStatusData = {
      ...this.repository.setData(data),
    };
    let _orderStatus = await this.repository.update(id, orderStatusData);

    ///==========================|Add to ddv_status_data table|==============

    const orderStatusDataData = {
      status_id: id,
      ...this.orderStatusDataRepo.setData(data),
    };

    let _orderStatusData = await this.orderStatusDataRepo.update(
      id,
      orderStatusDataData,
    );
    ///==========================|Add to ddv_status_data table|==============

    const orderStatusDataDes = {
      status_id: id,
      ...this.orderStatusDescriptionRepo.setData(data),
    };

    let _orderStatusDes = await this.orderStatusDescriptionRepo.update(
      id,
      orderStatusDataDes,
    );
    return orderStatusData;
  }
}
