import { Injectable } from '@angular/core';
import {Subject} from 'rxjs';

@Injectable()
export class CommonSvc{

    public mySub = new Subject<any>();
    public counter: number = 0;
    public playingvideo :string =''
  increaseCounter(){
    this.counter++;
    this.mySub.next(this.counter);
  }
  videoselct(name){
    this.playingvideo = name
    this.mySub.next(this.playingvideo)
    //console.log(this.playingvideo)
  }

}