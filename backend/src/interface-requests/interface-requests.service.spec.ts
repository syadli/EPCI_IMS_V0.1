import { Test, TestingModule } from '@nestjs/testing';
import { InterfaceRequestsService } from './interface-requests.service';

describe('InterfaceRequestsService', () => {
  let service: InterfaceRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InterfaceRequestsService],
    }).compile();

    service = module.get<InterfaceRequestsService>(InterfaceRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
