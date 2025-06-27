import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { UserRole } from './user-role.enum';

@Table({
  tableName: 'users',
})
export class User extends Model {
  @Column
  name: string;

  @Column({
    unique: true,
    type: DataType.STRING,
  })
  email: string;

  @Column({
    type: DataType.STRING,
  })
  password: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
  })
  role: UserRole;
}
