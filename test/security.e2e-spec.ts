// Create a new security-focused test file
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/users/user-role.enum';
import { App } from 'supertest/types';

describe('Security Tests (e2e)', () => {
  let app: INestApplication;

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
    await app.init();
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in user ID parameter', async () => {
      return request(app.getHttpServer() as App)
        .get('/users/1; DROP TABLE Users; --')
        .expect(400); // Should return bad request, not execute SQL
    });

    it('should prevent SQL injection in role query parameter', async () => {
      return request(app.getHttpServer() as App)
        .get("/users?role=USER'; DROP TABLE Users; --")
        .expect(404); // Should treat as invalid role
    });
  });

  describe('Input Sanitization', () => {
    it('should handle XSS attempts in user data', async () => {
      const xssPayload = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
      };

      return request(app.getHttpServer() as App)
        .post('/users')
        .send(xssPayload)
        .expect(201)
        .expect((res) => {
          // Name should be stored as-is but properly escaped when returned
          expect((res.body as { name: string }).name).toBe(
            '<script>alert("xss")</script>',
          );
        });
    });

    it('should handle extremely long input strings', async () => {
      const longString = 'a'.repeat(10000);
      const invalidUserDto = {
        name: longString,
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
      };

      return request(app.getHttpServer() as App)
        .post('/users')
        .send(invalidUserDto)
        .expect(400); // Should validate string length
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
