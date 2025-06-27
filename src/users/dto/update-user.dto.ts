import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDTO } from './create-user.dto';

export class UpdateUserDTO extends PartialType(CreateUserDTO) {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe Updated',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john.updated@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'User password',
    example: 'NewSecurePassword123!',
  })
  password?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: ['USER', 'ADMIN'],
    example: 'ADMIN',
  })
  role?: string;
}
