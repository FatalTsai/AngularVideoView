import { Component, OnInit, ViewChild, ElementRef, Input, Output, SimpleChange, SimpleChanges ,EventEmitter, AfterViewInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { tick } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import panzoom from "panzoom";
import { CommonSvc } from '../common.svc';
import html2canvas from 'html2canvas';

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
  @ViewChild('downloadLink',{static:true}) downloadLink: ElementRef;
  //@ViewChild('canvas',{static:true}) canvas: ElementRef;

  //https://stackoverflow.com/questions/48226868/document-getelementbyid-replacement-in-angular4-typescript
  //https://stackoverflow.com/questions/56704164/angular-viewchild-error-expected-2-arguments-but-got-1

  filter = 'brightness(100%)   saturate(100%) contrast(100%)'

  server_url ='http://localhost:1386/api/video/'
  //video_url='assets/1 Second Video.mp4'
  video_url ='dvr17.MP4'
  snapshotName : String
  userImageType: String
  imageTypes   : String
  constructor(private sanitizer: DomSanitizer,
    private svc: CommonSvc,
    private route : ActivatedRoute,
    private router : Router) {
    this.svc.mySub.subscribe(
      (val) =>{
        this.video_url = this.server_url +val
        console.log('video_url = '+val)
        this.player.nativeElement.load()
        //this.router.navigate(['filelist'],{relativeTo:this.route})

      }
    )

    this.svc.imgSub.subscribe(
      (val) =>{
        console.log('from imgsub: '+val)

        /*
        html2canvas(this.player.nativeElement).then(canvas => {
          //this.canvas.nativeElement.src = canvas.toDataURL();
          this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
          this.downloadLink.nativeElement.download = 'marble-diagram.png';
          this.downloadLink.nativeElement.click();
          console.log(this.downloadLink.nativeElement)
          
        });*/
        
        const canvasElement = <HTMLCanvasElement> document.createElement('CANVAS');
        const video = this.player.nativeElement;
        const context = canvasElement.getContext('2d');
        let w: number, h: number, ratio: number;
        ratio = video.videoWidth / video.videoHeight;
        w = video.videoWidth - 100;
        h = w / ratio;
        canvasElement.width = w;
        canvasElement.height = h;
        context.fillRect(0, 0, w, h);
        context.drawImage(video, 0, 0, w, h);
        
        console.log('from imgsub: '+context)
        /*
        try{
        console.log(''+canvasElement.toDataURL())
        }
        catch(e)
        {
          console.log(e)
        }*/
        try{
        const link = document.createElement('a');
        //this.snapshotName = this.snapshotName !== '' ?  this.snapshotName : 'snapshot';
        //this.userImageType = this.imageTypes.indexOf(this.userImageType.toUpperCase()) >= 0 ? this.userImageType.toUpperCase() : 'PNG';
        //link.setAttribute('download', this.snapshotName + '.' + this.userImageType);
        link.setAttribute('download', 'fuck.png');

        const dataURL = canvasElement.toDataURL();
        link.href = dataURL;
        console.log('from : '+JSON.stringify(link))
        document.body.appendChild(link);
        link.click();
        }catch(e){
          console.log(e)
        }
        /*
        
        */
      }
    )



  }
  public getSantizeUrl(url : string) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
  }


  public onTimeUpdate(value){
    //console.log(this.player.nativeElement.duration)
    //console.log(value.target.currentTime);
    //console.log("ispaused = "+this.player.nativeElement.paused		)
    //console.log("isfullscreen? = "+ (this.player.nativeElement.webkitFullscreenElement ))
    this.playstat["currentTime"] = value.target.currentTime
    if(this.playstat["currentTimeInt"] != Math.round(value.target.currentTime))
    {
        this.PlaystatModified();
    }
    this.playstat["currentTimeInt"] = Math.round(value.target.currentTime)
    this.playstat["LabelcurrentTime"] = new Date(1970, 0, 1).setSeconds(value.target.currentTime)
    this.playstat["duration"] = value.target.duration
    this.playstat["Labelduration"] = new Date(1970, 0, 1).setSeconds(value.target.duration)
    this.playstat['buffering'] = false
    this.watermark.nativeElement.style='visibility: hidden'


    //this.player.nativeElement.onabort=console.log("The video duration has onloadstart");

    //console.log(this.timebar.nativeElement.max)
    //ref : https://stackoverflow.com/questions/48059697/angular-5-get-current-time-of-video
  }
  PlaystatModified()
  {
    this.playstatModified = !this.playstatModified;
    this.change.emit(this.playstatModified)
  }

  onplay()
  {
    this.playstat['isplaying'] = true
    this.PlaystatModified()
    //console.log("start playing ")
  }
  onpause()
  {
    this.playstat['isplaying'] = false
    this.PlaystatModified()
    //console.log("starting pausing")
  }

  click()
  {
    //var elem = document.getElementById("myvideo");

  }
  

  ngOnInit() {
    this.player.nativeElement.style = this.filter
    this.player.nativeElement.controls = false //none display control buttons
   // console.log('player = '+JSON.stringify(this.player))

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
    //console.log(this.player.nativeElement.style)

    //console.log(this.panZoomController)
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
     /* if (this.player.nativeElement.requestFullscreen) {
        console.log("first")
        this.player.nativeElement.requestFullscreen();
      } else */
      //stop using this due to ---> requestfullscreen api can only be initiated by a user gesture
      
      if (this.player.nativeElement.webkitRequestFullscreen) {
        console.log("webkit")
        this.player.nativeElement.webkitRequestFullscreen();
      }
       else if (this.player.nativeElement.mozRequestFullScreen) {
        console.log("moz")
        this.player.nativeElement.mozRequestFullScreen();
      } else if (this.player.nativeElement.msRequestFullscreen) {
        console.log("ms")
        this.player.nativeElement.msRequestFullscreen();
      }


    }


  }

  panZoomController;
  zoomLevels: number[];
  currentZoomLevel: number;

  zoom(scale) {
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
        console.log("in zoomAbs scale = "+scale)
        this.panZoomController.zoomAbs(offsetX, offsetY, scale);
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
      maxZoom: 3,
      minZoom: 0.7,
      bounds: {
        top: 150,
        right: 50,
        bottom: 50,
        left: 150,
      },
      zoomDoubleClickSpeed: 1, //value of 1 will disable double click zoom completely.
      //bounds:false,
      boundsPadding: 0.1,
      beforeWheel: function(e) {
        // allow wheel-zoom only if altKey is down. Otherwise - ignore
        var shouldIgnore = !e.altKey;
        return shouldIgnore;
      },
   /*
      beforeMouseDown: function(e) {
        // allow mouse-down panning only if altKey is down. Otherwise - ignore
        var shouldIgnore = !e.altKey;
        return shouldIgnore;
      }*/
    
      

    });

    //use method ref : 
    //https://developer.mozilla.org/en-US/docs/Web/API/Element/fullscreenchange_event
    //https://stackoverflow.com/questions/41609937/how-to-bind-event-listener-for-rendered-elements-in-angular-2
    this.player.nativeElement.addEventListener('webkitfullscreenchange', (event) => {
      // document.fullscreenElement will point to the element that
      // is in fullscreen mode if there is one. If not, the value
      // of the property is null.
      if (document.fullscreenElement) {
        console.log(`Element: ${document.fullscreenElement.id} entered fullscreen mode.`);
      } else {
        console.log('Leaving full-screen mode.');
        this.playstat["isfullscreen"] = false
        this.PlaystatModified()
      }
    }).bind(this);




    
    
    //console.log("panzoomController = "+this.panZoomController)
    /*
    this.panZoomController.on('zoom', function(e) {
      console.log('Fired when `element` is zoomed', e);
      console.log(e.getTransform() )
      //console.log(this.playstat)
      this.playstat['zoom'] = e.getTransform().scale
      console.log("playstat[zoom] = "+this.playstat["zoom"])
      this.PlaystatModified("from panzoom");

    }.bind(this));
 */
  }
 

}
