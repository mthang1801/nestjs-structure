import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { Table } from '../../database/enums/tables.enum';
import {
  convertNullDatetimeData,
  convertToMySQLDateTime,
  convertToSlug,
  removeVietnameseTones,
} from '../../utils/helper';
import { CreateCategoryDto } from '../dto/category/create-category.dto';
import { JoinTable } from '../../database/enums/joinTable.enum';
import { UpdateCategoryDto } from '../dto/category/update-category.dto';
import { CategoryDescriptionEntity } from '../entities/categoryDescription.entity';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryDescriptionRepository } from '../repositories/categoryDescriptions.repository';
import * as _ from 'lodash';
import { Like } from '../../database/find-options/operators';
import { ICategoryResult } from '../interfaces/categoryReult.interface';
import { ProductsRepository } from '../repositories/products.repository';
import { ProductsEntity } from '../entities/products.entity';
import { ProductsCategoriesRepository } from '../repositories/productsCategories.repository';
import { ProductsCategoriesEntity } from '../entities/productsCategories.entity';
import { ImagesRepository } from '../repositories/image.repository';
import { ImagesEntity } from '../entities/image.entity';
import { ImagesLinksRepository } from '../repositories/imageLink.repository';
import { ImagesLinksEntity } from '../entities/imageLinkEntity';
import { ImageObjectType } from 'src/database/enums/tableFieldTypeStatus.enum';
import { CreateCategoryV2Dto } from '../dto/category/create-category.v2.dto';
import { data as categoryData } from '../../database/constant/category';
import { catalogCategoryJoiner, categoryJoiner } from 'src/utils/joinTable';
import { DatabaseService } from 'src/database/database.service';
import {
  sqlSyncGetCategoryFromMagento,
  convertCategoryFromMagentoToCMS,
} from '../../utils/scriptSyncFromMagentor/category.sync';
import { categoriesSearchFilter } from 'src/utils/tableConditioner';
import {
  sqlGetCatalogCategoryName,
  sqlGetCatalogCategoryUrlKey,
} from '../../utils/scriptSyncFromMagentor/catalogCategoy';

import {
  convertCategoryFromAppcore,
  itgCreateCategoryFromAppcore,
  itgCreateCustomerFromAppcore,
} from 'src/utils/integrateFunctions';
import { CatalogCategoryEntity } from '../entities/catalogCategory.entity';
import { CatalogCategoryRepository } from '../repositories/catalogCategory.repository';
import { CatalogCategoryDescriptionRepository } from '../repositories/catalogCategoryDescription.repository';
import { CatalogCategoryDescriptionEntity } from '../entities/catalogCategoryDescription.entity';
import { sqlGetCatalogCategoryUrlPath } from '../../utils/scriptSyncFromMagentor/catalogCategoy';
import axios from 'axios';
import { SortBy } from '../../database/enums/sortBy.enum';
@Injectable()
export class CategoryService {
  constructor(
    private categoryDescriptionRepo: CategoryDescriptionRepository<CategoryDescriptionEntity>,
    private categoryRepository: CategoryRepository<CategoryEntity>,
    private productRepository: ProductsRepository<ProductsEntity>,
    private productCategoryRepository: ProductsCategoriesRepository<ProductsCategoriesEntity>,
    private imageRepository: ImagesRepository<ImagesEntity>,
    private imageLinkRepository: ImagesLinksRepository<ImagesLinksEntity>,
    private databaseService: DatabaseService,
    private catalogCategoryRepo: CatalogCategoryRepository<CatalogCategoryEntity>,
    private catalogCategoryDescRepo: CatalogCategoryDescriptionRepository<CatalogCategoryDescriptionEntity>,
  ) {}

  async create(data: CreateCategoryV2Dto): Promise<any> {
    const checkSlugExist = await this.categoryRepository.findOne({
      slug: convertToSlug(data.slug),
    });

    if (checkSlugExist) {
      throw new HttpException('Đường dẫn đã tồn tại.', 409);
    }

    if (data.parent_id) {
      const parentCategory = await this.categoryRepository.findOne({
        category_id: data.parent_id,
      });
      if (!parentCategory) {
        throw new HttpException('Danh mục cha không tồn tại', 404);
      }
      data['level'] = parentCategory['level'] + 1;
    }

    const categoryData = {
      ...new CategoryEntity(),
      ...this.categoryRepository.setData(data),
    };
    const category = await this.categoryRepository.create(categoryData);
    let result: any = { ...category };

    const categoryDescData = {
      ...new CategoryDescriptionEntity(),
      ...this.categoryDescriptionRepo.setData(data),
      category_id: result.category_id,
    };
    const categoryDesc = await this.categoryDescriptionRepo.create(
      categoryDescData,
    );
    result = { ...result, ...categoryDesc };
    return result;
  }

  async findAncestor(parentId: number, idPaths = '', level = 0) {
    const parent = await this.categoryRepository.findById(parentId);
    idPaths = idPaths
      ? `${parent['category_id']}/${idPaths}`
      : `${parent['category_id']}`;
    level = Math.max(level, parent.level);
    if (!parent.parent_id) {
      return { idPaths, level };
    }

    let result = await this.findAncestor(parent.parent_id, idPaths, level);
    return { idPaths: result.idPaths, level: result.level };
  }

  async itgCreate(data) {
    const category = await this.categoryRepository.findOne({
      category_appcore_id: data.category_id,
    });
    if (category) {
      return await this.itgUpdate(data.category_id, data);
    }

    let convertedData = convertCategoryFromAppcore(data);
    if (!convertedData['category']) {
      throw new HttpException('Category cần có tên', 400);
    }

    const categoryData = {
      ...new CategoryEntity(),
      ...this.categoryRepository.setData(convertedData),
      slug: convertToSlug(removeVietnameseTones(data['category'])),
    };
    const newCategory = await this.categoryRepository.create(categoryData);

    const categoryDescData = {
      ...new CategoryDescriptionEntity(),
      ...this.categoryDescriptionRepo.setData(convertedData),
      category_id: newCategory['category_id'],
    };
    await this.categoryDescriptionRepo.createSync(categoryDescData);
    await this.convertAppcoreToCMSId();
  }

  async itgUpdate(category_appcore_id, data) {
    const category = await this.categoryRepository.findOne({
      category_appcore_id,
    });

    if (!category) {
      return this.itgCreate({ category_id: category_appcore_id, ...data });
    }
    let convertedData = convertCategoryFromAppcore(data);

    let updatedCategoryData = {};
    updatedCategoryData = {
      ...this.categoryRepository.setData(convertedData),
      updated_at: convertToMySQLDateTime(),
    };

    await this.categoryRepository.update(
      { category_id: category['category_id'] },
      updatedCategoryData,
    );

    const updatedCategoryDesData = {
      ...this.categoryDescriptionRepo.setData(convertedData),
    };

    if (Object.entries(updatedCategoryDesData).length) {
      await this.categoryDescriptionRepo.update(
        { category_id: category['category_id'] },
        updatedCategoryDesData,
      );
    }
    await this.convertAppcoreToCMSId();
  }

  async convertAppcoreToCMSId() {
    let categories = await this.categoryRepository.find();
    if (categories.length) {
      for (let category of categories) {
        if (category['parent_appcore_id'] && !category['parent_id']) {
          let parentCategory = await this.categoryRepository.findOne({
            category_appcore_id: category['parent_appcore_id'],
          });
          if (parentCategory) {
            await this.categoryRepository.update(
              { category_id: category['category_id'] },
              { parent_id: parentCategory['category_id'] },
            );
          }
        }
      }
    }
  }

  async update(id: number, data: UpdateCategoryDto): Promise<any> {
    const oldCategoryData = await this.categoryRepository.findOne({
      select: ['*'],
      join: {
        [JoinTable.leftJoin]: {
          [Table.CATEGORY_DESCRIPTIONS]: {
            fieldJoin: `${Table.CATEGORY_DESCRIPTIONS}.category_id`,
            rootJoin: `${Table.CATEGORIES}.category_id`,
          },
        },
      },
      where: {
        [`${Table.CATEGORIES}.category_id`]: id,
      },
    });

    if (!oldCategoryData) {
      throw new HttpException(`Không tìm thấy category với id là ${id}`, 404);
    }

    if (data.slug && data.slug !== oldCategoryData.slug) {
      const checkSlug = await this.categoryRepository.findOne({
        slug: convertToSlug(data.slug),
      });
      if (checkSlug) {
        throw new HttpException(
          'đường dẫn đã tồn tại, không thể cập nhật.',
          409,
        );
      }
    }
    let updatedCategoryData = this.categoryRepository.setData(data);

    let result = { ...oldCategoryData };

    if (Object.entries(updatedCategoryData).length) {
      for (let [key, val] of Object.entries(updatedCategoryData)) {
        if (key === 'slug') {
          updatedCategoryData['slug'] = convertToSlug(val);
          continue;
        }
        updatedCategoryData[key] = val;
      }

      const updatedCategory = await this.categoryRepository.update(
        oldCategoryData.category_id,
        {
          ...updatedCategoryData,
        },
      );

      result = { ...result, ...updatedCategory };
    }

    const oldCategoryDescription = await this.categoryDescriptionRepo.findOne({
      category_id: id,
    });

    if (!oldCategoryDescription) {
      throw new HttpException(
        `Không tìm thấy category description với id là ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }

    let updatedCategoryDescriptionData =
      this.categoryDescriptionRepo.setData(data);

    if (Object.entries(updatedCategoryDescriptionData).length) {
      const updatedCategoryDescription =
        await this.categoryDescriptionRepo.update(
          result.category_id,
          updatedCategoryDescriptionData,
        );

      result = { ...result, ...updatedCategoryDescription };
    }

    // update products
    if (data.products_list && data.products_list.length) {
      let currentProductsLists = await this.productCategoryRepository.find({
        select: ['*'],
        join: {
          [JoinTable.leftJoin]: {
            [Table.PRODUCTS]: {
              fieldJoin: `${Table.PRODUCTS}.product_id`,
              rootJoin: `${Table.PRODUCTS_CATEGORIES}.product_id`,
            },
          },
        },
        where: {
          category_id: result.category_id,
        },
      });
      const willDeleteProducts = currentProductsLists.filter(
        ({ product_code }) => !data.products_list.includes(product_code),
      );

      if (willDeleteProducts.length) {
        for (let willDeleteProductItem of willDeleteProducts) {
          await this.productCategoryRepository.delete({
            category_id: result.category_id,
            product_id: willDeleteProductItem.product_id,
          });
        }
      }

      currentProductsLists = currentProductsLists.filter(({ product_code }) =>
        data.products_list.includes(product_code),
      );

      const willCreateProducts = data.products_list.filter(
        (productCode) =>
          !currentProductsLists.some(
            ({ product_code }) => product_code === productCode,
          ),
      );

      if (willCreateProducts.length) {
        for (let willCreateProductItem of willCreateProducts) {
          let product = await this.productRepository.findOne({
            product_code: willCreateProductItem,
          });
          if (!product) continue;

          const productCategory = await this.productCategoryRepository.findOne({
            product_id: product.product_id,
            category_id: result.category_id,
          });

          if (!productCategory) {
            await this.productCategoryRepository.create({
              product_id: product.product_id,
              category_id: result.category_id,
              link_type: result.category_type,
              position: product.parent_product_id,
              category_position: result.position,
            });
          }
        }
      }
    }

    // update image
    if (data.image) {
      let currentImageLink = await this.imageLinkRepository.findOne({
        object_id: result.category_id,
        object_type: ImageObjectType.CATEGORY,
      });
      let isSuccess = true;
      // Néu tìm thấy image_link
      if (currentImageLink) {
        // Tìm kiếm image được liên kết từ image_link,
        // Nếu ko thì xoá luôn image link và tạo mới
        let currentImage = await this.imageRepository.findOne({
          image_id: currentImageLink.image_id,
        });
        // Nếu image tồn tại thì update
        if (currentImage) {
          const updatedImage = await this.imageRepository.update(
            { image_id: currentImage.image_id },
            { image_path: data.image },
          );
          result = {
            ...result,
            image: { ...currentImageLink, ...updatedImage },
          };
        } else {
          await this.imageLinkRepository.delete({
            object_id: result.category_id,
            object_type: ImageObjectType.CATEGORY,
          });
          isSuccess = false;
        }
      }

      if (!currentImageLink || !isSuccess) {
        const image = await this.imageRepository.create({
          image_path: data.image,
        });

        const imageLink = await this.imageLinkRepository.create({
          object_id: result.category_id,
          object_type: ImageObjectType.CATEGORY,
          image_id: image.image_id,
        });
        result = { ...result, image: { ...image, ...imageLink } };
      }
    }

    return result;
  }

  async getList(params) {
    // ignore page and limit
    let { page, limit, search, ...others } = params;
    page = +page || 1;
    limit = +limit || 10;
    let skip = (page - 1) * limit;

    let filterCondition = {};

    for (let [key, val] of Object.entries(others)) {
      if (this.categoryRepository.tableProps.includes(key)) {
        filterCondition[`${Table.CATEGORIES}.${key}`] = Like(val);
      } else {
        filterCondition[`${Table.CATEGORY_DESCRIPTIONS}.${key}`] = Like(val);
      }
    }

    if (search) {
      const categories = await this.categoryRepository.find({
        select: '*',
        join: categoryJoiner,
        orderBy: [
          { field: 'updated_at', sortBy: SortBy.DESC },
          { field: 'created_at', sortBy: SortBy.DESC },
        ],
        where: categoriesSearchFilter(search, filterCondition),
        skip,
        limit,
      });
      const totalCategories = await this.categoryRepository.find({
        select: `COUNT(DISTINCT(${Table.CATEGORIES}.category_id)) as total`,
        join: categoryJoiner,
        where: categoriesSearchFilter(search, filterCondition),
      });

      for (let category of categories) {
        const categoriesList = await this.getCategoriesChildrenRecursive(
          category,
          Infinity,
          true,
        );

        let count = 0;

        if (categoriesList?.categoriesIdList?.length) {
          for (let categoryId of categoriesList.categoriesIdList) {
            const numberOfProductsByCategoryId =
              await this.productCategoryRepository.count({
                where: { category_id: categoryId },
              });
            count += numberOfProductsByCategoryId;
          }
        }

        category['totalProducts'] = count;
        category = categoriesList['currentCategory'];
      }
      return {
        paging: {
          currentPage: page,
          pageSize: limit,
          total: totalCategories[0].total,
        },
        categories,
      };
    }

    let categoriesListRoot = await this.categoryRepository.find({
      select: `*`,
      join: categoryJoiner,
      where: { [`${Table.CATEGORIES}.level`]: 0 },
      skip,
      limit,
    });

    let totalCategory = await this.categoryRepository.find({
      select: `COUNT(DISTINCT(${Table.CATEGORIES}.category_id)) as total`,
      join: categoryJoiner,
      where: { [`${Table.CATEGORIES}.level`]: 0 },
    });

    for (let categoryRoot of categoriesListRoot) {
      const categoriesList = await this.getCategoriesChildrenRecursive(
        categoryRoot,
        Infinity,
        true,
      );
      let count = 0;
      if (categoriesList?.categoriesIdList?.length) {
        for (let categoryId of categoriesList.categoriesIdList) {
          const numberOfProductsByCategoryId =
            await this.productCategoryRepository.count({
              where: { category_id: categoryId },
            });
          count += numberOfProductsByCategoryId;
        }
      }
      categoryRoot['totalProducts'] = count;
      categoryRoot = categoriesList['currentCategory'];
    }

    return {
      categories: categoriesListRoot,
      paging: {
        currentPage: page,
        pageSize: limit,
        total: totalCategory.length
          ? totalCategory[0].total
          : categoriesListRoot.length,
      },
    };
  }

  async getAll(level = Infinity) {
    const categories = await this.categoryRepository.find({
      select: '*',
      join: categoryJoiner,
      where: { [`${Table.CATEGORIES}.level`]: 0 },
    });
    for (let category of categories) {
      const categoriesList = await this.getCategoriesChildrenRecursive(
        category,
        level,
      );
      category = categoriesList;
    }

    return categories;
  }

  async get(id: number) {
    let category = await this.categoryRepository.findOne({
      select: ['*'],
      join: {
        [JoinTable.leftJoin]: {
          [Table.CATEGORY_DESCRIPTIONS]: {
            fieldJoin: `${Table.CATEGORY_DESCRIPTIONS}.category_id`,
            rootJoin: `${Table.CATEGORIES}.category_id`,
          },
        },
      },
      where: { [`${Table.CATEGORIES}.category_id`]: id },
    });

    const categories = await this.getCategoriesChildrenRecursive(category);
    return categories;
  }

  async getCategoriesChildrenRecursive(
    currentCategory,
    maxLevel = Infinity,
    getCategoryListId = false,
    categoriesIdList = [],
  ) {
    const categoriesChildrenList = await this.categoryRepository.find({
      select: '*',
      join: categoryJoiner,
      where: { parent_id: currentCategory.category_id },
    });

    if (getCategoryListId) {
      categoriesIdList = [
        currentCategory.category_id,
        ...categoriesIdList,
        ...categoriesChildrenList.map(({ category_id }) => category_id),
      ];
    }

    if (categoriesChildrenList.length && currentCategory.level < maxLevel) {
      currentCategory['children'] = categoriesChildrenList;
      for (let categoryChildItem of currentCategory['children']) {
        await this.getCategoriesChildrenRecursive(categoryChildItem, maxLevel);
      }
    }

    return getCategoryListId
      ? { currentCategory, categoriesIdList }
      : currentCategory;
  }

  async delete(id: number): Promise<boolean> {
    const deleteStatus = await this.categoryRepository.delete({
      category_id: id,
    });

    await this.categoryDescriptionRepo.delete({ category_id: id });

    return deleteStatus;
  }

  async clearAll() {
    await this.categoryRepository.writeExec(
      `TRUNCATE TABLE ${Table.CATEGORIES}`,
    );
    await this.categoryDescriptionRepo.writeExec(
      `TRUNCATE TABLE ${Table.CATEGORY_DESCRIPTIONS}`,
    );
  }

  async getSync() {
    await this.clearAll();
    const categoriesResponse = await this.databaseService.executeMagentoPool(
      sqlSyncGetCategoryFromMagento,
    );
    const categoriesList = categoriesResponse[0];
    for (let categoryItem of categoriesList) {
      const convertedData = convertCategoryFromMagentoToCMS(categoryItem);
      const newCategoryData = {
        ...new CategoryEntity(),
        ...this.categoryRepository.setData(convertedData),
        slug: convertToSlug(removeVietnameseTones(convertedData['category'])),
      };
      const newCategory = await this.categoryRepository.create(newCategoryData);

      const categoryDescriptionData = {
        ...new CategoryDescriptionEntity(),
        ...this.categoryDescriptionRepo.setData(convertedData),
        category_id: newCategory.category_id,
      };
      await this.categoryDescriptionRepo.createSync(categoryDescriptionData);
    }
    const CMSCategoriesList = await this.categoryRepository.find();
    await this.findAndUpdateFromMagento(CMSCategoriesList);
  }

  async findAndUpdateFromMagento(categoriesList) {
    for (let categoryItem of categoriesList) {
      if (categoryItem['parent_magento_id'] != 0) {
        const categoryParent = await this.categoryRepository.findOne({
          category_magento_id: categoryItem['parent_magento_id'],
        });
        if (categoryParent) {
          await this.categoryRepository.update(
            {
              category_id: categoryItem.category_id,
            },
            { parent_id: categoryParent.category_id },
          );
        }
      }
      const categoryIdMatengoPaths = categoryItem['id_magento_path']
        ? categoryItem['id_magento_path'].split('/')
        : categoryItem['id_magento_path'];
      let idPaths = [];
      if (Array.isArray(categoryIdMatengoPaths)) {
        for (let idPath of categoryIdMatengoPaths) {
          const categoryByIdPath = await this.categoryRepository.findOne({
            category_id: idPath,
          });
          if (categoryByIdPath) {
            idPaths.push(categoryByIdPath.category_id);
          }
        }
        await this.categoryRepository.update(
          {
            category_id: categoryItem.category_id,
          },
          { id_path: idPaths.join('/') },
        );
      }
    }
  }

  async callSync() {
    let categoriesList: any = categoryData;
    await this.clearAll();
    for (let categoryItem of categoriesList) {
      await this.itgCreate(categoryItem);
    }
  }

  async getCatalog(params) {
    let { level, all, page, limit } = params;
    level = +level || 2;
    all =
      all && (all.toString() == 'true' || all.toString() == 'false')
        ? all
        : null;
    page = +page || 1;
    limit = +limit || 10;
    let skip = (page - 1) * limit;
    if (all) {
      let catalogsList = await this.catalogCategoryRepo.find({
        select: '*',
        join: catalogCategoryJoiner,
        skip,
        limit,
      });

      let count = await this.catalogCategoryRepo.find({
        select: `COUNT(DISTINCT(catalog_id)) as total`,
      });

      return {
        paging: {
          currentPage: page,
          pageSize: limit,
          total: count[0].total,
        },
        categories: catalogsList,
      };
    }
    let catalogsList = await this.catalogCategoryRepo.find({
      select: '*',
      join: catalogCategoryJoiner,
      where: { level },
      skip,
      limit,
    });

    let count = await this.catalogCategoryRepo.find({
      select: `COUNT(DISTINCT(catalog_id)) as total`,
      where: { level },
    });

    return {
      paging: {
        currentPage: page,
        pageSize: limit,
        total: count[0].total,
      },
      categories: catalogsList,
    };
  }

  async syncImports() {
    await this.clearAll();
    const response = await axios({
      url: 'http://mb.viendidong.com/web-tester/v1/api/category',
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7Il9pZCI6MzAwMDA3OCwidXNlcm5hbWUiOiJuaGF0dGluX3ZpZXciLCJpc0FjdGl2ZSI6dHJ1ZSwibGlzdEZlYXR1cmUiOlsiUE9JTlRfVklFVyIsIk9SREVSX1ZJRVciLCJQUk9EVUNUX0FUVEFDSF9WSUVXIiwiVFJBREVfSU5fVklFVyIsIlBST0RVQ1RfUFJPTU9USU9OX1ZJRVciLCJESVNDT1VOVF9WSUVXIiwiVFJBREVfSU5fUFJPR1JBTV9WSUVXIiwiQ09VUE9OX1ZJRVciLCJWSVJUVUFMX1NUT0NLX1ZJRVciLCJPUkRFUl9JTlNFUlQiLCJUUkFERV9JTl9JTlNFUlQiLCJESVNDT1VOVF9JTlNFUlQiLCJDT1VQT05fSU5TRVJUIiwiUFJPRFVDVF9QUk9NT1RJT05fSU5TRVJUIiwiVFJBREVfSU5fUFJPR1JBTV9JTlNFUlQiLCJQUk9EVUNUX0FUVEFDSF9JTlNFUlQiLCJBUkVBX1ZJRVciLCJSRUdJT05fVklFVyIsIkNVU1RPTUVSX0NBUkVfVklFVyIsIkNVU1RPTUVSX0NBUkVfSU5TRVJUIiwiUE9JTlRfSU5TRVJUIiwiT1JERVJfVVBEQVRFIiwiVFJBREVfSU5fVVBEQVRFIiwiSU5TVEFMTE1FTlRfVklFVyIsIklOU1RBTExNRU5UX0lOU0VSVCIsIlZJUlRVQUxfU1RPQ0tfSU5TRVJUIiwiV0FSUkFOVFlfSU5TRVJUIiwiV0FSUkFOVFlfVklFVyIsIlNUT1JFX1ZJRVciLCJDVVNUT01FUl9WSUVXIiwiQ0FURV9WSUVXIiwiQ0FURV9JTlNFUlQiLCJCUkFORF9WSUVXIiwiQlJBTkRfSU5TRVJUIiwiUFJPVklERVJfVklFVyIsIlBST1ZJREVSX0lOU0VSVCIsIlBST1BFUlRZX1ZJRVciLCJQUk9EVUNUX1ZJRVciLCJQUk9QRVJUWV9JTlNFUlQiLCJCSUxMX1ZJRVciLCJQUk9EVUNUX0lOU0VSVCIsIkJJTExfSU5TRVJUIiwiQklMTF9VUERBVEUiXSwiZW1wbG95ZWVJZCI6MzAwMDE3NSwiam9iVGl0bGVJZCI6bnVsbH0sImlhdCI6MTY0ODMxMzExOSwiZXhwIjoxNjQ4OTE3OTE5fQ.j0oPSscd79UJfJYpnDqoShBUzAJcY2X3m3iM1RI0fsE',
      },
    });
    const data = response.data.data;

    for (let coreData of data['list_caterogy']) {
      const mappingData = new Map([
        ['id', 'category_appcore_id'],
        ['name', 'category'],
        ['level', 'level'],
        ['parentId', 'parent_appcore_id'],
      ]);
      let cmsData = {};
      for (let [core, cms] of mappingData) {
        if (core === 'name') {
          cmsData['slug'] = convertToSlug(
            removeVietnameseTones(coreData[core]),
          );
          cmsData['category_appcore'] = coreData[core];
        }
        cmsData[cms] = coreData[core];
      }

      const categoryData = {
        ...new CategoryEntity(),
        ...this.categoryRepository.setData(cmsData),
      };
      const newCategory = await this.categoryRepository.create(categoryData);

      const categoryDescData = {
        ...new CategoryDescriptionEntity(),
        ...this.categoryDescriptionRepo.setData(cmsData),
        category_id: newCategory['category_id'],
      };

      await this.categoryDescriptionRepo.createSync(categoryDescData);
    }

    const categoriesList = await this.categoryRepository.find();

    for (let categoryItem of categoriesList) {
      if (categoryItem['parent_appcore_id']) {
        let parentCategory = await this.categoryRepository.findOne({
          category_appcore_id: categoryItem['parent_appcore_id'],
        });
        if (parentCategory) {
          await this.categoryRepository.update(
            { category_id: categoryItem['category_id'] },
            { parent_id: parentCategory['category_id'] },
          );
        }
      }
    }
  }

  async syncImportCatalogs() {
    const res = await this.databaseService.executeMagentoPool(
      sqlGetCatalogCategoryName,
    );
    await this.catalogCategoryRepo.writeExec(
      `TRUNCATE TABLE ${Table.CATALOG_CATEGORIES}`,
    );
    await this.catalogCategoryDescRepo.writeExec(
      `TRUNCATE TABLE ${Table.CATALOG_CATEGORY_DESCRIPTIONS}`,
    );

    const catalogCategoriesList = res[0];
    for (let categoryItem of catalogCategoriesList) {
      const categoryItemData = {
        ...new CatalogCategoryEntity(),
        ...this.catalogCategoryRepo.setData(categoryItem),
        catalog_appcore_id: categoryItem['entity_id'],
        parent_appcore_id: categoryItem['parent_id'],
      };

      const newCatalogCategory = await this.catalogCategoryRepo.create(
        categoryItemData,
      );

      const catalogCategoryDescData = {
        ...new CatalogCategoryDescriptionEntity(),
        ...this.catalogCategoryDescRepo.setData(categoryItem),
        catalog_appcore_name: categoryItem['value'],
        catalog_name: categoryItem['value'],
        catalog_id: newCatalogCategory['catalog_id'],
      };

      await this.catalogCategoryDescRepo.createSync(catalogCategoryDescData);
    }

    const resUrlKey = await this.databaseService.executeMagentoPool(
      sqlGetCatalogCategoryUrlKey,
    );

    const catalogCategoriesKeyList = resUrlKey[0];
    for (let categoryItem of catalogCategoriesKeyList) {
      const category = await this.catalogCategoryRepo.findOne({
        catalog_appcore_id: categoryItem['entity_id'],
      });

      if (category) {
        await this.catalogCategoryDescRepo.update(
          { catalog_id: category['catalog_id'] },
          { url_key: categoryItem['value'] },
        );
      }
    }

    const resUrlPath = await this.databaseService.executeMagentoPool(
      sqlGetCatalogCategoryUrlPath,
    );

    const catalogCategoriesPathList = resUrlPath[0];
    for (let categoryItem of catalogCategoriesPathList) {
      const category = await this.catalogCategoryRepo.findOne({
        catalog_appcore_id: categoryItem['entity_id'],
      });
      if (category) {
        await this.catalogCategoryDescRepo.update(
          { catalog_id: category['catalog_id'] },
          { url_path: categoryItem['value'] },
        );
      }
    }

    const catalogCategories = await this.catalogCategoryRepo.find();
    for (let catalogItem of catalogCategories) {
      if (catalogItem['parent_appcore_id']) {
        let parentCatalog = await this.catalogCategoryRepo.findOne({
          catalog_appcore_id: catalogItem['parent_appcore_id'],
        });
        if (parentCatalog) {
          await this.catalogCategoryRepo.update(
            {
              catalog_id: catalogItem['catalog_id'],
            },
            { parent_id: parentCatalog['catalog_id'] },
          );
        }
      }
    }
  }
}
