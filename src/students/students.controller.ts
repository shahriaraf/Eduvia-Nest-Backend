import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/** Every student route requires a valid `Authorization: Bearer <token>` header. */
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /** GET /students — list, search, filter, sort, paginate */
  @Get()
  findAll(@Query() query: QueryStudentDto) {
    return this.studentsService.findAll(query);
  }

  /** GET /students/meta/classes — distinct class values for the filter dropdown */
  @Get('meta/classes')
  findDistinctClasses() {
    return this.studentsService.findDistinctClasses();
  }

  /** GET /students/:id */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.findOne(id);
  }

  /** POST /students */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  /** PATCH /students/:id */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }

  /** DELETE /students/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.remove(id).then(() => ({
      message: 'Student deleted successfully.',
    }));
  }
}
