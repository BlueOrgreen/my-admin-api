import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { APP_GUARD } from '@nestjs/core';

import { JwtModule, JwtService } from '@nestjs/jwt';

import { database } from './config';
import { LoginGuard } from './modules/auth/login.guard';
import { DatabaseModule } from './modules/database/database.module';
import { OrgModule } from './modules/org/org.module';
import { SystemModule } from './modules/system/system.module';

const envFilePath = ['.env'];

export const IS_DEV = process.env.NODE_ENV !== 'prod';

if (IS_DEV) {
    envFilePath.unshift('.env.dev');
} else {
    envFilePath.unshift('.env.prod');
}

@Module({
    imports: [
        DatabaseModule.forRoot(database),
        SystemModule,
        OrgModule,
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath,
        }),
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: `${60 * 60 * 24}s`,
            },
        }),
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: LoginGuard,
        },
        JwtService,
    ],
})
export class AppModule {}
