import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './user.model';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserRole } from './user-role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findByPk: jest.Mock;
    create: jest.Mock;
    destroy: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    userModel = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User),
          useValue: userModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users when no role is provided', async () => {
      const mockUsers = [
        { id: 1, name: 'User1', role: 'USER' },
        { id: 2, name: 'User2', role: 'ADMIN' },
      ];
      userModel.findAll.mockResolvedValue(mockUsers);

      const result = await service.findAll();
      expect(result).toEqual(mockUsers);
      expect(userModel.findAll).toHaveBeenCalled();
    });

    it('should return user with given role', async () => {
      const mockUser = { id: 1, name: 'AdminUser', role: 'ADMIN' };
      userModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findAll('ADMIN');
      expect(result).toEqual(mockUser);
      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { role: 'ADMIN' },
      });
    });

    it("should throw if user's with given role not found", async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.findAll('USER')).rejects.toThrow(
        new NotFoundException("No user's with this role found"),
      );
    });

    // Add these tests to your existing UsersService test suite

    describe('findAll with invalid role', () => {
      it('should throw NotFoundException for invalid role', async () => {
        await expect(service.findAll('INVALID_ROLE' as any)).rejects.toThrow(
          new NotFoundException("No user's with this role found"),
        );
      });

      it('should handle empty string role', async () => {
        await expect(service.findAll('' as any)).rejects.toThrow(
          new NotFoundException("No user's with this role found"),
        );
      });

      it('should handle null role parameter', async () => {
        const mockUsers = [{ id: 1, name: 'User1', role: 'USER' }];
        userModel.findAll.mockResolvedValue(mockUsers);

        const result = await service.findAll(null as any);
        expect(result).toEqual(mockUsers);
      });
    });

    describe('edge cases', () => {
      it('should handle database connection errors', async () => {
        userModel.findAll.mockRejectedValue(
          new Error('Database connection failed'),
        );

        await expect(service.findAll()).rejects.toThrow(
          'Database connection failed',
        );
      });

      it('should handle large user datasets', async () => {
        const mockUsers = Array.from({ length: 1000 }, (_, i) => ({
          id: i + 1,
          name: `User${i + 1}`,
          email: `user${i + 1}@example.com`,
          role: i % 2 === 0 ? UserRole.USER : UserRole.ADMIN,
        }));
        userModel.findAll.mockResolvedValue(mockUsers);

        const result = await service.findAll();
        expect(result).toHaveLength(1000);
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: 1, name: 'User1', role: 'USER' };
      userModel.findByPk.mockResolvedValue(mockUser);

      const result = await service.findOne(1);
      expect(result).toEqual(mockUser);
      expect(userModel.findByPk).toHaveBeenCalledWith(1);
    });

    it('should throw if user not found', async () => {
      userModel.findByPk.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDTO = {
        email: 'test@example.com',
        name: 'Test User',
        password: '12345678',
        role: UserRole.USER,
      };
      const mockUser = { id: 1, ...createUserDto };
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);
      expect(result).toEqual(mockUser);
      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(userModel.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw if email already exists', async () => {
      const createUserDto: CreateUserDTO = {
        email: 'test@example.com',
        name: 'Test User',
        password: '12345678',
        role: UserRole.USER,
      };
      userModel.findOne.mockResolvedValue({ id: 1, ...createUserDto });

      await expect(service.create(createUserDto)).rejects.toThrow(
        new NotFoundException('Email already exists'),
      );
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const updateUserDto: UpdateUserDTO = { name: 'Updated User' };
      const mockUser = {
        id: 1,
        name: 'User1',
        role: 'USER',
        update: jest.fn().mockResolvedValue({ id: 1, ...updateUserDto }),
      };
      userModel.findByPk.mockResolvedValue(mockUser);

      const result = await service.update(1, updateUserDto);
      expect(result).toEqual({ id: 1, ...updateUserDto });
      expect(userModel.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.update).toHaveBeenCalledWith(updateUserDto, {
        where: { id: 1 },
      });
    });

    it('should throw if user not found', async () => {
      const updateUserDto: UpdateUserDTO = { name: 'Updated User' };
      userModel.findByPk.mockResolvedValue(null);

      await expect(service.update(1, updateUserDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing user', async () => {
      const mockUser = {
        id: 1,
        name: 'User1',
        role: 'USER',
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      userModel.findByPk.mockResolvedValue(mockUser);

      await service.delete(1);
      expect(userModel.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.destroy).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      userModel.findByPk.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });
});
