import { Controller, Get, Query, Res } from '@nestjs/common';

import { FastifyReply } from 'fastify';

import { BaseController } from '@/modules/restful/base';

import { QueryStationDto } from '../dtos';
import { StationService } from '../services/station.service';

@Controller('station')
export class StationController extends BaseController<StationService> {
    constructor(protected service: StationService) {
        super(service);
    }

    @Get('list')
    list(@Query() options: QueryStationDto) {
        return this.service.list(options);
    }

    @Get('exportExcel')
    exportExcel(@Query() options: QueryStationDto, @Res() response: FastifyReply) {
        return this.service.exportExcel(options, response);
    }
}
