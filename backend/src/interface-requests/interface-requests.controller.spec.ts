import { Test, TestingModule } from '@nestjs/testing';
import { InterfaceRequestsController } from './interface-requests.controller';
import { InterfaceRequestsService } from './interface-requests.service';
import { AuthGuard } from '../auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('InterfaceRequestsController', () => {
  let controller: InterfaceRequestsController;

  const mockIRService = {};
  const mockJwtService = {};
  const mockConfigService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterfaceRequestsController],
      providers: [
        {
          provide: InterfaceRequestsService,
          useValue: mockIRService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InterfaceRequestsController>(InterfaceRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
