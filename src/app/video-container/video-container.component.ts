import { Component, OnInit, ViewChild, ElementRef, Input, Output, SimpleChange, SimpleChanges ,EventEmitter} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-video-container',
  templateUrl: './video-container.component.html',
  styleUrls: ['./video-container.component.css']
})
export class VideoContainerComponent implements OnInit {
  @Input() playstatModified : boolean = true
  @Input() playstat : object
  @Output() change: EventEmitter<any> = new EventEmitter<any>()
  @Output() playstatUpadte :EventEmitter<object> = new EventEmitter<object>()

  @ViewChild('player',{static : true}) player : ElementRef //document.getElementById("player") 

  //
  //https://stackoverflow.com/questions/48226868/document-getelementbyid-replacement-in-angular4-typescript
  //https://stackoverflow.com/questions/56704164/angular-viewchild-error-expected-2-arguments-but-got-1

  public onTimeUpdate(value){
    console.log(value.target.currentTime);
    this.playstatModified = !this.playstatModified;
    this.playstat["currentTime"] = value.target.currentTime
    this.playstat["LabelcurrentTime"] = new Date(1970, 0, 1).setSeconds(value.target.currentTime)
    this.playstatUpadte.emit(this.playstat)
    this.change.emit(this.playstatModified)
    //console.log(this.timebar.nativeElement.max)
    //ref : https://stackoverflow.com/questions/48059697/angular-5-get-current-time-of-video
    }
 

  ngOnInit() {
    //this.name = this.route.snapshot.paramMap; // <-- 從route的snapshot取得Router Parameter:name
    //console.log("this.name = "+this.name)
  }

  ngOnChanges(changes :SimpleChanges) {
    //console.dir(changes['isplaying']);
    //console.log("playstat['this.isplaying'] = "+this.playstat['isplaying'])
    if(this.playstat["isplaying"])
    {
      this.player.nativeElement.play();
    }
    else
    {
      this.player.nativeElement.pause();
    }
    this.player.nativeElement.currentTime = this.playstat["currentTime"]




}


}
