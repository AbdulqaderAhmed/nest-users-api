/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './user.model';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserRole } from './user-role.enum';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  // Mock UsersService
  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Mock User model
  const mockUserModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: getModelToken(User),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users when no role is provided', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'User1',
          email: 'user1@example.com',
          role: UserRole.USER,
        },
        {
          id: 2,
          name: 'User2',
          email: 'user2@example.com',
          role: UserRole.ADMIN,
        },
      ];
      mockUsersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();
      expect(result).toEqual(mockUsers);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return user with specific role', async () => {
      const mockUser = {
        id: 1,
        name: 'AdminUser',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };
      mockUsersService.findAll.mockResolvedValue(mockUser);

      const result = await controller.findAll(UserRole.ADMIN);
      expect(result).toEqual(mockUser);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(UserRole.ADMIN);
    });

    it('should throw NotFoundException if no users found with role', async () => {
      mockUsersService.findAll.mockRejectedValue(
        new NotFoundException("No user's with this role found"),
      );

      await expect(controller.findAll(UserRole.USER)).rejects.toThrow(
        new NotFoundException("No user's with this role found"),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: 1,
        name: 'User1',
        email: 'user1@example.com',
        role: UserRole.USER,
      };
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);
      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.findOne(1)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDTO = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
      };
      const mockUser = { id: 1, ...createUserDto };
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);
      expect(result).toEqual(mockUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw NotFoundException if email already exists', async () => {
      const createUserDto: CreateUserDTO = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
      };
      mockUsersService.create.mockRejectedValue(
        new NotFoundException('Email already exists'),
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(
        new NotFoundException('Email already exists'),
      );
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const updateUserDto: UpdateUserDTO = { name: 'Updated User' };
      const mockUser = {
        id: 1,
        name: 'Updated User',
        email: 'user1@example.com',
        role: UserRole.USER,
      };
      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await controller.update(1, updateUserDto);
      expect(result).toEqual(mockUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateUserDto);
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateUserDto: UpdateUserDTO = { name: 'Updated User' };
      mockUsersService.update.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.update(1, updateUserDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing user', async () => {
      mockUsersService.delete.mockResolvedValue(undefined);

      await controller.delete(1);
      expect(mockUsersService.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.delete.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.delete(1)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });
});
