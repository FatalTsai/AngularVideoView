import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SocketryComponent } from './socketry.component';

describe('SocketryComponent', () => {
  let component: SocketryComponent;
  let fixture: ComponentFixture<SocketryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SocketryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SocketryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
