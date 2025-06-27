import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { UserRole } from './user-role.enum';

@Table({
  tableName: 'users',
})
export class User extends Model {
  @Column
  declare name: string;

  @Column({
    unique: true,
    type: DataType.STRING,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
  })
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
  })
  declare role: UserRole;
}
