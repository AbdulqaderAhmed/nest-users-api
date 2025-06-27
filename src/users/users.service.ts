import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User) private userModel: typeof User,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: WinstonLogger,
  ) {}

  async findAll(role?: 'USER' | 'ADMIN'): Promise<User[]> {
    try {
      this.logger.log(`Finding all users${role ? ` with role: ${role}` : ''}`);

      if (role) {
        // Validate role before querying database
        if (role !== 'USER' && role !== 'ADMIN') {
          throw new BadRequestException('Invalid role. Must be USER or ADMIN');
        }

        const users = await this.userModel.findAll({ where: { role } });
        this.logger.log(`Found ${users.length} users with role: ${role}`);
        return users;
      }

      const users = await this.userModel.findAll();
      this.logger.log(`Found ${users.length} total users`);
      return users;
    } catch (error) {
      this.winstonLogger.error('Error finding users', {
        error: error.message,
        role,
      });
      throw error;
    }
  }

  async findOne(id: number): Promise<User> {
    try {
      this.logger.log(`Finding user with ID: ${id}`);

      if (!id || id <= 0) {
        throw new BadRequestException('Invalid user ID');
      }

      const user = await this.userModel.findByPk(id);

      if (!user) {
        this.logger.warn(`User with ID ${id} not found`);
        throw new NotFoundException('User not found');
      }

      this.logger.log(`Found user: ${user.email}`);
      return user;
    } catch (error) {
      this.winstonLogger.error('Error finding user', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  async create(createUserDto: CreateUserDTO): Promise<User> {
    try {
      this.logger.log(`Creating new user with email: ${createUserDto.email}`);

      const existingUser = await this.userModel.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        this.logger.warn(
          `Attempt to create user with existing email: ${createUserDto.email}`,
        );
        throw new ConflictException('Email already exists');
      }

      const newUser = await this.userModel.create({ ...createUserDto });
      this.logger.log(`Successfully created user with ID: ${newUser.id}`);
      return newUser;
    } catch (error) {
      this.winstonLogger.error('Error creating user', {
        error: error.message,
        email: createUserDto.email,
      });
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDTO): Promise<User> {
    try {
      this.logger.log(`Updating user with ID: ${id}`);

      const user = await this.findOne(id);

      // Check if email is being updated and if it already exists
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userModel.findOne({
          where: { email: updateUserDto.email },
        });

        if (existingUser) {
          throw new ConflictException('Email already exists');
        }
      }

      const updatedUser = await user.update({ ...updateUserDto });
      this.logger.log(`Successfully updated user with ID: ${id}`);
      return updatedUser;
    } catch (error) {
      this.winstonLogger.error('Error updating user', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      this.logger.log(`Deleting user with ID: ${id}`);

      const user = await this.findOne(id);
      await user.destroy();

      this.logger.log(`Successfully deleted user with ID: ${id}`);
    } catch (error) {
      this.winstonLogger.error('Error deleting user', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }
}
