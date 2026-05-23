import { Test, TestingModule } from '@nestjs/testing';
import { InterfaceRequestsController } from './interface-requests.controller';

describe('InterfaceRequestsController', () => {
  let controller: InterfaceRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterfaceRequestsController],
    }).compile();

    controller = module.get<InterfaceRequestsController>(InterfaceRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
