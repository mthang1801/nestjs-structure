import { formatStandardTimeStamp } from '../../utils/helper';
export class RoleEntity {
  role_id: number = 0;
  status: string = 'A';
  role_name: string = '';
  partner_id: number = 0;
  created_at: string = formatStandardTimeStamp();
  updated_at: string = formatStandardTimeStamp();
  created_by: number = 0;
  updated_by: number = 0;
}