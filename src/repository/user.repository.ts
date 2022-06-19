import { Injectable } from '@nestjs/common';

import { Table } from '../database/enums/tables.enum';
import { UserEntity } from '../entity/user.entity';
import { DatabaseService } from '../database/database.service';
import { BaseRepositorty } from '../base/base.repository';

@Injectable()
export class UserRepository<UserEntity> extends BaseRepositorty<UserEntity> {
  constructor(databaseService: DatabaseService, table: Table) {
    super(databaseService, table);
    this.table = Table.USER;
    this.tableProps = Object.getOwnPropertyNames(new UserEntity());
  }
}
