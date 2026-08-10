import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudentsTable1739000000000 implements MigrationInterface {
  name = 'CreateStudentsTable1739000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TYPE "students_status_enum" AS ENUM ('active', 'inactive')
    `);

    await queryRunner.query(`
      CREATE TABLE "students" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "email" varchar(160) NOT NULL,
        "phone" varchar(30) NOT NULL,
        "class" varchar(50) NOT NULL,
        "status" "students_status_enum" NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_students_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_students_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_students_name" ON "students" ("name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_students_status" ON "students" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_students_class" ON "students" ("class")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_students_class"`);
    await queryRunner.query(`DROP INDEX "IDX_students_status"`);
    await queryRunner.query(`DROP INDEX "IDX_students_name"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TYPE "students_status_enum"`);
  }
}
