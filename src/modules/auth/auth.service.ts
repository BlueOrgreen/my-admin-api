import { Injectable } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { isEmpty } from 'lodash';

import md5 from 'md5';

import { LoginUserDto } from '../org/dtos';
import { UserService } from '../org/services';
import { ACCOUNT_NOT_EXIST, LOGIN_ERROR, SUCCESS } from '../restful/base/code.constants';

import { REFRESH_TOKEN_EXPIRE_TIME, TOKEN_EXPIRE_TIME } from './constants';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * 登录
     */
    async signin(loginUserDto: LoginUserDto) {
        // 验证账号
        const userList = await this.userService.getUserAndRoles({
            account: loginUserDto.account,
            page: 1,
            limit: 1,
        });
        if (isEmpty(userList)) {
            return { code: ACCOUNT_NOT_EXIST, message: '该账号不存在' };
        }
        const user = userList[0];
        console.log('md5 password===>', md5(loginUserDto.password));

        // 验证密码
        if (user.password !== md5(loginUserDto.password)) {
            return { code: LOGIN_ERROR, message: '账号或密码错误' };
        }
        // 返回token
        const accessToken = this.jwtService.sign(
            {
                id: user.id,
                name: user.name,
                userRoles: user.userRoles,
            },
            {
                expiresIn: TOKEN_EXPIRE_TIME,
            },
        );
        console.log('accessToken===>', accessToken);

        const refreshToken = this.jwtService.sign(
            {
                id: user.id,
            },
            { expiresIn: REFRESH_TOKEN_EXPIRE_TIME },
        );
        console.log('refreshToken===>', refreshToken);

        // 返回登录后用户信息
        const userSigninAfterInfo = await this.userService.getUserSigninAfterInfo({
            userId: user.id,
        });
        return {
            status: SUCCESS,
            message: '登录成功',
            data: { user: userSigninAfterInfo, accessToken, refreshToken },
        };
    }

    /**
     * 刷新token
     */
    async refresh(refreshToken: string) {
        if (!refreshToken) {
            return null;
        }
        // 验证账号
        const data = this.jwtService.verify(refreshToken, {
            secret: process.env.JWT_SECRET,
        });
        // 查询需要的角色数据
        const userList = await this.userService.getUserAndRoles({
            id: data.id,
            page: 1,
            limit: 1,
        });
        if (isEmpty(userList)) {
            return { code: ACCOUNT_NOT_EXIST, message: '该账号不存在' };
        }
        const user = userList[0];
        // 返回token
        const accessToken = this.jwtService.sign(
            {
                id: user.id,
                name: user.name,
                userRoles: user.userRoles,
            },
            {
                expiresIn: TOKEN_EXPIRE_TIME,
            },
        );
        const newRefreshToken = this.jwtService.sign(
            {
                id: user.id,
            },
            { expiresIn: REFRESH_TOKEN_EXPIRE_TIME },
        );
        return { accessToken, refreshToken: newRefreshToken };
    }
}
