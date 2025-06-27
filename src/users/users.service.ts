import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async findAll(role?: 'USER' | 'ADMIN') {
    if (role) {
      // Validate role before querying database
      if (role !== 'USER' && role !== 'ADMIN') {
        throw new NotFoundException("No user's with this role found");
      }

      const roleArray = await this.userModel.findOne({ where: { role } });

      if (!roleArray)
        throw new NotFoundException("No user's with this role found");

      return roleArray;
    }
    return await this.userModel.findAll();
  }

  async findOne(id: number) {
    const user = await this.userModel.findByPk(id);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async create(createUserDto: CreateUserDTO): Promise<User> {
    const exsitingUser = await this.userModel.findOne({
      where: { email: createUserDto.email },
    });

    if (exsitingUser) throw new NotFoundException('Email already exists');

    const newUser = await this.userModel.create({ ...createUserDto });
    return newUser;
  }

  async update(id: number, updateUserDto: UpdateUserDTO) {
    const user = await this.findOne(id);

    if (!user) throw new NotFoundException('User not found');

    return await user.update({ ...updateUserDto }, { where: { id } });
  }

  async delete(id: number) {
    const removedUser = await this.findOne(id);

    if (!removedUser) throw new NotFoundException('User not found');

    return await removedUser.destroy();
  }
}
