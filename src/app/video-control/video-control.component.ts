import { Component, OnInit, ViewChild, ElementRef, Output, Input, EventEmitter, SimpleChanges } from '@angular/core';
import {MatIconRegistry} from '@angular/material';
import {DomSanitizer} from '@angular/platform-browser';
import { Router } from '@angular/router';
import {VideoLength } from 'video-length'


@Component({
  selector: 'app-video-control',
  templateUrl: './video-control.component.html',
  styleUrls: ['./video-control.component.css']
})
export class VideoControlComponent implements OnInit {
  @Input() playstatModified : boolean =true;
  @Input() playstat : object
  @Output() change: EventEmitter<any> = new EventEmitter<any>()
  @Output() playstatUpadte :EventEmitter<object> = new EventEmitter<object>()
  @ViewChild('timebar',{static : true}) timebar : any
  currentTime= new Date(1970, 0, 1).setSeconds(0);
  duration = new Date(1970, 0, 1).setSeconds(0);
  //currentTime= new Date(1970, 0, 1).setSeconds(this.playstat["currentTime"] ? this.playstat["currentTime"] : 0);
  //duration = new Date(1970, 0, 1).setSeconds(this.playstat["currentTime"] ? this.playstat["currentTime"] : 0);
  //ref :https://stackblitz.com/edit/angular-display-mat-slider-value?file=app%2Fslider-overview-example.ts

  
  


currentTimeUpdate(event) {
  this.currentTime= new Date(1970,0,1).setSeconds(event.value)
  this.playstat["currentTime"] = event.value
  this.playstatUpadte.emit(this.playstat)
  this.PlaystatModified()
}




play(value)
{
  this.playstat["isplaying"] = value
  this.change.emit(this.playstatModified)
  this.PlaystatModified()
  
  
}
zoombarvalue :number = 0;

zoomout(value){

  if(value){
    if(this.zoombarvalue >0)
      this.zoombarvalue -= 5;
    console.log("zoomout")
  }
  else
  {
    if(this.zoombarvalue <100)
    this.zoombarvalue += 5;
    console.log("zoomin")
  }
 
}


volumebarvalue :number = 0;
volumehigh(value){
  if(value == 1)
  {
    if(this.volumebarvalue <1)
      this.volumebarvalue += 0.05;
    console.log("volumehigh")
  }
  else if (value == 0)
  {    
    if(this.volumebarvalue >0)
    this.volumebarvalue -= 0.05;
    console.log("volumelow")
  }
  this.volumebarvalue = this.volumebarvalue>1 ? 1: this.volumebarvalue
  this.volumebarvalue = this.volumebarvalue<0 ? 0: this.volumebarvalue
  this.playstat['volume'] = this.volumebarvalue
  this.PlaystatModified()
}

fullscreen()
{
  this.PlaystatModified()
  this.playstatUpadte.emit(this.playstat)
  this.playstat["isfullscreen"] = true
}


brightnessbarvalue = 0
contrastbarvalue = 1
saturationbarvalue = 1 
filterupdate()
{
  this.playstat['brightness'] = this.brightnessbarvalue
  this.playstat['saturate'] =  this.saturationbarvalue
  this.playstat['contrast'] =  this.contrastbarvalue
  this.PlaystatModified()
}




private toggleText: string = "Hide";
private show: boolean = false;

public onToggle(): void {
    this.show = !this.show;
    this.toggleText = this.show ? "Hidе" : "Show";
}



  ngOnInit() {
    console.log("playstat = " + JSON.stringify(this.playstat))
    //console.log("timebar = "+(this.timebar.max)


  }

  ngOnChanges(changes :SimpleChanges) {
    //console.log("from control")
    this.timebar.value = this.playstat["currentTime"]
  }

  private PlaystatModified()
  {
    this.playstatModified = !this.playstatModified;
    this.change.emit(this.playstatModified)
  }


  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer, public router:Router) {
    iconRegistry.addSvgIcon(
      'equalizer',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/equalizer.svg'));

    iconRegistry.addSvgIcon(
      'zoom-out',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/zoom-out.svg'));
    iconRegistry.addSvgIcon(
      'zoom-in',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/zoom-in.svg'));
    iconRegistry.addSvgIcon(
      'player-first',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/player-first.svg'));

    iconRegistry.addSvgIcon(
      'player-previous',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/player-previous.svg'));
      
    iconRegistry.addSvgIcon(
      'player-stop',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/player-stop.svg'));

    iconRegistry.addSvgIcon(
      'player-play',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/player-play.svg'));

    iconRegistry.addSvgIcon(
      'player-pause',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/player-pause.svg'));

    iconRegistry.addSvgIcon(
      'player-next',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/player-next.svg'));

    iconRegistry.addSvgIcon(
      'player-last',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/player-last.svg'));

    iconRegistry.addSvgIcon(
      'fullscreen',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/fullscreen.svg'));

    iconRegistry.addSvgIcon(
      'volume-low',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/volume-low.svg'));
    iconRegistry.addSvgIcon(
      'volume-high',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/volume-high.svg'));

  }
}
