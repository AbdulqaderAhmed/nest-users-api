import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/users/user-role.enum';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../src/users/user.model';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let sequelize: Sequelize;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    sequelize = moduleFixture.get<Sequelize>(Sequelize);
    await app.init();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await sequelize.getQueryInterface().dropTable('Users', { force: true });
    await sequelize.sync({ force: true });
  });

  it('GET /users should return all users', async () => {
    // Seed a user
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123', // Assume password is hashed in service
      role: UserRole.USER,
    });

    return request(app.getHttpServer())
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

    return request(app.getHttpServer())
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
    return request(app.getHttpServer())
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

    return request(app.getHttpServer())
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
    return request(app.getHttpServer())
      .get('/users/999')
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

    return request(app.getHttpServer())
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

    return request(app.getHttpServer())
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

    return request(app.getHttpServer())
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
    const updateUserDto = { name: 'Updated User' };

    return request(app.getHttpServer())
      .patch('/users/999')
      .send(updateUserDto)
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

    return request(app.getHttpServer()).delete(`/users/${user.id}`).expect(200);
  });

  it('DELETE /users/:id should throw NotFoundException for invalid ID', async () => {
    return request(app.getHttpServer())
      .delete('/users/999')
      .expect(404)
      .expect((res) => {
        expect((res.body as { message: string }).message).toBe(
          'User not found',
        );
      });
  });

  afterAll(async () => {
    await app.close();
    await sequelize.close();
  });
});
