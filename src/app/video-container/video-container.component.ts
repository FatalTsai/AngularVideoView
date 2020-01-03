import { Component, OnInit, ViewChild, ElementRef, Input, Output, SimpleChange, SimpleChanges ,EventEmitter, AfterViewInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { tick } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import panzoom from "panzoom";
import { SCALE } from '@progress/kendo-angular-popup';

@Component({
  selector: 'app-video-container',
  templateUrl: './video-container.component.html',
  styleUrls: ['./video-container.component.css']
})



export class VideoContainerComponent implements OnInit,AfterViewInit {
  @Input() playstatModified : boolean = true
  @Input() playstat : object
  @Output() change: EventEmitter<any> = new EventEmitter<any>()
  @Output() playstatUpadte :EventEmitter<object> = new EventEmitter<object>()
  @ViewChild('player',{static : true}) player : ElementRef //document.getElementById("player") 
  @ViewChild('watermark',{static :true})watermark :ElementRef
  @ViewChild('videoframe',{static :true})videoframe :ElementRef

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


    //this.player.nativeElement.onabort=console.log("The video duration has onloadstart");

    //console.log(this.timebar.nativeElement.max)
    //ref : https://stackoverflow.com/questions/48059697/angular-5-get-current-time-of-video
  }
  PlaystatModified(value)
  {
    console.log(value)
    this.playstatModified = !this.playstatModified;
    this.change.emit(this.playstatModified)
  }


  click()
  {
    //var elem = document.getElementById("myvideo");

  }
  

  ngOnInit() {
    this.player.nativeElement.style = this.filter
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
    " contrast(" + this.playstat['contrast']+ ")"  //error clear panzoom/transform data
    this.player.nativeElement.style=this.filter + ";  transform : " + this.player.nativeElement.style["transform"] 
    console.log(this.player.nativeElement.style)

    console.log(this.panZoomController)
   // this.panZoomController.setTransformOrigin({x: 0, y: 0}); // now it is topLeft
    this.zoom(this.playstat["zoom"])
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

  panZoomController;
  zoomLevels: number[];
  currentZoomLevel: number;

  zoom(scale) {
    console.log("fuck ou")
    const isSmooth = false;
    //const scale = this.currentZoomLevel;


    if (scale) {
      const transform = this.panZoomController.getTransform();
      const deltaX = transform.x;
      const deltaY = transform.y;
      const offsetX = scale + deltaX;
      const offsetY = scale + deltaY;

      if (isSmooth) {
        this.panZoomController.smoothZoom(0, 0, scale);
      } else {
        this.panZoomController.zoomTo(offsetX, offsetY, scale);
      }
    }

  }
  /* ref: https://stackblitz.com/edit/angular-panmaw
  zoomToggle(zoomIn: boolean) {

    if(zoomIn)
    {
      this.panZoomController.zoomIn();
    }
    else{
      this.panZoomController.zoomOut();
    }


    /*
    const idx = this.zoomLevels.indexOf(this.currentZoomLevel);
    if (zoomIn) {
      if (typeof this.zoomLevels[idx + 1] !== 'undefined') {
        this.currentZoomLevel = this.zoomLevels[idx + 1];
      }
    } else {
      if (typeof this.zoomLevels[idx - 1] !== 'undefined') {
        this.currentZoomLevel = this.zoomLevels[idx - 1];
      }
    }
    if (this.currentZoomLevel === 1) {
      this.panZoomController.moveTo(0, 0);
      this.panZoomController.zoomAbs(0, 0, 1);
    } else {
      this.zoom();
    }*/
  //}

  ngAfterViewInit() {

    //this.zoomLevels = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
    //this.currentZoomLevel = this.zoomLevels[4];
    // panzoom(document.querySelector('#scene'));
    //console.log("panzoom = "+panzoom)
    console.log("this.play.native = "+JSON.stringify(this.player.nativeElement) )
    //ref (set panzoom bounds): https://github.com/anvaka/panzoom/issues/33
    //ref :https://github.com/anvaka/panzoom#readme
    // https://timmywil.com/panzoom/demo/
  
    this.panZoomController = panzoom(this.player.nativeElement , {
      maxZoom: 10,
      minZoom: 0.3,
      bounds: {
        top: 150,
        right: 50,
        bottom: 50,
        left: 150,
      },
      //bounds:false,
      boundsPadding: 0.1,

    });
    
    //console.log("panzoomController = "+this.panZoomController)
    this.panZoomController.on('zoom', function(e) {
      console.log('Fired when `element` is zoomed', e);
      console.log(e.getTransform() )
      //console.log(this.playstat)
      this.playstat['zoom'] = e.getTransform().scale
      console.log("playstat[zoom] = "+this.playstat["zoom"])
      this.PlaystatModified("from panzoom");

    }.bind(this));

  }


}
