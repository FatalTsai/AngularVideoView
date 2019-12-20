import { Component, OnInit, ViewChild, ElementRef, Input, Output, SimpleChange, SimpleChanges ,EventEmitter} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { tick } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';

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
  @ViewChild('watermark',{static :true})watermark :ElementRef
  //https://stackoverflow.com/questions/48226868/document-getelementbyid-replacement-in-angular4-typescript
  //https://stackoverflow.com/questions/56704164/angular-viewchild-error-expected-2-arguments-but-got-1

  filter = 'brightness(100%)   saturate(100%) contrast(100%)'

 


  constructor(private sanitizer: DomSanitizer) {}
  public getSantizeUrl(url : string) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
  }


  public onTimeUpdate(value){
    //console.log(this.player.nativeElement.duration)
    console.log(value.target.currentTime);
    //console.log("ispaused = "+this.player.nativeElement.paused		)
    //console.log("isfullscreen? = "+ (this.player.nativeElement.webkitFullscreenElement ))
    this.playstat["currentTime"] = value.target.currentTime
    this.playstat["LabelcurrentTime"] = new Date(1970, 0, 1).setSeconds(value.target.currentTime)
    this.playstat["duration"] = value.target.duration
    this.playstat["Labelduration"] = new Date(1970, 0, 1).setSeconds(value.target.duration)
    this.playstat['buffering'] = false
    this.watermark.nativeElement.style='visibility: hidden'
    this.PlaystatModified();


    //this.player.nativeElement.onabort=console.log("The video duration has onloadstart");

    //console.log(this.timebar.nativeElement.max)
    //ref : https://stackoverflow.com/questions/48059697/angular-5-get-current-time-of-video
  }
  private PlaystatModified()
  {
    this.playstatModified = !this.playstatModified;
    this.change.emit(this.playstatModified)
  }


  click()
  {
    //var elem = document.getElementById("myvideo");

  }


  ngOnInit() {
    this.player.nativeElement.controls = false //none display control buttons


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
    this.player.nativeElement.volume=this.playstat['volume']
    this.filter ="filter: brightness("+this.playstat['brightness']+")" +
    " saturate(" + this.playstat['saturate']+ ")"+
    " contrast(" + this.playstat['contrast']+ ")"
    this.player.nativeElement.style =this.filter

    if(this.playstat['buffering'])
    {
      this.watermark.nativeElement.style ='  visibility: visible;'
    }
    else
    {
      this.watermark.nativeElement.style='visibility: hidden'
    }




    

    if(this.playstat['isfullscreen'])
    {
      if (this.player.nativeElement.requestFullscreen) {
        console.log("first")
        this.player.nativeElement.requestFullscreen();
      } else if (this.player.nativeElement.msRequestFullscreen) {
        console.log("ms")
        this.player.nativeElement.msRequestFullscreen();
      } else if (this.player.nativeElement.mozRequestFullScreen) {
        console.log("moz")
        this.player.nativeElement.mozRequestFullScreen();
      } else if (this.player.nativeElement.webkitRequestFullscreen) {
        console.log("webkit")
        this.player.nativeElement.webkitRequestFullscreen();
      }
    }


  }
}
