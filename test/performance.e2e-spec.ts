// Create a performance-focused test file
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/user.model';
import { UserRole } from '../src/users/user-role.enum';
import { Sequelize } from 'sequelize-typescript';
import { App } from 'supertest/types';

describe('Performance Tests (e2e)', () => {
  let app: INestApplication;
  let sequelize: Sequelize;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    sequelize = moduleFixture.get<Sequelize>(Sequelize);
    await app.init();
  });

  beforeEach(async () => {
    await sequelize.getQueryInterface().dropTable('Users', { force: true });
    await sequelize.sync({ force: true });
  });

  describe('Response Time Tests', () => {
    it('should respond to GET /users within acceptable time', async () => {
      // Seed multiple users
      const users = Array.from({ length: 100 }, (_, i) => ({
        name: `User${i}`,
        email: `user${i}@example.com`,
        password: 'hashedpassword123',
        role: i % 2 === 0 ? UserRole.USER : UserRole.ADMIN,
      }));

      await User.bulkCreate(users);

      const startTime = Date.now();
      const response = await request(app.getHttpServer() as App)
        .get('/users')
        .expect(200);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
      expect(response.body).toHaveLength(100);
    });

    it('should handle pagination efficiently', async () => {
      // This test assumes you implement pagination
      const users = Array.from({ length: 1000 }, (_, i) => ({
        name: `User${i}`,
        email: `user${i}@example.com`,
        password: 'hashedpassword123',
        role: UserRole.USER,
      }));

      await User.bulkCreate(users);

      const startTime = Date.now();
      await request(app.getHttpServer() as App)
        .get('/users?limit=10&offset=0')
        .expect(200);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500); // Should be faster with pagination
    });
  });

  afterAll(async () => {
    await sequelize.close();
    await app.close();
  });
});
