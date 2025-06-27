import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './user-role.enum';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  declare id: number;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    maxLength: 50,
  })
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @Column({
    unique: true,
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  })
  declare email: string;

  @ApiProperty({
    description: 'User password (hashed)',
    example: 'hashedPassword123',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare password: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.USER,
  })
  declare role: UserRole;

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'Record last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  declare updatedAt: Date;
}
