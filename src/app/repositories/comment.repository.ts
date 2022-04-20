import { BaseRepositorty } from '../../base/base.repository';
import { DatabaseService } from '../../database/database.service';
import { Table } from '../../database/enums/index';
import { CommentEntity } from '../entities/comment.entity';
export class CommentRepository<
  CommentEntity,
> extends BaseRepositorty<CommentEntity> {
  constructor(databaseService: DatabaseService, table: Table) {
    super(databaseService, table);
    this.table = Table.COMMENTS;
    this.tableProps = Object.getOwnPropertyNames(new CommentEntity());
  }
}