import {
  ArrayNotEmpty,
  IsDateString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreatePromotionAccessoryDto {
  @IsNotEmpty()
  accessory_code: string;

  @IsNotEmpty()
  accessory_name: string;

  @ArrayNotEmpty()
  product_ids: number[];

  @IsOptional()
  accessory_type: number = 1;

  @IsOptional()
  accessory_status: string = 'A';

  @IsOptional()
  @IsDateString()
  display_at: string;
}
