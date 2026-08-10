import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
import { StudentStatus } from './enums/student-status.enum';

type MockRepo = Partial<Record<keyof Repository<Student>, jest.Mock>>;

const createMockRepo = (): MockRepo => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('StudentsService', () => {
  let service: StudentsService;
  let repo: MockRepo;

  const sampleStudent: Student = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+8801000000000',
    class: 'Grade 8',
    status: StudentStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: getRepositoryToken(Student), useValue: repo },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  describe('create', () => {
    it('creates a student when the email is not taken', async () => {
      repo.findOne!.mockResolvedValue(null);
      repo.create!.mockReturnValue(sampleStudent);
      repo.save!.mockResolvedValue(sampleStudent);

      const result = await service.create({
        name: sampleStudent.name,
        email: sampleStudent.email,
        phone: sampleStudent.phone,
        class: sampleStudent.class,
        status: sampleStudent.status,
      });

      expect(result).toEqual(sampleStudent);
      expect(repo.save).toHaveBeenCalledWith(sampleStudent);
    });

    it('throws ConflictException when the email is already used', async () => {
      repo.findOne!.mockResolvedValue(sampleStudent);

      await expect(
        service.create({
          name: sampleStudent.name,
          email: sampleStudent.email,
          phone: sampleStudent.phone,
          class: sampleStudent.class,
          status: sampleStudent.status,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findOne', () => {
    it('returns the student when found', async () => {
      repo.findOne!.mockResolvedValue(sampleStudent);
      const result = await service.findOne(sampleStudent.id);
      expect(result).toEqual(sampleStudent);
    });

    it('throws NotFoundException when the student does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes an existing student', async () => {
      repo.findOne!.mockResolvedValue(sampleStudent);
      repo.remove!.mockResolvedValue(sampleStudent);

      await service.remove(sampleStudent.id);

      expect(repo.remove).toHaveBeenCalledWith(sampleStudent);
    });

    it('throws NotFoundException when deleting a missing student', async () => {
      repo.findOne!.mockResolvedValue(null);
      await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
