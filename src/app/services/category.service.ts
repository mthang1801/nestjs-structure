import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { Table } from '../../database/enums/tables.enum';
import {
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
@Injectable()
export class CategoryService {
  constructor(
    private categoryDescriptionRepo: CategoryDescriptionRepository<CategoryDescriptionEntity>,
    private categoryRepository: CategoryRepository<CategoryEntity>,
    private productRepository: ProductsRepository<ProductsEntity>,
    private productCategoryRepository: ProductsCategoriesRepository<ProductsCategoriesEntity>,
    private imageRepository: ImagesRepository<ImagesEntity>,
    private imageLinkRepository: ImagesLinksRepository<ImagesLinksEntity>,
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
      ? `${parent.category_id}/${idPaths}`
      : `${parent.category_id}`;
    level = Math.max(level, parent.level);
    if (!parent.parent_id) {
      return { idPaths, level };
    }

    let result = await this.findAncestor(parent.parent_id, idPaths, level);
    return { idPaths: result.idPaths, level: result.level };
  }

  async itgCreate(data: CreateCategoryDto): Promise</*ICategoryResult*/ any> {
    const categoryData = this.categoryRepository.setData(data);
    const slug = data['category']
      ? convertToSlug(removeVietnameseTones(data.category))
      : '';

    let idPath = '';

    if (data.level === 1) {
      idPath = `${data.parent_id}`;
    }
    if (data.level === 2 && data.parent_id) {
      let parentCategory = await this.categoryRepository.findById(
        data.parent_id,
      );
      if (parentCategory) {
        let grandParentCategory = await this.categoryRepository.findById(
          parentCategory.parent_id,
        );
        idPath = `${grandParentCategory.category_id}/${parentCategory.category_id}`;
      }
    }

    let result = await this.categoryRepository.create({
      ...categoryData,
      id_path: idPath,
      slug,
      display_at: convertToMySQLDateTime(
        categoryData['display_at']
          ? new Date(categoryData['display_at'])
          : new Date(),
      ),
      created_at: convertToMySQLDateTime(),
    });

    const categoryDescriptionData = this.categoryDescriptionRepo.setData(data);

    const createdCategoryDescription: CategoryDescriptionEntity =
      await this.categoryDescriptionRepo.create({
        category_id: result.category_id,
        ...categoryDescriptionData,
      });

    result = { ...result, ...createdCategoryDescription };

    return result;
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

  async getList(params): Promise<ICategoryResult[]> {
    // ignore page and limit
    let { page, limit, search, ...others } = params;
    page = +page || 1;
    limit = +limit || 100;
    let skip = (page - 1) * limit;

    let filterCondition = {};

    for (let [key, val] of Object.entries(others)) {
      if (this.categoryRepository.tableProps.includes(key)) {
        filterCondition[`${Table.CATEGORIES}.${key}`] = Like(val);
      } else {
        filterCondition[`${Table.CATEGORY_DESCRIPTIONS}.${key}`] = Like(val);
      }
    }

    const categoriesListLevel0 = await this.categoryRepository.find({
      select: [`*, ${Table.CATEGORIES}.*`],
      join: {
        [JoinTable.leftJoin]: {
          [Table.CATEGORY_DESCRIPTIONS]: {
            fieldJoin: `${Table.CATEGORY_DESCRIPTIONS}.category_id`,
            rootJoin: `${Table.CATEGORIES}.category_id`,
          },
        },
      },
      where: { [`${Table.CATEGORIES}.level`]: 0 },
      skip,
      limit,
    });

    for (let categoryLevel0Item of categoriesListLevel0) {
      let categoriesListLevel1 = await this.categoryRepository.find({
        select: [`*, ${Table.CATEGORIES}.*`],
        join: {
          [JoinTable.leftJoin]: {
            [Table.CATEGORY_DESCRIPTIONS]: {
              fieldJoin: `${Table.CATEGORY_DESCRIPTIONS}.category_id`,
              rootJoin: `${Table.CATEGORIES}.category_id`,
            },
          },
        },
        where: {
          [`${Table.CATEGORIES}.level`]: 1,
          parent_id: categoryLevel0Item.category_id,
        },
      });
      if (categoriesListLevel1.length) {
        for (let categoryLevel1Item of categoriesListLevel1) {
          let categoriesListLevel2 = await this.categoryRepository.find({
            select: [`*, ${Table.CATEGORIES}.*`],
            join: {
              [JoinTable.leftJoin]: {
                [Table.CATEGORY_DESCRIPTIONS]: {
                  fieldJoin: `${Table.CATEGORY_DESCRIPTIONS}.category_id`,
                  rootJoin: `${Table.CATEGORIES}.category_id`,
                },
              },
            },
            where: {
              [`${Table.CATEGORIES}.level`]: 2,
              parent_id: categoryLevel1Item.category_id,
            },
          });
          categoryLevel1Item.children = categoriesListLevel2;
        }
      }

      categoryLevel0Item.children = categoriesListLevel1;
    }

    return categoriesListLevel0;
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

  async getCategoriesChildrenRecursive(currentCategory) {
    const categoriesChildrenList = await this.categoryRepository.find({
      select: '*',
      where: { parent_id: currentCategory.category_id },
    });

    if (categoriesChildrenList.length) {
      currentCategory['children'] = categoriesChildrenList;
      for (let categoryChildItem of currentCategory['children']) {
        await this.getCategoriesChildrenRecursive(categoryChildItem);
      }
    }
    return currentCategory;
  }

  async delete(id: number): Promise<boolean> {
    const deleteStatus = await this.categoryRepository.delete({
      category_id: id,
    });

    await this.categoryDescriptionRepo.delete({ category_id: id });

    return deleteStatus;
  }
}
