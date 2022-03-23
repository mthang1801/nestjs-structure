import { Controller, Get, Res } from '@nestjs/common';
import { StoreService } from 'src/app/services/store.service';
import { BaseController } from '../../../base/base.controllers';

@Controller('/sync/v1/stores')
export class StoreSyncController extends BaseController {
  constructor(private service: StoreService) {
    super();
  }
}
