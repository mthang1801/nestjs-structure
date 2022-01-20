export class User {
  user_id: number;
  status: string;
  user_type: string;
  user_login: string;
  referer: string;
  is_root: string;
  company_id: number;
  last_login: number;
  created_at: Date;
  password: string;
  salt: string;
  firstname: string;
  lastname: string;
  company: string;
  email: string;
  phone: string;
  fax: string;
  url: string;
  tax_exempt: string;
  lang_code: string;
  birthday: Date;
  purchase_timestamp_from: Date;
  purchase_timestamp_to: Date;
  responsible_email: string;
  last_passwords: string;
  password_change_timestamp: number;
  api_key: string;
  janrain_identifier: string;
  verify_token: string;
  verify_token_exp: Date;
  otp: number;
  otp_exp: Date;
}
