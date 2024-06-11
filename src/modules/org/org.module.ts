import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { DatabaseModule } from '../database/database.module';

import * as systemRepositories from '../system/repositories';
import * as systemServices from '../system/services';

import * as controllers from './controllers';
import * as entities from './entities';
import * as repositories from './repositories';
import * as services from './services';

@Module({
    imports: [
        JwtModule.registerAsync({
            async useFactory() {
                return {
                    // 这里sign起作用，verify不起作用
                    secret: process.env.JWT_SECRET,
                };
            },
        }),
        TypeOrmModule.forFeature(Object.values(entities)),
        DatabaseModule.forRepository(Object.values(repositories)),
        DatabaseModule.forRepository(Object.values(systemRepositories)),
    ],
    controllers: [...Object.values(controllers), AuthController],
    providers: [...Object.values(services), ...Object.values(systemServices), AuthService],
    exports: [
        ...Object.values(services),
        DatabaseModule.forRepository(Object.values(repositories)),
    ],
})
export class OrgModule {}
