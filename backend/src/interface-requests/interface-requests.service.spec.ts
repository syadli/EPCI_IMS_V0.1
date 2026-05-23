import { Test, TestingModule } from '@nestjs/testing';
import { InterfaceRequestsService } from './interface-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { GcsService } from '../gcs/gcs.service';

describe('InterfaceRequestsService', () => {
  let service: InterfaceRequestsService;

  const mockPrisma = {};
  const mockNotifications = {};
  const mockRealtime = {};
  const mockGcs = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterfaceRequestsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: RealtimeGateway, useValue: mockRealtime },
        { provide: GcsService, useValue: mockGcs },
      ],
    }).compile();

    service = module.get<InterfaceRequestsService>(InterfaceRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
