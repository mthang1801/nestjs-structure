import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  Inject,
} from '@nestjs/common';

import { Table, JoinTable, SortBy } from '../../database/enums/index';

import { UpdateCustomerDTO } from '../dto/customer/update-customer.dto';
import { OrdersRepository } from '../repositories/orders.repository';
import { OrderEntity } from '../entities/orders.entity';
import { OrderDetailsRepository } from '../repositories/orderDetails.repository';
import { OrderDetailsEntity } from '../entities/orderDetails.entity';
import { ProductsRepository } from '../repositories/products.repository';
import { ProductsEntity } from '../entities/products.entity';
import { UserProfileRepository } from '../repositories/userProfile.repository';
import { UserProfileEntity } from '../entities/userProfile.entity';
import { UpdateOrderDto } from '../dto/orders/update-order.dto';
import { CreateOrderDto } from '../dto/orders/create-order.dto';
import { convertOrderDataFromCMSToAppcore } from 'src/constants/order';
import axios from 'axios';
import { UserRepository } from '../repositories/user.repository';
import { UserEntity } from '../entities/user.entity';
import {
  ordersByCustomerFilter,
  orderSearchFilter,
} from 'src/utils/tableConditioner';
import { Like } from 'src/database/operators/operators';
import { StatusRepository } from '../repositories/status.repository';
import { StatusEntity } from '../entities/status.entity';
import { StatusType, CommonStatus } from '../../database/enums/status.enum';
import {
  orderDetailsJoiner,
  orderJoiner,
  productLeftJoiner,
  statusJoiner,
} from '../../utils/joinTable';
import {
  convertOrderDataFromAppcore,
  itgOrderFromAppcore,
  mappingStatusOrder,
} from 'src/utils/integrateFunctions';
import { StoreLocationRepository } from '../repositories/storeLocation.repository';
import { StoreLocationEntity } from '../entities/storeLocation.entity';
import e from 'express';
import { sortBy, get } from 'lodash';
import { ImagesLinksRepository } from '../repositories/imageLink.repository';
import { ImagesLinksEntity } from '../entities/imageLinkEntity';
import { ImagesRepository } from '../repositories/image.repository';
import { ImagesEntity } from '../entities/image.entity';
import { ImageObjectType } from '../../database/enums/tableFieldEnum/imageTypes.enum';

import { LocatorService } from './locator.service';
import { CityRepository } from '../repositories/city.repository';
import { CityEntity } from '../entities/cities.entity';
import { DistrictRepository } from '../repositories/district.repository';
import { DistrictEntity } from '../entities/districts.entity';
import { WardRepository } from '../repositories/ward.repository';
import { WardEntity } from '../entities/wards.entity';
import { CreateOrderAppcoreDto } from '../dto/orders/create-order.appcore.dto';
import { UpdateOrderAppcoreDto } from '../dto/orders/update-order.appcore.dto';
import {
  GET_ORDERS_FROM_APPCORE_API,
  GET_ORDER_BY_ID_FROM_APPCORE_API,
  PUSH_ORDER_TO_APPCORE_API,
} from 'src/constants/api.appcore';
import { generateSHA512, saltHashPassword } from 'src/utils/cipherHelper';
import { defaultPassword } from '../../constants/defaultPassword';
import { UserDataRepository } from '../repositories/userData.repository';
import { UserDataEntity } from '../entities/userData.entity';
import { UserLoyaltyRepository } from '../repositories/userLoyalty.repository';
import { UserLoyaltyEntity } from '../entities/userLoyalty.entity';
import { CustomerService } from './customer.service';
import { CreateOrderFEDto } from '../dto/orders/create-order.frontend.dto';
import { CartRepository } from '../repositories/cart.repository';
import { CartEntity } from '../entities/cart.entity';
import { CartItemRepository } from '../repositories/cartItem.repository';
import { CartItemEntity } from '../entities/cartItem.entity';
import {
  productSearchJoiner,
  cartJoiner,
  productPriceJoiner,
} from '../../utils/joinTable';
import { OrderHistoryRepository } from '../repositories/orderHistory.repository';
import { OrderHistoryEntity } from '../entities/orderHistory.entity';
import {
  formatStandardTimeStamp,
  isNumeric,
  generateRandomString,
} from '../../utils/helper';
import { PromotionService } from './promotion.service';
import { formatOrderTimestamp } from 'src/utils/services/order.helper';
import { CityService } from './city.service';
import { DistrictService } from './district.service';
import { WardService } from './ward.service';
import { CreatePayooPaynowDto } from '../dto/orders/create-payooPaynow.dto';
import { DatabaseService } from '../../database/database.service';
import {
  payooAPIUserName,
  payooAPIPassword,
  payooAPISignature,
  webDomain,
  payooRefer,
  payooShopId,
  payooBusinessName,
  payooShopTitle,
} from '../../constants/payooPayment';
import * as moment from 'moment';
import { payooChecksum } from '../../constants/payooPayment';
import {
  userJoiner,
  cartPaymentJoiner,
  productCategoryJoiner,
} from '../../utils/joinTable';
import { PayCreditFeeType } from '../../database/enums/tableFieldEnum/order.enum';
import { OrderPaymentRepository } from '../repositories/orderPayment.repository';
import { OrderPaymentEntity } from '../entities/orderPayment.entity';
import {
  Not,
  IsNull,
  Between,
  MoreThan,
} from '../../database/operators/operators';
import { OrderStatus, OrderType } from '../../constants/order';
import { ProductsCategoriesRepository } from '../repositories/productsCategories.repository';
import { ProductsCategoriesEntity } from '../entities/productsCategories.entity';
import {
  UPDATE_ORDER_PAYMENT,
  CANCEL_ORDER,
} from '../../constants/api.appcore';
import { CreateOrderSelfTransportDto } from '../dto/orders/create-orderSelfTransport.dto';
import { Equal } from '../../database/operators/operators';
import {
  PaymentStatus,
  calculateInstallmentInterestRateHDSaiGon,
} from '../../utils/services/payment.helper';
import { ShippingFeeService } from './shippingFee.service';
import { ShippingFeeLocationRepository } from '../repositories/shippingFeeLocation.repository';
import { ShippingFeeLocationEntity } from '../entities/shippingFeeLocation.entity';
import {
  shippingFeeLocationsJoiner,
  userPaymentJoiner,
} from '../../utils/joinTable';
import { UserTypeEnum } from '../../database/enums/tableFieldEnum/user.enum';
import { GatewayName, GatewayAppcoreId } from '../../constants/paymentGateway';
import {
  paymentType,
  paymentTypeId,
  loanTenorId,
} from '../../constants/payment.constant';
import { uuid } from '../../utils/cipherHelper';
import { calculateInstallmentInterestRateHomeCredit } from '../../utils/services/payment.helper';
import { ShippingServiceRepository } from '../repositories/shippingsService.repository';
import { ShippingsServiceEntity } from '../entities/shippingsService.entity';
import { ShippingRepository } from '../repositories/shippings.repository';
import { ShippingsEntity } from '../entities/shippings.entity';
import { ClientProxy } from '@nestjs/microservices';
import { CartService } from './cart.service';
import { ProductVariationGroupsRepository } from '../repositories/productVariationGroups.repository';
import { ProductVariationGroupsEntity } from '../entities/productVariationGroups.entity';
import { ProductVariationGroupProductsRepository } from '../repositories/productVariationGroupProducts.entity';
import { ProductVariationGroupProductsEntity } from '../entities/productVariationGroupProducts.entity';
import { PromotionAccessoryRepository } from '../repositories/promotionAccessory.repository';
import { PromotionAccessoryEntity } from '../entities/promotionAccessory.entity';
import { PromotionAccessoryDetailRepository } from '../repositories/promotionAccessoryDetail.repository';
import { PromotionAccessoryDetailEntity } from '../entities/promotionAccessoryDetail.entity';

@Injectable()
export class OrdersService {
  constructor(
    private orderRepo: OrdersRepository<OrderEntity>,
    private orderDetailRepo: OrderDetailsRepository<OrderDetailsEntity>,
    private productRepo: ProductsRepository<ProductsEntity>,
    private userProfileRepo: UserProfileRepository<UserProfileEntity>,
    private userDataRepo: UserDataRepository<UserDataEntity>,
    private userLoyaltyRepo: UserLoyaltyRepository<UserLoyaltyEntity>,
    private userRepo: UserRepository<UserEntity>,
    private statusRepo: StatusRepository<StatusEntity>,
    private storeLocationRepo: StoreLocationRepository<StoreLocationEntity>,
    private imageLinkRepo: ImagesLinksRepository<ImagesLinksEntity>,
    private imageRepo: ImagesRepository<ImagesEntity>,
    private cityRepo: CityRepository<CityEntity>,
    private districtRepo: DistrictRepository<DistrictEntity>,
    private wardRepo: WardRepository<WardEntity>,
    private cartRepo: CartRepository<CartEntity>,
    private cartItemRepo: CartItemRepository<CartItemEntity>,
    private customerService: CustomerService,
    private orderHistoryRepo: OrderHistoryRepository<OrderHistoryEntity>,
    private locatorService: LocatorService,
    private promotionService: PromotionService,
    private cityService: CityService,
    private districtService: DistrictService,
    private wardService: WardService,
    private dbService: DatabaseService,
    private orderPaymentRepo: OrderPaymentRepository<OrderPaymentEntity>,
    private productCategoryRepo: ProductsCategoriesRepository<ProductsCategoriesEntity>,
    private shippingFeeService: ShippingFeeService,
    private shippingFeeLocationRepo: ShippingFeeLocationRepository<ShippingFeeLocationEntity>,
    private shippingServiceRepo: ShippingServiceRepository<ShippingsServiceEntity>,
    private shippingRepo: ShippingRepository<ShippingsEntity>, // @Inject('ORDER_SERVICE') private readonly client: ClientProxy,
    private cartService: CartService,
    private productGroupRepo: ProductVariationGroupsRepository<ProductVariationGroupsEntity>,
    private productGroupProductRepo: ProductVariationGroupProductsRepository<ProductVariationGroupProductsEntity>,
    private promoAccessoryRepo: PromotionAccessoryRepository<PromotionAccessoryEntity>,
    private promoAccessoryDetailRepo: PromotionAccessoryDetailRepository<PromotionAccessoryDetailEntity>,
  ) {}

  async testQueue(data) {
    // await this.client.emit('create-order', data);
  }

  async CMScreate(data) {
    let user: any = await this.userRepo.findById(data.user_id);
    if (!user) {
      user = await this.userRepo.findOne({ phone: data.b_phone });
      // Nếu không có thông tin user thì sẽ tạo mới
      if (!user) {
        user = await this.createCustomer(data);
      }
    }
    if (!user.phone) {
      throw new HttpException('Vui lòng cập nhập số điện thoại', 400);
    }

    if (!user.user_appcore_id) {
      throw new HttpException(
        'Khách hàng này không thể tạo đơn trên hệ thống Appcore, vui lòng liên hệ quản trị viên',
        400,
      );
    }

    let orderData: any = {
      ...data,
      b_lastname: data.b_lastname,
      b_city: data.b_city,
      b_district: data.b_district,
      b_ward: data.b_ward,
      b_address: data.b_address,
      b_phone: data.b_phone,
      s_lastname: data.s_lastname,
      s_city: data.s_city,
      s_district: data.s_district,
      s_ward: data.s_ward,
      s_address: data.s_address,
      s_phone: data.s_phone,
      store_id: data.store_id,
      order_type: data.order_type,
      user_appcore_id: user.user_appcore_id,
      user_id: user.user_id,
      status: OrderStatus.new,
      shipping_cost: data.shipping_cost ? data.shipping_cost : 0,
      pay_credit_type: data.pay_credit_type ? data.pay_credit_type : 1,
      ref_order_id: `${generateRandomString()}a`,
      total: 0,
      subtotal: data.shipping_cost ? +data.shipping_cost : 0,
      created_date: formatStandardTimeStamp(),
      updated_date: formatStandardTimeStamp(),
    };

    if (data.payments && data.payments.length) {
      for (let paymentItem of data.payments) {
        switch (paymentItem.type) {
          case 'COD':
            orderData['prepaid'] =
              data.payment_credit_type == 4 ? 0 : paymentItem.price;
            orderData['installed_prepaid_amount'] =
              data.payment_credit_type == 4 ? paymentItem.price : 0;
            break;
          case 'TRANSFER':
            orderData['transfer_amount'] = paymentItem.price;
            orderData['transfer_bank'] = paymentItem.transfer_bank;
            break;
        }
      }
    }

    for (let orderItem of data.order_items) {
      const productInfo = await this.productRepo.findOne({
        select: `*, ${Table.PRODUCT_PRICES}.*`,
        join: productLeftJoiner,
        where: {
          [`${Table.PRODUCTS}.product_id`]: orderItem.product_id,
          [`${Table.PRODUCTS}.product_type`]: Not(Equal('4')),
        },
      });

      if (productInfo.product_function == 1) {
        throw new HttpException('Không thể dùng SP cha', 401);
      }

      if (!productInfo) {
        throw new HttpException(
          `Không tìm thấy sản phẩm có id ${orderItem.product_id}`,
          404,
        );
      }

      orderData['total'] = +productInfo['price'] * orderItem.amount;
    }

    orderData['subtotal'] = +orderData['subtotal'] + +orderData['total'];

    if (data.coupon_code) {
      let dataCheckCoupon: any = {
        coupon_code: data.coupon_code,
        products: data.order_items.map((orderItem) => ({
          product_id: orderItem.product_id,
          amount: orderItem.amount,
        })),
      };
      const checkCouponCode = await this.promotionService.checkCoupon(
        dataCheckCoupon,
      );
      if (checkCouponCode && checkCouponCode.isValid) {
        orderData['discount'] = +checkCouponCode['discountMoney'];
        orderData['discount_type'] = 1;
        orderData['coupon_code'] = data.coupon_code;
        orderData['subtotal'] =
          +orderData['subtotal'] - +checkCouponCode['discountMoney'];
      }
    }

    let installed_money_account_id;
    let responseData;
    let gatewayName;

    if (data.pay_credit_type == 4 && data.company_id) {
      orderData['pay_credit_type'] = 4;
      orderData['installed_tenor'] = data.installed_tenor;
      orderData['installed_prepaid_amount'] = data.installed_prepaid_amount;
      orderData['installed_interest_rate'] = data.installed_interest_rate;
      orderData['installed_money_amount'] =
        orderData['subtotal'] - data.installed_prepaid_amount;
      orderData['payment_status'] = PaymentStatus.success;

      switch (+data.company_id) {
        case 1:
          installed_money_account_id = GatewayAppcoreId.HD_Saigon;
          gatewayName = GatewayName.HD_Saigon;
          break; //HD Saigon
        case 2:
          installed_money_account_id = GatewayAppcoreId.Home_Credit;
          gatewayName = GatewayName.Home_Credit;
          break; // Home Credit
        case 3:
          installed_money_account_id = GatewayAppcoreId.Shinhan;
          gatewayName = GatewayName.Shinhan;
          break; //Shinhan
        default:
          throw new HttpException('Mã công ty trả góp không đúng', 400);
      }

      orderData['installed_money_account_id'] = installed_money_account_id;
    }

    orderData = this.orderRepo.setData(orderData);

    let result = await this.orderRepo.create(orderData);

    // create order histories
    const orderHistoryData = {
      ...new OrderHistoryEntity(),
      ...result,
      is_sync: 'Y',
    };

    await this.orderHistoryRepo.create(orderHistoryData, false);

    //order payment
    if (data['orderPayment']) {
      const orderPaymentData = {
        ...new OrderPaymentEntity(),
        ...this.orderPaymentRepo.setData(data['orderPayment']),
        order_id: result['order_id'],
      };
      await this.orderPaymentRepo.create(orderPaymentData, false);
    }

    result['order_items'] = [];
    for (let orderItem of data['order_items']) {
      const orderProductItem = await this.productRepo.findOne({
        select: `*, ${Table.PRODUCT_PRICES}.*`,
        join: productLeftJoiner,
        where: { [`${Table.PRODUCTS}.product_id`]: orderItem['product_id'] },
      });

      let orderDetailData = {
        ...new OrderDetailsEntity(),
        ...this.orderDetailRepo.setData({
          ...result,
          ...orderItem,
          product_id: orderProductItem.product_id,
          product_appcore_id: orderProductItem.product_appcore_id,
          price: orderProductItem['price'],
          status: CommonStatus.Active,
        }),
      };

      let newOrderDetail = await this.orderDetailRepo.create(orderDetailData);

      result['order_items'] = [
        ...result['order_items'],
        {
          ...newOrderDetail,
          product_id: newOrderDetail.product_appcore_id,
        },
      ];
    }

    const configPushOrderToAppcore: any = {
      method: 'POST',
      url: PUSH_ORDER_TO_APPCORE_API,
      headers: {
        'Content-Type': 'application/json',
      },
      data: convertOrderDataFromCMSToAppcore(result),
    };

    try {
      const response = await axios(configPushOrderToAppcore);

      const orderAppcoreResponse = response.data.data;
      const updatedOrder = await this.orderRepo.update(
        { order_id: result.order_id },
        {
          order_code: orderAppcoreResponse.orderId,
          is_sync: 'N',
          updated_date: formatStandardTimeStamp(),
        },
        true,
      );

      for (let orderItem of orderAppcoreResponse['orderItemIds']) {
        await this.orderDetailRepo.update(
          {
            order_id: result.order_id,
            product_appcore_id: orderItem.productId,
          },
          { order_item_appcore_id: orderItem.orderItemId },
        );
      }

      result['order_code'] = updatedOrder['order_code'];
      // update order history
      await this.orderHistoryRepo.create(updatedOrder, false);

      if (data.pay_credit_type == 4) {
        await this.orderPaymentRepo.create({
          order_id: result['order_id'],
          order_no: result['ref_order_id'],
          gateway_name: gatewayName,
          amount: +result['subtotal'] + +result['discount'],
        });
      }

      return this.getByOrderCode(updatedOrder.order_code);
    } catch (error) {
      if (error.response.status <= 500 || error.status <= 500) {
        await this.orderRepo.delete({ order_id: result.order_id });
        await this.orderHistoryRepo.delete({ order_id: result.order_id });
        await this.orderDetailRepo.delete({ order_id: result.order_id });
      }
      console.log(error);
      throw new HttpException(
        `Có lỗi xảy ra trong quá trình đưa dữ liệu lên AppCore : ${
          error?.response?.data?.message || error.message
        }`,
        400,
      );
    }
  }

  async createSelfTransport(data: CreateOrderSelfTransportDto, authUser) {
    try {
      let user;
      let cart;

      if (authUser) {
        user = await this.userRepo.findOne({
          user_id: authUser.user_id,
        });

        if (!user.phone) {
          await this.userRepo.update(
            { user_id: authUser.user_id },
            { phone: data.b_phone },
          );
          user = await this.userRepo.findOne({
            select: '*',
            join: userJoiner,
            where: { user_id: authUser.user_id },
          });
          user = await this.customerService.createCustomerToAppcore(user);
        }
        cart = await this.cartRepo.findOne({ user_id: user.user_id });
      } else {
        user = await this.userRepo.findOne({ phone: data.b_phone });
        if (!user) {
          const checkUserAppcore =
            await this.customerService.searchCustomterAppcoreByPhone(
              data.b_phone,
            );

          if (checkUserAppcore) {
            user = await this.customerService.createCustomer(checkUserAppcore);
          } else {
            let userData = {
              phone: data.b_phone,
              email: data.email,
              lastname: data.b_lastname,
              b_lastname: data.b_lastname,
              b_phone: data.b_phone,
            };

            user = await this.customerService.createUserSelfTransport(userData);
          }
        }

        cart = await this.cartRepo.findOne({ user_id: data.user_id });
      }

      if (!cart) {
        throw new HttpException('Không tìm thấy giỏ hàng', 404);
      }
      const cartItems = await this.cartItemRepo.find({
        select: 'product_id, amount',
        where: { cart_id: cart.cart_id },
      });

      if (!cartItems.length) {
        throw new HttpException('Không tìm thấy sản phẩm trong giỏ hàng', 404);
      }
      const userAppcore =
        await this.customerService.searchCustomterAppcoreByPhone(user.phone);

      const sendData = {
        b_address: userAppcore.b_address,
        user_id: user.user_id,
        user_appcore_id: user.user_appcore_id,
        b_phone: data.b_phone,
        b_lastname: data.b_lastname,
        email: data.email || '',
        order_items: cartItems,
        store_id: data.store_id,
        pay_credit_type: 1,
        order_type: data.order_type || OrderType.buyAtStore,
        coupon_code: data.coupon_code || '',
      };
      let result = await this.createOrder(user, sendData);

      if (cart?.cart_id) {
        await this.cartService.clearAll(cart.cart_id);
      }
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, error.status);
    }
  }

  async FEcreate(data: CreateOrderFEDto, userAuth) {
    let user: any;
    if (userAuth) {
      user = await this.userRepo.findOne({ user_id: userAuth.user_id });

      if (!user.phone) {
        throw new HttpException('Vui lòng cập nhập số điện thoại', 400);
      }

      if (!user['user_appcore_id']) {
        user = await this.customerService.searchCustomterAppcoreByPhone(
          user['phone'],
        );

        await this.customerService.createCustomerToAppcore(user);
        user = await this.userRepo.findOne({ user_id: userAuth.user_id });
      }
      if (!user) {
        throw new HttpException(
          'Có lỗi trong quá trình tạo đơn hàng, vui lòng liên hệ quản trị viên',
          400,
        );
      }
    } else {
      user = await this.userRepo.findOne({
        select: '*',
        join: userPaymentJoiner,
        where: { phone: data.s_phone },
      });

      if (!user) {
        const customerCMS =
          await this.customerService.searchCustomterAppcoreByPhone(
            data.s_phone,
          );
        if (customerCMS) {
          user = await this.customerService.createCustomer(customerCMS, false);
        } else {
          let { passwordHash, salt } = saltHashPassword(defaultPassword);
          let userData = {
            ...new UserEntity(),
            lastname: data.s_lastname,
            password: passwordHash,
            phone: data.s_phone,
            salt,
            user_type: UserTypeEnum.Customer,
          };

          let newUser = await this.userRepo.create(userData);

          let userProfileData = {
            ...new UserProfileEntity(),
            b_lastname: data.s_lastname,
            s_lastname: data.s_lastname,
            b_phone: data.s_phone,
            s_phone: data.s_phone,
            b_city: data.s_city,
            s_city: data.s_city,
            b_district: data.s_district,
            s_district: data.s_district,
            b_ward: data.s_ward,
            s_ward: data.s_ward,
            b_address: data.s_address,
            s_address: data.s_address,
            user_id: newUser.user_id,
          };
          await this.userProfileRepo.create(userProfileData, false);

          await this.userLoyaltyRepo.create({
            ...new UserLoyaltyEntity(),
            user_id: newUser.user_id,
          });
          await this.userDataRepo.create({
            ...new UserDataEntity(),
            user_id: newUser.user_id,
          });

          user = await this.userRepo.findOne({
            select: '*',
            join: userPaymentJoiner,
            where: { [`${Table.USERS}.user_id`]: newUser.user_id },
          });

          user = await this.customerService.createCustomerToAppcore(user);
        }
      }
    }

    if (!user['user_appcore_id']) {
      throw new HttpException(
        'Người dùng hiện tại không thể thực hiện tạo đơn hàng, vui lòng liên hệ với nhân viên để được hỗ trợ',
        409,
      );
    }

    const cart = await this.cartRepo.findOne({
      user_id: userAuth ? userAuth.user_id : data.user_id,
    });
    if (!cart) {
      throw new HttpException('Không tìm thấy giỏ hàng', 404);
    }

    let cartItems = await this.cartItemRepo.find({
      select: `*, ${Table.CART_ITEMS}.product_id, ${Table.CART_ITEMS}.amount`,
      join: cartPaymentJoiner,
      where: { [`${Table.CART_ITEMS}.cart_id`]: cart.cart_id },
    });

    let totalPrice = cartItems.reduce(
      (acc, ele) => acc + ele.price * ele.amount,
      0,
    );

    if (!cartItems.length) {
      throw new HttpException('Không tìm thấy sản phẩm trong giỏ hàng', 404);
    }

    let userProfile = await this.userProfileRepo.findOne({
      user_id: user.user_id,
    });

    // await this.createOrder(user, sendData);
    userProfile['s_firstname'] = '';
    userProfile['b_firstname'] = '';
    userProfile['s_lastname'] = data.s_lastname || userProfile['s_lastname'];
    userProfile['s_phone'] = data.s_phone || userProfile['s_phone'];
    userProfile['s_city'] = data.s_city || userProfile['s_city'];
    userProfile['s_district'] = data.s_district || userProfile['s_district'];
    userProfile['s_ward'] = data.s_ward || userProfile['s_ward'];
    userProfile['s_address'] = data.s_address || userProfile['s_address'];
    if (!userProfile['b_lastname']) {
      userProfile['b_lastname'] = data.s_lastname;
    }

    if (Object.entries(userProfile).length) {
      userProfile = await this.userProfileRepo.update(
        { user_id: user.user_id },
        userProfile,
        true,
      );
    }

    const sendData = {
      ...userProfile,
      user_appcore_id: user['user_appcore_id'],
      order_items: cartItems,
    };

    if (data.shipping_fee_location_id) {
      let shippingFeeLocation = await this.shippingFeeLocationRepo.findOne({
        select: '*',
        join: shippingFeeLocationsJoiner,
        where: { shipping_fee_location_id: data.shipping_fee_location_id },
      });
      if (shippingFeeLocation && +totalPrice < +shippingFeeLocation.max_value) {
        sendData['shipping_cost'] = shippingFeeLocation.value_fee;
      }
    }

    const result = await this.createOrder(user, sendData);

    if (cart?.cart_id) {
      await this.cartService.clearAll(cart.cart_id);
    }

    return result;
  }

  async createOrder(user, data, sendToAppcore = true) {
    if (data['store_id']) {
      const checkStore = await this.storeLocationRepo.findOne({
        store_location_id: data['store_id'],
      });
      if (!checkStore) {
        throw new HttpException('Cửa hàng không có trong hệ thống', 400);
      }
    }

    data['utm_source'] = data['utm_source'] || 9;

    const orderData = {
      ...new OrderEntity(),
      ...this.orderRepo.setData(data),
      created_date: formatStandardTimeStamp(),
      updated_date: formatStandardTimeStamp(),
      is_sync: 'Y',
      status: OrderStatus.new,
    };

    if (!user['user_appcore_id']) {
      throw new HttpException('Mã KH tại Appcore không tồn tại.', 400);
    }

    orderData['user_appcore_id'] = user['user_appcore_id'];
    orderData['user_id'] = user['user_id'];

    orderData['total'] = 0;
    for (let orderItem of data.order_items) {
      const productInfo = await this.productRepo.findOne({
        select: `*, ${Table.PRODUCT_PRICES}.*, ${Table.PRODUCTS}.*`,
        join: productLeftJoiner,
        where: {
          [`${Table.PRODUCTS}.product_id`]: orderItem.product_id,
        },
      });

      if (productInfo.product_function == 1) {
        throw new HttpException('Không thể dùng SP cha', 401);
      }

      if (!productInfo) {
        throw new HttpException(
          `Không tìm thấy sản phẩm có id ${orderItem.product_id}`,
          404,
        );
      }

      orderData['total'] +=
        (productInfo['price'] *
          orderItem.amount *
          (100 - productInfo['percentage_discount'])) /
        100;
    }

    orderData['total'] =
      orderData['discount_type'] == 1
        ? orderData['total'] - orderData['discount']
        : (orderData['total'] * (100 - orderData['discount'])) / 100;

    orderData['subtotal'] = +orderData['total'];
    if (data['coupon_code']) {
      //Check coupon
      let checkCouponData = {
        store_id: data['store_id'],
        coupon_code: data['coupon_code'],
        coupon_programing_id: data['coupon_programing_id'],
        phone: data['b_phone'] ? data['b_phone'] : data['s_phone'],
        products: data['order_items'].map(({ product_id, amount }) => ({
          product_id,
          amount,
        })),
      };

      let checkResult = await this.promotionService.checkCoupon(
        checkCouponData,
      );

      if (checkResult['isValid']) {
        orderData['subtotal'] -= +checkResult['discountMoney'];
        orderData['coupon_code'] = data['coupon_code'];
        orderData['discount'] = +checkResult['discountMoney'];
      }
    }

    if (data.shipping_cost) {
      orderData['subtotal'] = +orderData['total'] + +data.shipping_cost;
      orderData['shipping_cost'] = +data.shipping_cost;
    }

    //Check order bill info
    if (!orderData['b_lastname'] && orderData['s_lastname']) {
      orderData['b_lastname'] = orderData['s_lastname'];
    }

    if (!orderData['b_city'] && orderData['s_city']) {
      orderData['b_city'] = orderData['s_city'];
    }

    if (!orderData['b_district'] && orderData['s_district']) {
      orderData['b_district'] = orderData['s_district'];
    }

    if (!orderData['b_ward'] && orderData['s_ward']) {
      orderData['b_ward'] = orderData['s_ward'];
    }

    if (!orderData['b_address'] && orderData['s_address']) {
      orderData['b_address'] = orderData['s_address'];
    }

    //Create order
    let result = await this.orderRepo.create(orderData);

    // create order histories
    const orderHistoryData = {
      ...new OrderHistoryEntity(),
      ...result,
      is_sync: 'Y',
    };
    await this.orderHistoryRepo.create(orderHistoryData, false);

    //order payment
    if (data['orderPayment']) {
      const orderPaymentData = {
        ...new OrderPaymentEntity(),
        ...this.orderPaymentRepo.setData(data['orderPayment']),
        order_id: result['order_id'],
      };
      await this.orderPaymentRepo.create(orderPaymentData, false);
    }

    result['order_items'] = [];
    for (let orderItem of data['order_items']) {
      const orderProductItem = await this.productRepo.findOne({
        select: `*, ${Table.PRODUCT_PRICES}.*, ${Table.PRODUCTS}.*`,
        join: productLeftJoiner,
        where: { [`${Table.PRODUCTS}.product_id`]: orderItem['product_id'] },
      });

      let orderDetailData = {
        ...new OrderDetailsEntity(),
        ...this.orderDetailRepo.setData({
          ...result,
          ...orderItem,
          product_id: orderProductItem.product_id,
          product_appcore_id: orderProductItem.product_appcore_id,
          price: orderProductItem['price'],
          status: CommonStatus.Active,
        }),
      };

      let newOrderDetail = await this.orderDetailRepo.create(orderDetailData);

      result['order_items'].push({
        ...newOrderDetail,
        product_id: newOrderDetail.product_appcore_id,
      });

      if (orderProductItem.free_accessory_id) {
        let giftProducts = await this.findGiftInOrderItem(
          orderProductItem.free_accessory_id,
        );
        if (giftProducts?.length) {
          for (let giftProductItem of giftProducts) {
            let giftOrderDetailData = {
              ...new OrderDetailsEntity(),
              ...this.orderDetailRepo.setData({
                ...result,
                ...giftProductItem,
              }),
              price: giftProductItem.sale_price,
              is_gift_taken: 1,
              amount: 1,
              belong_order_detail_id: orderProductItem.product_appcore_id,
            };

            let newGiftOrderItemDetail = await this.orderDetailRepo.create(
              giftOrderDetailData,
            );
            result['order_items'].push({
              ...newGiftOrderItemDetail,
              product_id: newGiftOrderItemDetail.product_appcore_id,
            });
          }
        }
      }
    }
    console.log(1);
    if (!sendToAppcore) return;

    //============ Push data to Appcore ==================
    const configPushOrderToAppcore: any = {
      method: 'POST',
      url: PUSH_ORDER_TO_APPCORE_API,
      headers: {
        'Content-Type': 'application/json',
      },
      data: convertOrderDataFromCMSToAppcore(result),
    };

    try {
      console.log('call to Appcore', configPushOrderToAppcore);
      const response = await axios(configPushOrderToAppcore);

      const orderAppcoreResponse = response.data.data;
      const updatedOrder = await this.orderRepo.update(
        { order_id: result.order_id },
        {
          order_code: orderAppcoreResponse.orderId,
          is_sync: 'N',
          updated_date: formatStandardTimeStamp(),
        },
        true,
      );

      for (let orderItem of orderAppcoreResponse['orderItemIds']) {
        await this.orderDetailRepo.update(
          {
            order_id: result.order_id,
            product_appcore_id: orderItem.productId,
          },
          { order_item_appcore_id: orderItem.orderItemId },
        );
      }
      // update order history
      await this.orderHistoryRepo.create(updatedOrder, false);
      return this.getByOrderCode(updatedOrder.order_code);
    } catch (error) {
      if (error.response.status <= 500 || error.status <= 500) {
        await this.orderRepo.delete({ order_id: result.order_id });
        await this.orderHistoryRepo.delete({ order_id: result.order_id });
        await this.orderDetailRepo.delete({ order_id: result.order_id });
      }
      console.log(error);
      throw new HttpException(
        `Có lỗi xảy ra: ${error?.response?.data?.message || error.message}`,
        400,
      );
    }
  }

  async updateOrderPayment(order_id, data) {
    const orderPayment = await this.orderPaymentRepo.findOne({ order_id });

    if (orderPayment) {
      let updatedData = this.orderPaymentRepo.setData(data);
      if (Object.entries(updatedData).length) {
        await this.orderPaymentRepo.update({ order_id }, updatedData);
      }
    } else {
      let newData = {
        ...new OrderPaymentEntity(),
        ...this.orderPaymentRepo.setData(data),
        order_id,
      };
      await this.orderPaymentRepo.create(newData);
    }
  }

  async updateAppcoreOrderPayment(order_id, gateway = GatewayName.Payoo) {
    try {
      let orderPayment = await this.orderPaymentRepo.findOne({
        order_id,
      });
      const order = await this.orderRepo.findOne({ order_id });
      if (!order) {
        throw new HttpException('Không tìm thấy đơn hàng', 404);
      }

      let installed_money_account_id;
      switch (gateway) {
        case GatewayName.Momo:
          installed_money_account_id = GatewayAppcoreId.Momo;
          break;
        default:
          installed_money_account_id = GatewayAppcoreId.Payoo;
      }
      const paymentAppcoreData = {
        installmentAccountId: installed_money_account_id,
        installmentCode: orderPayment['order_gateway_id'],
        paymentStatus: 'success',
        totalAmount: +orderPayment['amount'],
      };

      await axios({
        method: 'PUT',
        url: UPDATE_ORDER_PAYMENT(order.order_code),
        data: paymentAppcoreData,
      });

      await this.orderRepo.update(
        { order_id },
        {
          installed_money_account_id,
          installed_money_code: orderPayment['order_gateway_id'],
          status: OrderStatus.purchased,
          payment_status: PaymentStatus.success,
          updated_date: formatStandardTimeStamp(),
        },
      );
    } catch (error) {
      await this.orderRepo.update(
        { order_id },
        {
          status: OrderStatus.invalid,
          reason_fail: error?.response?.data?.message || '',
        },
      );
      console.log(error);
      throw new HttpException('Something went wrong', 409);
    }
  }

  async pushOrderToAppcore(order_id) {
    const order = await this.orderRepo.findOne({ order_id });

    if (!order) {
      throw new HttpException('Không tìm thấy đơn hàng', 404);
    }

    const orderItems = await this.orderDetailRepo.find({ order_id });
    order['order_items'] = [];

    for (let productItem of orderItems) {
      order['order_items'].push({
        ...productItem,
        product_id: productItem.product_appcore_id,
      });
    }

    const configPushOrderToAppcore: any = {
      method: 'POST',
      url: PUSH_ORDER_TO_APPCORE_API,
      headers: {
        'Content-Type': 'application/json',
      },
      data: convertOrderDataFromCMSToAppcore(order),
    };

    try {
      const response = await axios(configPushOrderToAppcore);

      const orderAppcoreResponse = response.data.data;
      const updatedOrder = await this.orderRepo.update(
        { order_id: order_id },
        {
          order_code: orderAppcoreResponse.orderId,
          is_sync: 'N',
          updated_date: formatStandardTimeStamp(),
        },
      );
      for (let orderItem of orderAppcoreResponse['orderItemIds']) {
        await this.orderDetailRepo.update(
          {
            order_id: order_id,
            product_appcore_id: orderItem.productId,
          },
          { order_item_appcore_id: orderItem.orderItemId },
        );
      }
      // update order history
      await this.orderHistoryRepo.create(updatedOrder);
    } catch (error) {
      console.log(error);
      const updatedOrder = await this.orderRepo.update(
        { order_id },
        {
          status: OrderStatus.invalid,
          reason_fail: error?.response?.data?.message,
          updated_date: formatStandardTimeStamp(),
        },
        true,
      );
      await this.orderHistoryRepo.create(updatedOrder);
      throw new HttpException(
        `Có lỗi xảy ra trong quá trình đưa dữ liệu lên AppCore : ${
          error?.response?.data?.message || error.message
        }`,
        400,
      );
    }
  }

  async createCustomer(data) {
    const { passwordHash, salt } = saltHashPassword(defaultPassword);
    const userData = {
      ...new UserEntity(),
      birthday: null,
      firstname: data.b_firstname,
      lastname: data.b_lastname,
      phone: data.b_phone,
      password: passwordHash,
      salt,
      is_sync: 'N',
    };

    let result = await this.userRepo.create(userData);

    const userProfileData = {
      ...new UserProfileEntity(),
      ...this.userProfileRepo.setData(data),
      user_id: result.user_id,
    };
    userProfileData['b_firstname'] = userProfileData['s_firstname'];
    userProfileData['b_lastname'] = userProfileData['b_lastname'];
    userProfileData['b_city'] = userProfileData['s_city'];
    userProfileData['b_district'] = userProfileData['s_district'];
    userProfileData['b_ward'] = userProfileData['s_ward'];

    const newUserProfile = await this.userProfileRepo.create(userProfileData);

    result = { ...result, ...newUserProfile };

    const newUserDataData = {
      ...new UserDataEntity(),
      user_id: result.user_id,
    };

    const newUserData = await this.userDataRepo.create(newUserDataData);

    const newUserLoyaltyData = {
      ...new UserLoyaltyEntity(),
      user_id: result.user_id,
    };

    const newUserLoyalty = await this.userLoyaltyRepo.create(
      newUserLoyaltyData,
    );

    await this.customerService.createCustomerToAppcore(result);

    return this.userRepo.findOne({ user_id: result.user_id });
  }

  async update(order_id: number, data) {
    const order = await this.orderRepo.findById(order_id);

    if (!order) {
      throw new HttpException('Không tìm thấy đơn hàng', 404);
    }

    let result = { ...order };
    const orderData = {
      ...this.orderRepo.setData(data),
      updated_date: formatStandardTimeStamp(),
    };

    if (Object.entries(orderData).length) {
      const updatedOrder = await this.orderRepo.update(
        { order_id: order['order_id'] },
        orderData,
        true,
      );
      result = { ...result, ...updatedOrder };
    }

    if (data?.order_items?.length) {
      for (let orderItem of data.order_items) {
        if (!orderItem.product_id && !orderItem.item_id) continue;

        if (orderItem.item_id) {
          const currentOrderItem = await this.orderDetailRepo.findOne({
            where: [{ item_id: orderItem.item_id }],
          });

          if (
            currentOrderItem &&
            currentOrderItem.order_id == result['order_id']
          ) {
            const orderItemData = this.orderDetailRepo.setData({
              ...orderItem,
              status: 'A',
            });
            if (orderItem.deleted) {
              await this.orderDetailRepo.update(
                { item_id: orderItem.item_id },
                { ...orderItemData, status: 'D' },
              );
            } else {
              if (Object.entries(orderItemData).length) {
                await this.orderDetailRepo.update(
                  { item_id: orderItem.item_id },
                  { ...orderItemData },
                );
              }
            }
          }
        } else {
          const currentOrderItem = await this.orderDetailRepo.findOne({
            product_id: orderItem.product_id,
            order_id: result['order_id'],
          });

          if (currentOrderItem) {
            const orderItemData = this.orderDetailRepo.setData({
              ...orderItem,
              status: 'A',
            });

            if (orderItem.deleted) {
              await this.orderDetailRepo.update(
                { item_id: currentOrderItem.item_id },
                { ...orderItemData, status: 'D' },
              );
            } else {
              if (Object.entries(orderItemData).length) {
                await this.orderDetailRepo.update(
                  { item_id: currentOrderItem.item_id },
                  { ...orderItemData },
                );
              }
            }
            continue;
          }

          const newOrderItemData = {
            ...new OrderDetailsEntity(),
            ...this.orderDetailRepo.setData(orderItem),
            order_id: result['order_id'],
            status: 'A',
          };
          await this.orderDetailRepo.create(newOrderItemData);
        }
      }
    }
  }

  async syncGet() {
    try {
      const response = await axios({
        url: `${GET_ORDERS_FROM_APPCORE_API}?page=10`,
      });
      if (!response) {
        throw new HttpException('không tìm thấy db', 404);
      }
      const ordersData = response?.data?.data;

      if (ordersData) {
        for (let order of ordersData) {
          const itgOrder = itgOrderFromAppcore(order);
          const orderData = {
            ...new OrderEntity(),
            ...this.orderRepo.setData(itgOrder),
          };
          await this.orderRepo.create(orderData, false);

          if (order?.orderItems?.length) {
            for (let orderItem of order.orderItems) {
              const itgOrderItem = {
                ...new OrderDetailsEntity(),
                ...this.orderDetailRepo.setData(orderItem),
              };
              await this.orderDetailRepo.create(itgOrderItem, false);
            }
          }
        }
      }
    } catch (error) {
      throw new HttpException('Có lỗi xảy ra', 422);
    }
  }

  async itgGet(order_code) {
    const order = await this.orderRepo.findOne({ order_code });
    if (!order) {
      throw new HttpException('Không tìm thấy đơn hàng', 404);
    }

    const orderItems = await this.orderDetailRepo.find({
      order_id: order.order_id,
    });
    if (orderItems.length) {
      for (let orderItem of orderItems) {
        const product = await this.productRepo.findOne({
          select: `product`,
          join: productSearchJoiner,
          where: [
            { [`${Table.PRODUCTS}.product_id`]: orderItem.product_id },
            { product_appcore_id: orderItem.product_id },
          ],
        });
        if (product) {
          const productImageLink = await this.imageLinkRepo.findOne({
            object_type: ImageObjectType.PRODUCT,
            object_id: product.product_id,
          });
          if (productImageLink) {
            const productImage = await this.imageRepo.findOne({
              image_id: productImageLink.image_id,
            });
            product['image'] = { ...productImageLink, ...productImage };
          }
        }
        orderItem = { ...orderItem, ...product };
        order['order_items'] = order['order_items']
          ? [...order['order_items'], orderItem]
          : [orderItem];
      }
    }

    return order;
  }

  async itgCreate(data) {
    console.log('itg create Order');
    console.log(data);
    const convertedData = convertOrderDataFromAppcore(data);

    const order = await this.orderRepo.findOne({
      order_code: convertedData.order_code,
    });

    if (order) {
      return this.itgUpdate(data.order_code, { ...data });
    }

    if (convertedData.status) {
      convertedData['status'] = mappingStatusOrder(convertedData['status']);
      if (
        [OrderStatus.success, OrderStatus.purchased].includes(
          +convertedData['status'],
        )
      ) {
        convertedData['payment_status'] = 1;
      }
    }

    if (convertedData['s_lastname'] && !convertedData['s_lastname']) {
      convertedData['s_lastname'] = convertedData['s_lastname'];
    }
    if (convertedData['b_city'] && !convertedData['s_city']) {
      convertedData['s_city'] = convertedData['b_city'];
    }
    if (convertedData['b_district'] && !convertedData['s_district']) {
      convertedData['s_district'] = convertedData['b_district'];
    }
    if (convertedData['b_ward'] && !convertedData['s_ward']) {
      convertedData['s_ward'] = convertedData['b_ward'];
    }
    if (convertedData['b_address'] && !convertedData['s_address']) {
      convertedData['s_address'] = convertedData['b_address'];
    }

    const orderData = {
      ...new OrderEntity(),
      ...this.orderRepo.setData(convertedData),
      is_sync: 'N',
    };

    orderData['total'] = 0;

    if (convertedData['order_items'] && convertedData['order_items'].length) {
      for (let orderItem of convertedData['order_items']) {
        const orderDetail = await this.orderDetailRepo.findOne({
          order_item_appcore_id: orderItem.order_item_appcore_id,
        });
        if (orderDetail) {
          throw new HttpException('Mã chi tiết đơn hàng đã tồn tại', 409);
        }
        orderData['total'] +=
          orderData['discount_type'] == 1
            ? orderItem['price'] * orderItem['amount'] - orderItem['discount']
            : (orderData['price'] *
                orderItem['amount'] *
                (100 - orderItem['discount'])) /
              100;
      }
    }

    const user = await this.userRepo.findOne({
      user_appcore_id: convertedData.user_appcore_id,
    });
    if (user) {
      orderData['user_id'] = user.user_id;
    }

    orderData['subtotal'] = +orderData['total'];
    let result = await this.orderRepo.create(orderData);
    // create order histories

    await this.orderHistoryRepo.create({ ...result }, false);

    if (convertedData['order_items'] && convertedData['order_items'].length) {
      for (let orderItem of convertedData['order_items']) {
        let product = await this.productRepo.findOne({
          product_appcore_id: orderItem['product_id'],
        });

        let orderDetailData = {
          ...new OrderDetailsEntity(),
          ...this.orderDetailRepo.setData({ ...result, ...orderItem }),
          product_appcore_id: orderItem['product_id'],
          product_id: product ? product.product_id : null,
          order_id: result.order_id,
        };

        const newOrderDetail = await this.orderDetailRepo.create(
          orderDetailData,
          false,
        );

        result['order_items'] = result['order_items']
          ? [...result['order_items'], newOrderDetail]
          : [newOrderDetail];
      }
    }
    return result;
  }

  async itgUpdate(order_code: string, data) {
    console.log('itg update');

    const convertedData = convertOrderDataFromAppcore(data);

    const order = await this.orderRepo.findOne({ order_code });
    if (!order) {
      return this.itgCreate({ order_code: +order_code, ...data });
    }

    if (order.s_lastname) {
      delete convertedData['s_lastname'];
    }

    let result = { ...order };

    if (convertedData.status) {
      convertedData['status'] = mappingStatusOrder(convertedData['status']);
      if (
        [OrderStatus.success, OrderStatus.purchased].includes(
          +convertedData['status'],
        )
      ) {
        convertedData['payment_status'] = 1;
      }
    }

    if (order['order_type'] != 2) {
      if (convertedData['s_lastname'] && !order['s_lastname']) {
        convertedData['s_lastname'] = convertedData['s_lastname'];
      }
      if (convertedData['b_city'] && !order['s_city']) {
        convertedData['s_city'] = convertedData['b_city'];
      }
      if (convertedData['b_district'] && !order['s_district']) {
        convertedData['s_district'] = convertedData['b_district'];
      }
      if (convertedData['b_ward'] && !order['s_ward']) {
        convertedData['s_ward'] = convertedData['b_ward'];
      }
      if (convertedData['b_address'] && !order['s_address']) {
        convertedData['s_address'] = convertedData['b_address'];
      }
    }

    const orderData = await this.orderRepo.setData({
      ...convertedData,
      updated_date: formatStandardTimeStamp(new Date(Date.now() + 300 * 1000)),
    });

    if (convertedData.user_appcore_id) {
      const user = await this.userRepo.findOne({
        user_appcore_id: convertedData.user_appcore_id,
      });
      if (user) {
        orderData['user_id'] = user.user_id;
      }
    }

    if (Object.entries(orderData).length) {
      const updatedOrder = await this.orderRepo.update(
        { order_code },
        orderData,
        true,
      );
      result = { ...result, ...updatedOrder };

      // create order histories
      const orderHistoryData = { ...new OrderHistoryEntity(), ...result };
      await this.orderHistoryRepo.create(orderHistoryData, false);
    }

    if (convertedData['installed_money_account_id']) {
      let gatewayName = Object.entries(paymentTypeId).filter(
        ([key, val]) => val == convertedData['installed_money_account_id'],
      )[0][0];
      if (gatewayName) {
        const orderPayment = await this.orderPaymentRepo.findOne({
          order_id: order.order_id,
        });
        if (orderPayment) {
          this.orderPaymentRepo.update(
            { order_id: order.order_id },
            { gateway_name: gatewayName },
          );
        } else {
          await this.orderPaymentRepo.create(
            {
              order_id: order.order_id,
              gateway_name: gatewayName,
              amount: order.installed_payment_per_month || 0,
            },
            false,
          );
        }
      }
    }

    if (convertedData['installed_money_account_id']) {
      let gatewayName = Object.entries(paymentTypeId).filter(
        ([key, val]) => val == convertedData['installed_money_account_id'],
      )[0][0];
      if (gatewayName) {
        const orderPayment = await this.orderPaymentRepo.findOne({
          order_id: order.order_id,
        });
        if (orderPayment) {
          this.orderPaymentRepo.update(
            { order_id: order.order_id },
            { gateway_name: gatewayName },
          );
        } else {
          await this.orderPaymentRepo.create(
            {
              order_id: order.order_id,
              gateway_name: gatewayName,
              amount: order.installed_payment_per_month || 0,
            },
            false,
          );
        }
      }
    }

    const orderItemsList = await this.orderDetailRepo.find({
      select: '*',
      where: { order_id: order.order_id },
    });

    if (convertedData['order_items'] && convertedData['order_items'].length) {
      let willRemoveOrderItems = [];
      let willAddNewOrderItems = [];
      let willUpdateOrderItems = [];
      for (let orderItem of convertedData.order_items) {
        if (
          !orderItemsList.some(
            ({ order_item_appcore_id }) =>
              order_item_appcore_id === orderItem.order_item_appcore_id,
          )
        ) {
          willAddNewOrderItems = [...willAddNewOrderItems, orderItem];
        } else {
          willUpdateOrderItems = [...willUpdateOrderItems, orderItem];
        }
      }
      willRemoveOrderItems = orderItemsList.filter(
        ({ order_item_appcore_id }) =>
          !willUpdateOrderItems.some(
            (orderItem) =>
              orderItem.order_item_appcore_id === order_item_appcore_id,
          ),
      );

      console.log(`will Add:`, willAddNewOrderItems);
      console.log(`will Update:`, willUpdateOrderItems);
      console.log(`will Remove:`, willRemoveOrderItems);

      for (let orderItem of willRemoveOrderItems) {
        await this.orderDetailRepo.delete({
          order_item_appcore_id: orderItem.order_item_appcore_id,
        });
      }

      for (let orderItem of willUpdateOrderItems) {
        await this.orderDetailRepo.update(
          { order_item_appcore_id: orderItem.order_item_appcore_id },
          orderItem,
        );
      }

      for (let orderItem of willAddNewOrderItems) {
        const orderItemData = {
          ...new OrderDetailsEntity(),
          ...this.orderDetailRepo.setData(orderItem),
          product_appcore_id: orderItem['product_id'],
          order_id: order.order_id,
        };
        await this.orderDetailRepo.create(orderItemData, false);
      }

      const updatedOrderItems = await this.orderDetailRepo.find({
        select: '*',
        where: { order_id: order.order_id },
      });

      const total = updatedOrderItems.reduce(
        (acc, ele) =>
          ele['discount_type'] == 1
            ? acc + ele['price'] * ele['amount'] - ele['discount']
            : acc +
              (ele['price'] * ele['amount'] * (100 - ele['discount'])) / 100,
        0,
      );

      let subtotal = +total;
      if (order.shipping_cost != 0) {
        subtotal = +subtotal + +order.shipping_cost;
      }

      await this.orderRepo.update(
        { order_code },
        { total, subtotal, updated_date: formatStandardTimeStamp() },
      );
    }
  }

  async getByPhoneAndId(phone: string, order_code: number) {
    const order = await this.orderRepo.findOne({
      where: [
        { order_code, s_phone: phone },
        { order_code, b_phone: phone },
      ],
    });

    if (!order) {
      throw new HttpException('Không tìm thấy đơn hàng.', 404);
    }

    return this.getOrderDetails(order);
  }

  async getByCustomerId(customer_id: number, params) {
    const customer = await this.userRepo.findOne({ user_id: customer_id });
    if (!customer) {
      throw new HttpException('Không tìm thấy khách hàng.', 404);
    }

    let filterConditions = { user_id: customer_id };
    return this.getOrdersList(params, filterConditions, true);
  }

  async getList(params) {
    return this.getOrdersList(params);
  }

  async getOrdersList(params, filterConditions = {}, showDetails = false) {
    let {
      page,
      limit,
      search,
      shipping_id,
      status,
      payment_status,
      shipping_service_id,
      utm_source,
      store_id,
      created_at_start,
      created_at_end,
      synced,
    } = params;
    page = +page || 1;
    limit = +limit || 10;
    let skip = (page - 1) * limit;

    filterConditions[`${Table.ORDERS}.status`] = MoreThan('0');
    if (synced) {
      filterConditions[`${Table.ORDERS}.order_code`] = Not(IsNull());
    }
    if (shipping_id) {
      filterConditions[`${Table.ORDERS}.shipping_id`] = shipping_id;
    }

    if (status) {
      filterConditions[`${Table.ORDERS}.status`] = status;
    }

    if (payment_status) {
      filterConditions[`${Table.ORDERS}.payment_status`] = payment_status;
    }

    if (shipping_service_id) {
      filterConditions[`${Table.ORDERS}.shipping_service_id`] =
        shipping_service_id;
    }

    if (utm_source) {
      filterConditions[`${Table.ORDERS}.utm_source`] = utm_source;
    }

    if (store_id) {
      filterConditions[`${Table.ORDERS}.store_id`] = store_id;
    }

    if (created_at_start && created_at_end) {
      filterConditions[`${Table.ORDERS}.created_date`] = Between(
        created_at_start,
        created_at_end,
      );
    } else if (created_at_start) {
      filterConditions[`${Table.ORDERS}.created_date`] = created_at_start;
    } else if (created_at_end) {
      filterConditions[`${Table.ORDERS}.created_date`] = created_at_end;
    }

    const ordersList = await this.orderRepo.find({
      select: [
        `DISTINCT(${Table.ORDERS}.order_id), ${Table.ORDER_PAYMENTS}.*,${Table.ORDERS}.*`,
      ],
      join: orderJoiner,
      orderBy: [{ field: `${Table.ORDERS}.updated_date`, sortBy: SortBy.DESC }],
      where: orderSearchFilter(search, filterConditions),
      skip,
      limit,
    });

    // lấy địa chỉ
    for (let orderItem of ordersList) {
      // Case for getting all order items
      if (showDetails) {
        orderItem = await this.getOrderDetails(orderItem);
        continue;
      }
      // Case for getting only order info, not order items
      if (orderItem.store_id) {
        const store = await this.storeLocationRepo.findOne({
          select: ['*'],
          join: {
            [JoinTable.leftJoin]: {
              [Table.STORE_LOCATION_DESCRIPTIONS]: {
                fieldJoin: 'store_location_id',
                rootJoin: 'store_location_id',
              },
            },
          },
          where: {
            [`${Table.STORE_LOCATIONS}.store_location_id`]: orderItem.store_id,
          },
        });
        if (store) {
          orderItem['store'] = store;
        }
      }

      // Lấy thông tin trạng thái đơn hàng
      const status = await this.statusRepo.findOne({
        select: ['*'],
        join: {
          [JoinTable.leftJoin]: statusJoiner,
        },
        where: {
          [`${Table.STATUS}.status_value`]: orderItem.status,
          [`${Table.STATUS}.type`]: StatusType.Order,
        },
      });

      if (status) {
        orderItem['status'] = status;
      }

      // Lấy địa chỉ theo id
      orderItem = await this.convertLocationIdIntoName(orderItem);
    }

    const count = await this.orderRepo.find({
      select: [`DISTINCT(COUNT(${Table.ORDERS}.order_id)) as total`],
      where: orderSearchFilter(search, filterConditions),
    });

    return {
      orders: ordersList,
      paging: {
        currentPage: page,
        pageSize: limit,
        total: count.length ? count[0].total : 0,
      },
    };
  }

  async convertLocationIdIntoName(order) {
    order['b_city'] = isNumeric(order['b_city'])
      ? await this.cityService.get(order['b_city'], true)
      : order['b_city'];
    order['s_city'] = isNumeric(order['s_city'])
      ? await this.cityService.get(order['s_city'], true)
      : order['s_city'];

    order['b_district'] = isNumeric(order['b_district'])
      ? await this.districtService.get(order['b_district'], true)
      : order['b_district'];

    order['s_district'] = isNumeric(order['s_district'])
      ? await this.districtService.get(order['s_district'], true)
      : order['s_district'];

    order['b_ward'] = isNumeric(order['b_ward'])
      ? await this.wardService.get(order['b_ward'], true)
      : order['b_ward'];

    order['s_ward'] = isNumeric(order['s_ward'])
      ? await this.wardService.get(order['s_ward'], true)
      : order['s_ward'];

    return order;
  }

  async getByOrderCode(order_code: number) {
    const order = await this.orderRepo.findOne({
      where: [{ order_code }, { order_id: order_code }],
    });
    if (!order) {
      throw new HttpException('Đơn hàng không tồn tại', 404);
    }
    return this.getOrderDetails(order);
  }

  async getByRefOrderId(ref_order_id: string) {
    const order = await this.orderRepo.findOne({ ref_order_id });
    if (!order) {
      throw new HttpException('Đơn hàng không tồn tại', 404);
    }

    return this.getOrderDetails(order);
  }

  async getOrderDetails(order) {
    if (order.store_id) {
      const store = await this.storeLocationRepo.findOne({
        select: ['*'],
        join: {
          [JoinTable.leftJoin]: {
            [Table.STORE_LOCATION_DESCRIPTIONS]: {
              fieldJoin: 'store_location_id',
              rootJoin: 'store_location_id',
            },
          },
        },
        where: {
          [`${Table.STORE_LOCATIONS}.store_location_id`]: order.store_id,
        },
      });
      if (store) {
        order['store'] = store;
      }
    } else {
      order['store'] = {
        s_cityName: '',
        s_districtName: '',
        s_wardName: '',
        s_address: 'Nhận tại cửa hàng',
      };
    }

    const status = await this.statusRepo.findOne({
      select: ['*'],
      join: {
        [JoinTable.leftJoin]: statusJoiner,
      },
      where: {
        [`${Table.STATUS}.status_value`]: order.status,
        [`${Table.STATUS}.type`]: StatusType.Order,
      },
    });

    if (status) {
      order['status'] = status;
    }

    let orderDetails = await this.orderDetailRepo.find({
      select: `${Table.PRODUCTS}.slug as productSlug, ${Table.PRODUCTS}.thumbnail, ${Table.PRODUCTS}.product_type, ${Table.PRODUCTS}.product_id, ${Table.PRODUCT_DESCRIPTION}.*, ${Table.ORDER_DETAILS}.*`,
      join: orderDetailsJoiner,
      where: {
        [`${Table.ORDER_DETAILS}.order_id`]: order.order_id,
      },
    });

    if (orderDetails.length) {
      let _orderDetails = orderDetails.map(async (orderItem) => {
        if (orderItem.product_type == 3) {
          let group = await this.productGroupRepo.findOne({
            product_root_id: orderItem.product_id,
          });
          if (group) {
            let productItems = await this.productGroupProductRepo.find({
              group_id: group.group_id,
            });
            let comboItems = productItems.filter(
              (productItem) => productItem.product_id != orderItem.product_id,
            );
            orderItem['comboItems'] = [];
            if (comboItems.length) {
              for (let { product_id } of comboItems) {
                let product = await this.productRepo.findOne({
                  select: `*, ${Table.PRODUCTS}.product_id`,
                  join: productLeftJoiner,
                  where: { [`${Table.PRODUCTS}.product_id`]: product_id },
                });
                orderItem['comboItems'].push(product);
              }
            }
          }
        }
        return orderItem;
      });
      orderDetails = await Promise.all(_orderDetails);
    }

    order['shippingService'] = null;
    if (order.shipping_service_id) {
      const shippingService = await this.shippingServiceRepo.findOne({
        service_id: order.shipping_service_id,
      });
      if (shippingService) {
        order['shippingService'] = shippingService;
      }
    }

    order['shippingUnit'] = null;
    if (order.shipping_id) {
      const shippingUnit = await this.shippingRepo.findOne({
        shipping_id: order.shipping_id,
      });
      if (shippingUnit) {
        order['shippingUnit'] = shippingUnit;
      }
    }

    if (order['s_city']) {
      order['s_cityName'] = await this.cityService.get(order['s_city'], true);
    }

    if (order['s_district']) {
      order['s_districtName'] = await this.districtService.get(
        order['s_district'],
        true,
      );
    }

    if (order['s_ward']) {
      order['s_wardName'] = await this.wardService.get(order['s_ward'], true);
    }

    order['order_items'] = orderDetails;

    return formatOrderTimestamp(order);
  }

  async updateOrderStatus(order_code, order_status) {
    const order = await this.orderRepo.findOne({ order_code });
    if (!order) {
      throw new HttpException(
        `Không tìm thấy đơn hàng có mã ${order_code}`,
        404,
      );
    }
    await this.orderRepo.update(
      { order_code },
      { status: order_status, updated_date: formatStandardTimeStamp() },
    );
  }

  async getHistory(order_id: number) {
    return this.orderHistoryRepo.find({
      select: '*',
      where: { order_id },
    });
  }

  async cancelOrder(order_code) {
    try {
      const order = await this.orderRepo.findOne({ order_code });

      if (!order) {
        throw new HttpException('Không tìm thấy đơn hàng', 404);
      }
      if (order['status'] != OrderStatus.new) {
        throw new HttpException('Không thể huỷ đơn hàng', 400);
      }
      await axios({
        method: 'PUT',
        url: CANCEL_ORDER(order_code),
      });

      const updatedOrder = await this.orderRepo.update(
        { order_id: order.order_id },
        {
          status: OrderStatus.cancelled,
          updated_date: formatStandardTimeStamp(),
        },
        true,
      );
      await this.orderHistoryRepo.create(updatedOrder, false);
    } catch (error) {
      console.log(error.response.data);
      throw new HttpException(
        error?.response?.data?.message || error?.message,
        error?.response?.status || error?.status,
      );
    }
  }

  async requestSyncOrders() {
    try {
      const ordersSync = await this.orderRepo.find({
        where: {
          order_code: IsNull(),
          status: Not(Equal(OrderStatus.invalid)),
        },
      });
      let logs = [];
      console.log(ordersSync);
      // if (ordersSync.length) {
      //   for (let orderItem of ordersSync) {
      //     try {
      //       await this.pushOrderToAppcore(orderItem.order_id);
      //     } catch (error) {
      //       logs.push(orderItem.order_id);
      //       const updatedOrder = await this.orderRepo.update(
      //         { order_id: orderItem.order_id },
      //         {
      //           status: OrderStatus.invalid,
      //           reason_fail: error.response,
      //         },
      //         true,
      //       );
      //       await this.orderHistoryRepo.create(updatedOrder, false);
      //     }
      //   }
      // }
      // if (logs.length) {
      //   throw new HttpException(
      //     `Đồng bộ đơn hàng có id ${logs.join(',')} không thành công.`,
      //     422,
      //   );
      // }
      // await this.orderRepo.update(
      //   { order_code: Not(IsNull()) },
      //   { is_sync: 'N' },
      // );
    } catch (error) {
      throw new HttpException(
        error?.response?.data?.message || error?.response,
        error?.response?.status || error.status,
      );
    }
  }

  async findGiftInOrderItem(accessory_id) {
    const promoAccessory = await this.promoAccessoryRepo.findOne({
      accessory_id,
    });
    let result = [];
    if (
      !promoAccessory ||
      promoAccessory.accessory_status !== 'A' ||
      (promoAccessory.display_at &&
        new Date(promoAccessory.display_ay).getTime() > Date.now()) ||
      (promoAccessory.end_at &&
        new Date(promoAccessory.end_at).getTime() < Date.now())
    ) {
      return result;
    }

    return this.promoAccessoryDetailRepo.find({
      accessory_id: promoAccessory.accessory_id,
    });
  }
}
