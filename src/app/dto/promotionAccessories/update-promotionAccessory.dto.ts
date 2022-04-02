import {
  ArrayNotEmpty,
  IsDateString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class UpdatePromotionAccessoryDto {
  @IsNotEmpty()
  accessory_code: string;

  @IsNotEmpty()
  accessory_name: string;

  @IsOptional()
  accessory_type: number = 1;

  @IsOptional()
  product_ids: number[];

  @IsOptional()
  accessory_status: string = 'A';

  @IsOptional()
  @IsDateString()
  display_at: string;
}
