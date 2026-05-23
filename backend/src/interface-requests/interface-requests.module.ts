import { Module } from '@nestjs/common';
import { InterfaceRequestsService } from './interface-requests.service';
import { InterfaceRequestsController } from './interface-requests.controller';
import { GcsModule } from '../gcs/gcs.module';

@Module({
  imports: [GcsModule],
  providers: [InterfaceRequestsService],
  controllers: [InterfaceRequestsController]
})
export class InterfaceRequestsModule {}
