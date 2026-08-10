import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';

/**
 * Edit Student form reuses every validation rule from Create,
 * but each field becomes optional so callers can send a partial
 * (PATCH-style) payload.
 */
export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
