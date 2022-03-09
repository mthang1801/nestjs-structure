import { Injectable } from '@nestjs/common';
import { CityEntity } from '../entities/cities.entity';
import { DistrictEntity } from '../entities/districts.entity';
import { WardEntity } from '../entities/wards.entity';
import { CityRepository } from '../repositories/city.repository';
import { DistrictRepository } from '../repositories/district.repository';
import { WardRepository } from '../repositories/ward.repository';
import { wardsData } from '../../database/constant/wards';

import { Like } from '../../database/find-options/operators';

@Injectable()
export class LocatorService {
  constructor(
    private cityRepo: CityRepository<CityEntity>,
    private districtRepo: DistrictRepository<DistrictEntity>,
    private wardRepo: WardRepository<WardEntity>,
  ) {}

  async sync() {
    let data: any = wardsData;

    for (let item of data) {
      const objData = this.wardRepo.setData(item);

      await this.wardRepo.createSync(objData);
    }
  }

  async getCitiesList(search) {
    let citiesList = search
      ? await this.cityRepo.find({
          select: 'id, city_name',
          where: { city_name: Like(search) },
        })
      : await this.cityRepo.find({ select: 'id, city_name' });

    return citiesList;
  }

  async getDistrictsList(city_id, search) {
    let districtsList = search
      ? await this.districtRepo.find({
          select: 'id, district_name',
          where: { city_id, district_name: Like(search) },
        })
      : await this.districtRepo.find({
          select: 'id, district_name',
          where: { city_id },
        });
    return districtsList;
  }

  async getWardsList(district_id, search) {
    let wardsList = search
      ? await this.wardRepo.find({
          select: 'id, ward_name',
          where: { district_id, ward_name: Like(search) },
        })
      : await this.wardRepo.find({
          select: 'id, ward_name',
          where: { district_id },
        });
    return wardsList;
  }
}