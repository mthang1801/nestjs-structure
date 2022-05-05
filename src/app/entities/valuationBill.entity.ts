import { formatStandardTimeStamp } from '../../utils/helper';
export class ValuationBillEntity {
  valuation_bill_id: number = 0;
  appcore_id: number = null;
  status: string = 'A';
  type: number = 1;
  store_id: number = null;
  store_name: string = null;
  is_sync: string = 'Y';
  customer_phone: string = '';
  customer_name: string = '';
  tradein_program_id: number = null;
  collect_price: number = 0;
  criteria_price: number = 0;
  estimate_price: number = 0;
  final_price: number = 0;
  product_id: number = null;
  imei: string = null;
  note: string = '';
  handle_by: number = null;
  created_at: string = formatStandardTimeStamp();
  updated_at: string = formatStandardTimeStamp();
  created_by: number = 0;
  updated_by: number = 0;
}
