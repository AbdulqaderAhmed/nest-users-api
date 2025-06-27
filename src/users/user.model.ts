import {
  Column,
  IsEmail,
  Min,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';

@Table({
  tableName: 'users',
})
export class User extends Model<User> {
  @Column
  name: string;

  @IsEmail
  @Unique
  @Column
  email: string;

  @Min(8)
  @Column
  password: string;

  @Column
  role: 'USER' | 'ADMIN';
}
