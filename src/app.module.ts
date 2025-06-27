import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { UsersModule } from './users/users.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { loggerConfig } from './common/config/logger.config';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Winston logging module
    WinstonModule.forRoot(loggerConfig),

    // Rate limiting/throttling module
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000, // 1 second
            limit: 3, // 3 requests per second
          },
          {
            name: 'medium',
            ttl: 10000, // 10 seconds
            limit: 20, // 20 requests per 10 seconds
          },
          {
            name: 'long',
            ttl: 60000, // 1 minute
            limit: 100, // 100 requests per minute
          },
        ],
      }),
    }),

    // Enhanced database configuration
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_NAME', 'nest_users'),
        autoLoadModels: true,
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging:
          configService.get('NODE_ENV') === 'development' ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        dialectOptions: {
          ssl:
            configService.get('NODE_ENV') === 'production'
              ? {
                  require: true,
                  rejectUnauthorized: false,
                }
              : undefined,
        },
        define: {
          timestamps: true,
          underscored: true,
          paranoid: true, // Enable soft deletes
        },
        retry: {
          match: [
            /ConnectionError/,
            /ConnectionRefusedError/,
            /ConnectionTimedOutError/,
            /TimeoutError/,
          ],
          max: 3,
        },
      }),
    }),

    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
