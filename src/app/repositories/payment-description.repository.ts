import { BaseRepositorty } from '../../base/base.repository';
import { DatabaseService } from '../../database/database.service';
import { Table } from '../../database/enums/index';
import { paymentDescriptionsEntity } from '../entities/payment-description.entity';
export class PaymentDescriptionsRepository<paymentDescriptionsEntity> extends BaseRepositorty<paymentDescriptionsEntity> {
    constructor(databaseService: DatabaseService, table: Table) {
        super(databaseService, table);
        this.table = Table.PAYMENT_DESCRIPTION;
        this.tableProps = Object.getOwnPropertyNames(new paymentDescriptionsEntity());

    }
}