import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { StudentStatus } from '../enums/student-status.enum';

export enum StudentSortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  CLASS = 'class',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryStudentDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsOptional()
  @IsEnum(StudentStatus, { message: 'status must be "active" or "inactive".' })
  status?: StudentStatus;

  @IsOptional()
  @IsString()
  class?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsIn(Object.values(StudentSortField))
  sortBy: StudentSortField = StudentSortField.CREATED_AT;

  @IsOptional()
  @IsIn(Object.values(SortOrder))
  sortOrder: SortOrder = SortOrder.DESC;
}
