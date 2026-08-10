import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { Student } from '../students/entities/student.entity';
import { StudentStatus } from '../students/enums/student-status.enum';

const sampleStudents: Partial<Student>[] = [
  {
    name: 'Ariana Chowdhury',
    email: 'ariana.chowdhury@example.com',
    phone: '+880171234567',
    class: 'Grade 10',
    status: StudentStatus.ACTIVE,
  },
  {
    name: 'Rafi Hasan',
    email: 'rafi.hasan@example.com',
    phone: '+880171234568',
    class: 'Grade 9',
    status: StudentStatus.ACTIVE,
  },
  {
    name: 'Nusrat Jahan',
    email: 'nusrat.jahan@example.com',
    phone: '+880171234569',
    class: 'Grade 10',
    status: StudentStatus.INACTIVE,
  },
];

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Student);

  for (const data of sampleStudents) {
    const exists = await repo.findOne({ where: { email: data.email } });
    if (!exists) {
      await repo.save(repo.create(data));
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${sampleStudents.length} students.`);
  await AppDataSource.destroy();
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error);
  process.exit(1);
});
