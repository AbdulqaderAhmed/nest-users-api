import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/users/user-role.enum';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../src/users/user.model';
import { App } from 'supertest/types';

describe('UsersController (e2e)', () => {
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
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await app.close();
    await sequelize.close();
  });

  it('GET /users should return all users', async () => {
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: UserRole.USER,
    });

    return request(app.getHttpServer() as App)
      .get('/users')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
        expect((res.body as any[])[0]).toMatchObject({
          name: 'Test User',
          email: 'test@example.com',
          role: UserRole.USER,
        });
      });
  });

  it('GET /users?role=ADMIN should return users with ADMIN role', async () => {
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashedpassword123',
      role: UserRole.ADMIN,
    });

    return request(app.getHttpServer() as App)
      .get('/users?role=ADMIN')
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          name: 'Admin User',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        });
      });
  });

  it('GET /users?role=INVALID should throw NotFoundException', async () => {
    return request(app.getHttpServer() as App)
      .get('/users?role=INVALID')
      .expect(404)
      .expect((res) => {
        expect((res.body as { message: string }).message).toBe(
          "No user's with this role found",
        );
      });
  });

  it('GET /users/:id should return a user by ID', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: UserRole.USER,
    });

    return request(app.getHttpServer() as App)
      .get(`/users/${user.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          name: 'Test User',
          email: 'test@example.com',
          role: UserRole.USER,
        });
      });
  });

  it('GET /users/:id should throw NotFoundException for invalid ID', async () => {
    return request(app.getHttpServer() as App)
      .get('/users/999999')
      .expect(404)
      .expect((res) => {
        expect((res.body as { message: string }).message).toBe(
          'User not found',
        );
      });
  });

  it('POST /users should create a user', async () => {
    const createUserDto = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      role: UserRole.USER,
    };

    return request(app.getHttpServer() as App)
      .post('/users')
      .send(createUserDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toMatchObject({
          name: createUserDto.name,
          email: createUserDto.email,
          role: createUserDto.role,
        });
      });
  });

  it('POST /users should throw NotFoundException for duplicate email', async () => {
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: UserRole.USER,
    });

    const createUserDto = {
      name: 'Another User',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.USER,
    };

    return request(app.getHttpServer() as App)
      .post('/users')
      .send(createUserDto)
      .expect(404)
      .expect((res) => {
        expect((res.body as { message: string }).message).toBe(
          'Email already exists',
        );
      });
  });

  it('PATCH /users/:id should update a user', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: UserRole.USER,
    });

    const updateUserDto = {
      name: 'Updated User',
      role: UserRole.ADMIN,
    };

    return request(app.getHttpServer() as App)
      .patch(`/users/${user.id}`)
      .send(updateUserDto)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          name: 'Updated User',
          email: 'test@example.com',
          role: UserRole.ADMIN,
        });
      });
  });

  it('PATCH /users/:id should throw NotFoundException for invalid ID', async () => {
    return request(app.getHttpServer() as App)
      .patch('/users/999999')
      .send({ name: 'Updated User' })
      .expect(404)
      .expect((res) => {
        expect((res.body as { message: string }).message).toBe(
          'User not found',
        );
      });
  });

  it('DELETE /users/:id should delete a user', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: UserRole.USER,
    });

    return request(app.getHttpServer() as App)
      .delete(`/users/${user.id}`)
      .expect(200);
  });

  it('DELETE /users/:id should throw NotFoundException for invalid ID', async () => {
    return request(app.getHttpServer() as App)
      .delete('/users/999999')
      .expect(404)
      .expect((res) => {
        expect((res.body as { message: string }).message).toBe(
          'User not found',
        );
      });
  });

  describe('Input Validation Tests', () => {
    it('POST /users should return 400 for invalid email format', async () => {
      return request(app.getHttpServer() as App)
        .post('/users')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
          role: UserRole.USER,
        })
        .expect(400)
        .expect((res) => {
          expect((res.body as { message: string }).message).toContain(
            'Invalid email format',
          );
        });
    });

    it('POST /users should return 400 for short password', async () => {
      return request(app.getHttpServer() as App)
        .post('/users')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123',
          role: UserRole.USER,
        })
        .expect(400)
        .expect((res) => {
          expect((res.body as { message: string }).message).toContain(
            'Password must be at least 8 characters long',
          );
        });
    });

    it('POST /users should return 400 for missing required fields', async () => {
      return request(app.getHttpServer() as App)
        .post('/users')
        .send({ email: 'test@example.com' })
        .expect(400)
        .expect((res) => {
          expect((res.body as { message: string }).message).toContain(
            'Name is required',
          );
        });
    });

    it('POST /users should return 400 for invalid role', async () => {
      return request(app.getHttpServer() as App)
        .post('/users')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'INVALID_ROLE',
        })
        .expect(400)
        .expect((res) => {
          expect((res.body as { message: string }).message).toContain(
            'Role must be either USER or ADMIN',
          );
        });
    });
  });

  describe('Query Parameter Tests', () => {
    it('GET /users should handle case-sensitive role queries', async () => {
      return request(app.getHttpServer() as App)
        .get('/users?role=admin')
        .expect(404);
    });

    it('GET /users should handle multiple query parameters', async () => {
      return request(app.getHttpServer() as App)
        .get('/users?role=USER&limit=10')
        .expect(200);
    });

    it('GET /users should handle special characters in role', async () => {
      return request(app.getHttpServer() as App)
        .get('/users?role=USER%20ADMIN')
        .expect(404);
    });
  });

  describe('Concurrent Operations Tests', () => {
    it('should handle concurrent user creation', async () => {
      const userPromises = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer() as App)
          .post('/users')
          .send({
            name: `User${i}`,
            email: `user${i}@example.com`,
            password: 'password123',
            role: UserRole.USER,
          }),
      );

      const results = await Promise.all(userPromises);
      results.forEach((result) => {
        expect(result.status).toBe(201);
      });
    });

    it('should handle concurrent updates to same user', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        role: UserRole.USER,
      });

      const updatePromises = [
        request(app.getHttpServer() as App)
          .patch(`/users/${user.id}`)
          .send({ name: 'Updated Name 1' }),
        request(app.getHttpServer() as App)
          .patch(`/users/${user.id}`)
          .send({ name: 'Updated Name 2' }),
      ];

      const results = await Promise.all(updatePromises);
      results.forEach((res) => expect(res.status).toBe(200));
    });
  });
});
