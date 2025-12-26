import { TestBed } from '@angular/core/testing';

import { GardenData } from './garden-data';

describe('GardenData', () => {
  let service: GardenData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GardenData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
