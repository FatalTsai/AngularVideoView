import { Component, OnInit, ViewChild, ElementRef, Output, Input, EventEmitter, SimpleChanges } from '@angular/core';
import {MatIconRegistry} from '@angular/material';
import {DomSanitizer} from '@angular/platform-browser';
import { Router } from '@angular/router';
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

  
  LabelcurrentTime = function () {
    return new Date(1970,0,0).setSeconds(this.playstat['currentTime'])
  }


currentTimeUpdate(event) {
  this.currentTime= new Date(1970,0,1).setSeconds(event.value)
  this.playstatModified = !this.playstatModified;
  this.playstat["currentTime"] = event.value
  this.playstatUpadte.emit(this.playstat)
  this.change.emit(this.playstatModified)
}




play(value)
{
  this.playstatModified = !this.playstatModified;
  this.playstat["isplaying"] = value
  this.playstatUpadte.emit(this.playstat)
  this.change.emit(this.playstatModified)
  
}
zoombarvalue :number = 0;

zoomout(){

  if(this.zoombarvalue >0)
    this.zoombarvalue -= 5;
  console.log("zoomout")
}
zoomin(){

  if(this.zoombarvalue <100)
    this.zoombarvalue += 5;
  console.log("zoomin")
}

volumebarvalue :number = 0;

volumelow(){

  if(this.volumebarvalue >0)
    this.volumebarvalue -= 5;
  console.log("volumelow")
}
volumehigh(){

  if(this.volumebarvalue <100)
    this.volumebarvalue += 5;
  console.log("volumehigh")
}

private toggleText: string = "Hide";
private show: boolean = true;

public onToggle(): void {
    this.show = !this.show;
    this.toggleText = this.show ? "Hidе" : "Show";
}



  ngOnInit() {
    console.log("playstat = " + JSON.stringify(this.playstat))
    //console.log("timebar = "+(this.timebar.max))
  }

  ngOnChanges(changes :SimpleChanges) {
    console.log("from control")
    this.timebar.value = this.playstat["currentTime"]
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
