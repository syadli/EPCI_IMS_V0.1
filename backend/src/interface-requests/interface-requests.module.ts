import { Module } from '@nestjs/common';
import { InterfaceRequestsService } from './interface-requests.service';
import { InterfaceRequestsController } from './interface-requests.controller';

@Module({
  providers: [InterfaceRequestsService],
  controllers: [InterfaceRequestsController]
})
export class InterfaceRequestsModule {}
