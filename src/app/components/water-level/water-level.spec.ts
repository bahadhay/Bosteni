import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaterLevel } from './water-level';

describe('WaterLevel', () => {
  let component: WaterLevel;
  let fixture: ComponentFixture<WaterLevel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaterLevel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaterLevel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
