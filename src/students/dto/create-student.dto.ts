import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { StudentStatus } from '../enums/student-status.enum';

export class CreateStudentDto {
  @IsString({ message: 'Name must be text.' })
  @IsNotEmpty({ message: 'Name is required.' })
  @MaxLength(120, { message: 'Name must be at most 120 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(160, { message: 'Email must be at most 160 characters.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString({ message: 'Phone must be text.' })
  @IsNotEmpty({ message: 'Phone is required.' })
  @Matches(/^[0-9+\-\s()]{6,30}$/, {
    message: 'Please enter a valid phone number.',
  })
  phone: string;

  @IsString({ message: 'Class must be text.' })
  @IsNotEmpty({ message: 'Class is required.' })
  @MaxLength(50, { message: 'Class must be at most 50 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  class: string;

  @IsNotEmpty({ message: 'Status is required.' })
  @IsEnum(StudentStatus, {
    message: `Status must be one of: ${Object.values(StudentStatus).join(', ')}.`,
  })
  status: StudentStatus;
}
