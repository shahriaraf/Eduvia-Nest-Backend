import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const existing = await this.studentsRepository.findOne({
      where: { email: createStudentDto.email },
    });

    if (existing) {
      throw new ConflictException('A student with this email already exists.');
    }

    const student = this.studentsRepository.create(createStudentDto);
    const saved = await this.studentsRepository.save(student);
    this.logger.log(`Created student ${saved.id}`);
    return saved;
  }

  async findAll(
    query: QueryStudentDto,
  ): Promise<PaginatedResult<Student>> {
    const { search, status, class: className, page, limit, sortBy, sortOrder } =
      query;

    const qb = this.studentsRepository.createQueryBuilder('student');

    if (search) {
      qb.andWhere(
        '(student.name ILIKE :search OR student.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('student.status = :status', { status });
    }

    if (className) {
      qb.andWhere('student.class = :className', { className });
    }

    qb.orderBy(`student.${sortBy}`, sortOrder);
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({ where: { id } });

    if (!student) {
      throw new NotFoundException(`Student with id "${id}" was not found.`);
    }

    return student;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    const student = await this.findOne(id);

    if (updateStudentDto.email && updateStudentDto.email !== student.email) {
      const emailTaken = await this.studentsRepository.findOne({
        where: { email: updateStudentDto.email },
      });
      if (emailTaken) {
        throw new ConflictException(
          'A student with this email already exists.',
        );
      }
    }

    Object.assign(student, updateStudentDto);
    const saved = await this.studentsRepository.save(student);
    this.logger.log(`Updated student ${saved.id}`);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentsRepository.remove(student);
    this.logger.log(`Deleted student ${id}`);
  }

  /** Returns the distinct list of class values currently in use, to power the class filter dropdown. */
  async findDistinctClasses(): Promise<string[]> {
    const rows = await this.studentsRepository
      .createQueryBuilder('student')
      .select('DISTINCT student.class', 'class')
      .orderBy('student.class', 'ASC')
      .getRawMany<{ class: string }>();

    return rows.map((row) => row.class);
  }
}
