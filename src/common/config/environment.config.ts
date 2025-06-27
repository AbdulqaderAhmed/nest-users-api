import { plainToClass, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  SERVER_PORT: number = 3000;

  @IsString()
  @IsOptional()
  DB_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  DB_PORT: number = 5432;

  @IsString()
  @IsOptional()
  DB_USERNAME: string = 'postgres';

  @IsString()
  @IsOptional()
  DB_PASSWORD: string = '';

  @IsString()
  @IsOptional()
  DB_NAME: string = 'nest_users';

  @IsString()
  @IsOptional()
  JWT_ACCESS_TOKEN: string = 'default-access-secret';

  @IsString()
  @IsOptional()
  JWT_REFRESH_TOKEN: string = 'default-refresh-secret';

  @IsString()
  @IsOptional()
  ALLOWED_ORIGINS: string = 'http://localhost:3000';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Configuration validation error: ${errors.toString()}`);
  }

  return validatedConfig;
}
