import { TestBed } from '@angular/core/testing';

import { GlobalMessageService } from './global-message.service';

describe('GlobalMessageService', () => {
  let service: GlobalMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlobalMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
