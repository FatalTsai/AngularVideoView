import { Component, OnInit, ViewChild, ElementRef, Input, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventEmitter } from 'events';

@Component({
  selector: 'app-video-container',
  templateUrl: './video-container.component.html',
  styleUrls: ['./video-container.component.css']
})
export class VideoContainerComponent implements OnInit {
  @Input() isplaying : boolean
  @Input() playstat : object

  @ViewChild('player',{static : true}) player : ElementRef //document.getElementById("player") 
  //https://stackoverflow.com/questions/48226868/document-getelementbyid-replacement-in-angular4-typescript
  //https://stackoverflow.com/questions/56704164/angular-viewchild-error-expected-2-arguments-but-got-1

  forward()
  {
    //this.player.nativeElement.currentTime+=120
    this.player.nativeElement.play();
    console.log("click!!")
  }
  public onTimeUpdate(value){
    //console.log(value.target.currentTime);
    //this.video_player = value.target
   
    //value.target.currentTime =1000;
    //ref : https://stackoverflow.com/questions/48059697/angular-5-get-current-time-of-video

    console.log("this.isplaying = "+this.isplaying)

    }
 

  ngOnInit() {
    //this.name = this.route.snapshot.paramMap; // <-- 從route的snapshot取得Router Parameter:name
    //console.log("this.name = "+this.name)
  }

  ngOnChanges(changes :SimpleChanges) {
    console.dir(changes['isplaying']);
   /* 
    if(this.isplaying)
    {
      this.player.nativeElement.play();
    }
    else
    {
      this.player.nativeElement.pause();
    }
*/
    console.log("playstat['this.isplaying'] = "+this.playstat['isplaying'])
    if(this.playstat["isplaying"])
    {
      this.player.nativeElement.play();
    }
    else
    {
      this.player.nativeElement.pause();
    }




}


}
