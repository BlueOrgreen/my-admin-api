import { Injectable } from '@nestjs/common';

import ExcelJS from 'exceljs';
import { FastifyReply } from 'fastify';
import { SelectQueryBuilder } from 'typeorm';

import { BaseService } from '@/modules/database/base';

import { paginate } from '@/modules/database/helpers';
import { QueryHook } from '@/modules/database/types';

import { CreateStationDto, QueryStationDto } from '../dtos';
import { OrgEntity, StationEntity } from '../entities';
import { StationRepository } from '../repositories';

// 岗位查询接口
type FindParams = {
    [key in keyof Omit<QueryStationDto, 'limit' | 'page'>]: QueryStationDto[key];
};

@Injectable()
export class StationService extends BaseService<StationEntity, StationRepository, FindParams> {
    constructor(protected repository: StationRepository) {
        super(repository);
    }

    /**
     * 新建岗位
     */
    async create(data: CreateStationDto) {
        const detail = await super.create(data);
        return this.repository.save(detail);
    }

    /**
     * 获取分页数据
     */
    async paginateType(options?: QueryStationDto, callback?: QueryHook<StationEntity>) {
        const qb = await this.buildListStationQB(this.repository.buildBaseQB(), options, callback);
        return paginate(qb, options);
    }

    /**
     * Excel 导出
     */
    async exportExcel(options?: QueryStationDto, response?: FastifyReply) {
        const stationList = await (
            await this.buildListStationQB(this.repository.buildBaseQB(), options)
        ).getMany();
        // console.log('excel stationList', stationList);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet();
        // 定义表格字段以及填充数据
        worksheet.columns = [
            { header: '岗位名称', key: 'name', width: 32 },
            { header: '机构名称', key: 'orgMap', width: 42 },
            { header: '状态', key: 'state' },
            { header: '描述', key: 'describe' },
        ];
        worksheet.addRows(stationList);
        // 处理加工数据
        worksheet.eachRow((row: any, rowNumber: number) => {
            if (rowNumber > 1) {
                // 翻译state值
                const stateCell = row.getCell('state');
                stateCell.value = stateCell.value ? '启用' : '禁用';
                // 获取对象中的机构值
                const orgCell = row.getCell('orgMap');
                orgCell.value = orgCell.value.label;
            }
        });
        // 最后输出
        const buffer = await workbook.xlsx.writeBuffer();
        response.send(buffer);
    }

    /**
     * 加入关联机构查询
     */
    protected async buildListStationQB(
        queryBuilder: SelectQueryBuilder<StationEntity>,
        options: FindParams,
        callback?: QueryHook<StationEntity>,
    ) {
        // 调用buildListQB组装条件查询，再此基础上加入对org的关联
        return (await this.buildListQB(queryBuilder, options, callback)).leftJoinAndMapOne(
            `station.orgMap`,
            OrgEntity,
            'org',
            'station.org_id=org.id',
        );
    }
}
