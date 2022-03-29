import {
  convertNullDatetimeData,
  convertToMySQLDateTime,
  convertToSlug,
  removeVietnameseTones,
} from './helper';

import * as moment from 'moment';
import { UserRepository } from '../app/repositories/user.repository';

export const itgOrderFromAppcore = (cData) => {
  const dataMapping = new Map([
    ['id', 'order_code'],
    ['storeId', 'store_id'],
    ['orderSourceId', 'ref_order_id'],
    ['saleId', 'employee_id'],
    ['saleNote', 'internal_note'],
    ['status', 'status'],
    ['orderType', 'order_type'],
    ['customerId', 'user_appcore_id'],
    ['customerName', 'b_lastname'],
    ['customerName', 's_lastname'],
    ['customerMobile', 'b_phone'],
    ['customerMobile', 's_phone'],
    ['customerAddress', 'b_address'],
    ['customerAddress', 's_address'],
    ['customerNote', 'note'],
    ['discountType', 'discount_type'],
    ['discountAmount', 'discount_amount'],
    ['customerShipFee', 'shipping_cost'],
    ['shipFee', 'shipping_fee'],
    ['transferAmount', 'transfer_amount'],
    ['transferAccountId', 'transfer_account_id'],
    ['transferCode', 'transfer_code'],
    ['transferReferenceCode', 'transfer_ref_code'],
    ['depositAmount', 'disposit_amount'],
    ['cashAccountId', 'cash_account_id'],
    ['creditAmount', 'credit_amount'],
    ['creditAccountId', 'credit_account_id'],
    ['creditCode', 'credit_code'],
    ['creditCardNo', 'credit_card_no'],
    ['installedMoneyAmount', 'installed_money_amount'],
    ['installMoneyAccountId', 'installed_money_account_id'],
    ['installMoneyCode', 'installed_money_code'],
    ['payCreditFeeType', 'pay_credit_type'],
    ['otherFees', 'other_fees'],
    ['creditFeeAcountId', 'credit_account_id'],
    ['totalAmount', 'total'],
    ['codeShip', 'shipping_id'],
    ['deleted', 'status'],
    ['createdAt', 'created_date'],
    ['updatedAt', 'updated_date'],
    ['companyId', 'company_id'],
    ['customerTransferNo', 'transfer_no'],
    ['customerBankName', 'transfer_bank'],
    ['customerIndentifyNo', 'id_card'],
    ['couponCode', 'coupon_code'],
    ['partnerPaymentStatus', 'payment_status'],
    ['promotionId', 'promotion_id'],
  ]);
  let data = {};
  for (let [core, app] of dataMapping) {
    if (core === 'deleted') {
      if (cData[core]) {
        data[app] = 11;
        continue;
      }
    }
    if (core === 'created_at' || core === 'updated_at') {
      if (cData[core]) {
        data[app] = convertToMySQLDateTime(new Date(cData[core]));
        continue;
      }
    }
    data[app] = cData[core];
  }
  return data;
};

export const itgOrderItemFromAppCore = (cData) => {
  const dataMapping = new Map([
    ['id', 'order_item_appcore_id'],
    ['orderId', 'order_id'],
    ['productId', 'product_id'],
    ['productPrice', 'price'],
    ['quantity', 'amount'],
    ['totalAmount', 'amount'],
    ['belongOrderDetailId', 'belong_order_detail_id'],
    ['note', 'note'],
    ['isGiftTaken', 'is_gift_taken'],
    ['deleted', 'status'],
  ]);
  let data = {};
  for (let [core, app] of dataMapping) {
    if (core === 'deleted') {
      data[app] = cData[core] ? 'D' : 'A';
      continue;
    }
    data[app] = cData[core];
  }
  return data;
};

export const itgCustomerFromAppcore = (cData) => {
  const dataMap = new Map([
    ['fullName', 'lastname'],
    ['phoneNo', 'phone'],
    ['gender', 'gender'],
    ['email', 'email'],
    ['dateOfBirth', 'birthday'],
    ['cityName', 'b_city'],
    ['districtName', 'b_district'],
    ['address', 'b_address'],
    ['cityName', 's_city'],
    ['districtName', 's_district'],
    ['address', 's_address'],
    ['createdAt', 'created_at'],
    ['updatedAt', 'updated_at'],
    ['id', 'user_appcore_id'],
    ['type', 'type'],
    ['', 'data'],
    ['avatar', 'image_path'],
  ]);
  let data = {};
  for (let [core, app] of dataMap) {
    if (
      core === 'createdAt' ||
      core === 'updatedAt' ||
      core === 'dateOfBirth'
    ) {
      data[app] = convertToMySQLDateTime(new Date(cData[core]));
      continue;
    }
    if (app === 'data') {
      data[app] = JSON.stringify({
        note: cData['note'],
        totalBuyedAmount: cData['totalBuyedAmount'],
        totalBuyedNo: cData['totalBuyedNo'],
        lastedBuyedAt: cData['lastedBuyedAt'],
        indentifyCardFrontUrl: cData['indentifyCardFrontUrl'],
        indentifyCardBackUrl: cData['indentifyCardBackUrl'],
        indentifyNo: cData['indentifyNo'],
      });
      continue;
    }

    data[app] = cData[core];
  }

  return data;
};

export const itgCreateCustomerFromAppcore = (coreData) => {
  const dataMapping = new Map([
    ['firstname', 'firstname'],
    ['lastname', 'lastname'],
    ['phone', 'phone'],
    ['user_appcore_id', 'user_appcore_id'],
    ['gender', 'gender'],
    ['email', 'email'],
    ['birthday', 'birthday'],
    ['b_city', 'b_city'],
    ['b_district', 'b_district'],
    ['b_ward', 'b_ward'],
    ['b_address', 'b_address'],
    ['address', 'b_address'],
    ['created_at', 'created_at'],
    ['updated_at', 'updated_at'],
    ['type', 'type'],
  ]);
  let cmsData = {};
  for (let [core, cms] of dataMapping) {
    if (core === 'created_at' || core === 'updated_at' || core === 'birthday') {
      cmsData[cms] = convertNullDatetimeData(coreData[core]);
      continue;
    }

    if (core === 'gender') {
      cmsData[cms] = coreData[core] == true ? 1 : 0;
      continue;
    }
    if (core === 'firstname') {
      cmsData['b_firstname'] = coreData[core];
      cmsData['s_firstname'] = coreData[core];
    }
    if (core === 'lastname') {
      cmsData['b_lastname'] = coreData[core];
      cmsData['s_lastname'] = coreData[core];
    }

    if (core === 'b_city') {
      cmsData['s_city'] = coreData[core];
    }
    if (core === 'b_district') {
      cmsData['s_district'] = coreData[core];
    }
    if (core === 'b_ward') {
      cmsData['s_ward'] = coreData[core];
    }
    if (core === 'b_address' && coreData[core]) {
      cmsData['s_address'] = coreData[core];
    }

    if (core === 'address' && coreData[core]) {
      cmsData['s_address'] = coreData[core];
      cmsData['b_address'] = coreData[core];
    }

    if (core === 'phone') {
      cmsData['b_phone'] = coreData[core];
      cmsData['s_phone'] = coreData[core];
    }
    cmsData[cms] = coreData[core];
  }

  cmsData['profile_name'] = `${cmsData['firstname'] || ''} ${
    cmsData['lastname'] || ''
  }`;

  return cmsData;
};

export const itgUpdateCustomerFromAppcore = (coreData) => {
  const dataMapping = new Map([
    ['firstname', 'firstname'],
    ['lastname', 'lastname'],
    ['gender', 'gender'],
    ['email', 'email'],
    ['birthday', 'birthday'],
    ['b_city', 'b_city'],
    ['b_district', 'b_district'],
    ['b_ward', 'b_ward'],
    ['b_address', 'b_address'],
    ['created_at', 'created_at'],
    ['updated_at', 'updated_at'],
    ['address', 'b_address'],
    ['type', 'type'],
  ]);
  let cmsData = {};
  for (let [core, cms] of dataMapping) {
    if (core === 'created_at' || core === 'updated_at' || core === 'birthday') {
      cmsData[cms] = convertNullDatetimeData(coreData[core]);
      continue;
    }

    if (core === 'firstname' && coreData[core]) {
      cmsData['b_firstname'] = coreData[core];
      cmsData['s_firstname'] = coreData[core];
    }
    if (core === 'lastname' && coreData[core]) {
      cmsData['b_lastname'] = coreData[core];
      cmsData['s_lastname'] = coreData[core];
    }

    if (core === 'b_city' && coreData[core]) {
      cmsData['s_city'] = coreData[core];
    }
    if (core === 'b_district' && coreData[core]) {
      cmsData['s_district'] = coreData[core];
    }
    if (core === 'b_ward' && coreData[core]) {
      cmsData['s_ward'] = coreData[core];
    }
    if (core === 'b_address' && coreData[core]) {
      cmsData['s_address'] = coreData[core];
    }

    if (core === 'address' && coreData[core]) {
      cmsData['s_address'] = coreData[core];
      cmsData['b_address'] = coreData[core];
    }

    if (core === 'gender') {
      cmsData[cms] = coreData[core] == true ? 1 : 0;
      continue;
    }

    cmsData[cms] = coreData[core];
  }

  return cmsData;
};

export const itgCustomerToAppcore = (data) => {
  const dataMapping = new Map([
    ['fullName', 'fullName'],
    ['phone', 'phoneNo'],
    ['gender', 'gender'],
    ['email', 'email'],
    ['birthday', 'dateOfBirth'],
    ['b_city', 'cityId'],
    ['b_district', 'districtId'],
    ['b_ward', 'wardId'],
    ['b_address', 'address'],
    ['note', 'note'],
  ]);

  let cData = {};

  for (let [app, core] of dataMapping) {
    if (app === 'fullName') {
      cData[core] = data['b_firstname'] + ' ' + data['b_lastname'];
      continue;
    }
    if (app === 'status') {
      cData[core] = false;
      continue;
    }
    if (app === 'b_city' || app === 'b_district' || app === 'b_ward') {
      cData[core] = +data[app];
      continue;
    }
    if (app === 'email' && data[app]) {
      console.log(data[app]);
      cData[core] = data[app];
      continue;
    }
    if (app === 'birthday' && data[app]) {
      cData[core] = moment(data[app]).format('YYYY-MM-DD');
      continue;
    }
    cData[core] = data[app];
  }

  return cData;
};

export const itgCreateCategoryFromAppcore = (coreData) => {
  const mappingData = new Map([
    ['category_id', 'category_magento_id'],
    ['parent_id', 'parent_magento_id'],
    ['display_at', 'display_at'],
  ]);
  let cmsData = { ...coreData };
  delete cmsData['category_id'];
  delete cmsData['parent_id'];

  for (let [core, cms] of mappingData) {
    if (core === 'display_at') {
      cmsData[cms] = convertToMySQLDateTime(coreData[core]);
      continue;
    }
    cmsData[cms] = coreData[core];
  }
  return cmsData;
};

export const itgConvertProductsFromAppcore = (data) => {
  const mappingData = new Map([
    ['product_id', 'product_appcore_id'],
    ['parent_product_id', 'parent_product_appcore_id'],
    ['category_id', 'category_id'],
    ['product', 'product'],
    ['tax_name', 'tax_name'],
  ]);
  let convertedData = { ...data };
  for (let [fromData, toData] of mappingData) {
    if (fromData === 'category_id') {
      convertedData[toData] = !convertedData[fromData]
        ? 0
        : convertedData[fromData];
      continue;
    }
    if (fromData === 'tax_name' && convertedData[fromData]) {
      convertedData['color'] = convertedData[fromData]
        .split('-')
        .join('')
        .trim();
    }

    if (fromData === 'product' && convertedData[fromData]) {
      convertedData['product_core_name'] = convertedData[fromData];
      convertedData['shortname'] = convertedData[fromData];
      convertedData['short_description'] = convertedData[fromData];
      convertedData['page_title'] = convertedData[fromData];
      convertedData['promo_text'] = convertedData[fromData];
    }

    convertedData[toData] = convertedData[fromData];
  }

  const mappingComboData = new Map([
    ['product_id', 'product_appcore_id'],
    // ['product_combo_id', 'parent_product_appcore_id'],
    ['id', 'other_appcore_id'],
    ['quantity', 'amount'],
  ]);

  if (convertedData['combo_items'] && convertedData['combo_items'].length) {
    for (let convertedDataItem of convertedData['combo_items']) {
      for (let [fromData, toData] of mappingComboData) {
        convertedDataItem[toData] = convertedDataItem[fromData];
        delete convertedDataItem[fromData];
      }
    }
  }

  if (convertedData['product']) {
    convertedData['slug'] = convertToSlug(
      removeVietnameseTones(convertedData['product']),
    );
  }

  delete convertedData['product_id'];
  delete convertedData['parent_product_id'];
  return convertedData;
};

export const convertGetProductsFromAppcore = (appCoreData) => {
  const mappingData = new Map([
    ['id', 'product_appcore_id'],
    ['categoryId', 'category_id'],
    ['parentId', 'parent_product_appcore_id'],
    ['barCode', 'barcode'],
    ['code', 'product_code'],
    ['name', 'product'],
    ['otherName', 'shortname'],
    ['importPrice', 'buy_price'],
    ['oldPrice', 'list_price'],
    ['price', 'price'],
    ['wholesalePrice', 'whole_price'],
    ['images', 'images'],
    ['status', 'status'],
    ['description', 'full_description'],
    ['content', 'promo_text'],
    ['width', 'width'],
    ['height', 'height'],
    ['length', 'length'],
    ['createdDateTime', 'created_at'],
    ['typeId', 'product_type'],
  ]);

  let cmsData = {};
  for (let [appcore, cms] of mappingData) {
    if (appcore === 'status') {
      cmsData[cms] = appCoreData[appcore] === 1 ? 'A' : 'D';
      continue;
    }
    if (appCoreData[appcore] === null) {
      cmsData['cms'] = '';
      continue;
    }
    cmsData[cms] = appCoreData[appcore];
  }

  return cmsData;
};

export const mappingStatusOrder = (coreStatus) => {
  let result;
  switch (+coreStatus) {
    case 2:
      result = '3';
      break;
    case 12:
      result = '3';
      break;
    case 13:
      result = '3';
      break;
    case 14:
      result = '3';
      break;
    case 15:
      result = '3';
      break;
    case 11:
      result = '8';
      break;
    default:
      result = coreStatus;
  }

  return result;
};

export const convertOrderDataFromAppcore = (coreData) => {
  let mappingData = new Map([
    ['b_firstname', 'b_firstname'],
    ['b_lasttname', 'b_lasttname'],
    ['b_phone', 'b_phone'],
    ['b_city', 'b_city'],
    ['b_district', 'b_district'],
    ['b_ward', 'b_ward'],
    ['b_address', 'b_address'],
  ]);
  let cmsData = { ...coreData };
  for (let [core, cms] of mappingData) {
    if (core === 'b_firstname' && coreData[core] && !cmsData['s_firstname']) {
      cmsData['s_firstname'] = coreData[core];
    }
    if (core === 'b_lastname' && coreData[core] && !cmsData['s_lastname']) {
      cmsData['s_lastname'] = coreData[core];
    }
    if (core === 'b_phone' && coreData[core] && !cmsData['s_phone']) {
      cmsData['s_phone'] = coreData[core];
    }
    if (core === 'b_city' && coreData[core] && !cmsData['s_city']) {
      cmsData['s_city'] = coreData[core];
    }
    if (core === 'b_district' && coreData[core] && !cmsData['s_district']) {
      cmsData['s_district'] = coreData[core];
    }
    if (core === 'b_ward' && coreData[core] && !cmsData['s_ward']) {
      cmsData['s_ward'] = coreData[core];
    }
    if (core === 'b_address' && coreData[core] && !cmsData['s_address']) {
      cmsData['s_address'] = coreData[core];
    }
  }

  return cmsData;
};

export const importCustomersFromApocore = (coreData) => {
  const mappingData = new Map([
    ['address', 'b_address'],
    ['city', 'b_city'],
    ['createdAt', 'created_at'],
    ['dateOfBirth', 'birthday'],
    ['district', 'b_district'],
    ['email', 'email'],
    ['fullName', 'firstname'],
    ['gender', 'gender'],
    ['id', 'user_appcore_id'],
    ['lastName', 'lastname'],
    ['note', 'note'],
    ['phoneNo', 'phone'],
    ['totalPoint', 'loyalty_point'],
    ['type', 'type'],
    ['updatedAt', 'updated_at'],
    ['ward', 'b_ward'],
  ]);
  let cmsData = {};
  for (let [core, cms] of mappingData) {
    if (core === 'phoneNo' && coreData[core]) {
      cmsData[cms] = coreData[core];
    }
    if (
      (core === 'address' ||
        core === 'city' ||
        core === 'district' ||
        core === 'ward') &&
      coreData[core]
    ) {
      cmsData[`b_${core}`] = coreData[core];
      cmsData[`s_${core}`] = coreData[core];
      continue;
    }

    if (core === 'phoneNo' && coreData[core]) {
      cmsData[`b_phone`] = coreData[core];
      cmsData[`s_phone`] = coreData[core];
    }

    if (
      (core === 'createdAt' ||
        core === 'updatedAt' ||
        core === 'dateOfBirth') &&
      moment(coreData[core]).isValid
    ) {
      cmsData[cms] = moment(coreData[core]).format('YYYY-MM-DD HH:mm:ss');
      if (cmsData[cms] == 'Invalid date') {
        delete cmsData[cms];
      }
      continue;
    }

    cmsData[cms] = coreData[core];
  }

  return cmsData;
};
