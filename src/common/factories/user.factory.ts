import { CreateUserDTO } from '../../users/dto/create-user.dto';
import { UpdateUserDTO } from '../../users/dto/update-user.dto';
import { UserRole } from '../../users/user-role.enum';

export class UserFactory {
  static createUserDto(overrides: Partial<CreateUserDTO> = {}): CreateUserDTO {
    return {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'SecurePassword123!',
      role: UserRole.USER,
      ...overrides,
    };
  }

  static updateUserDto(overrides: Partial<UpdateUserDTO> = {}): UpdateUserDTO {
    return {
      name: 'John Doe Updated',
      email: 'john.updated@example.com',
      password: 'NewSecurePassword123!',
      role: UserRole.ADMIN,
      ...overrides,
    };
  }

  static createAdminUserDto(
    overrides: Partial<CreateUserDTO> = {},
  ): CreateUserDTO {
    return this.createUserDto({
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      ...overrides,
    });
  }

  static createMultipleUsers(count: number): CreateUserDTO[] {
    return Array.from({ length: count }, (_, index) => ({
      name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`,
      password: 'SecurePassword123!',
      role: index % 2 === 0 ? UserRole.USER : UserRole.ADMIN,
    }));
  }

  static createUserWithXSS(): CreateUserDTO {
    return this.createUserDto({
      name: '<script>alert("XSS")</script>',
      email: 'xss@example.com',
    });
  }

  static createUserWithSQLInjection(): CreateUserDTO {
    return this.createUserDto({
      name: "'; DROP TABLE users; --",
      email: 'sql@example.com',
    });
  }
}
