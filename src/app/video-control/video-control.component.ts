import { Component, OnInit, ViewChild, ElementRef, Output } from '@angular/core';
import {MatIconRegistry} from '@angular/material';
import {DomSanitizer} from '@angular/platform-browser';
import { Router } from '@angular/router';
@Component({
  selector: 'app-video-control',
  templateUrl: './video-control.component.html',
  styleUrls: ['./video-control.component.css']
})
export class VideoControlComponent implements OnInit {
  @Output() test : String ="test test"
  timebar: number = 0;
  playstat
  timebar_value_label = new Date(1970,0,1).setSeconds(this.timebar);

  elapsed= new Date(1970, 0, 1).setSeconds(this.timebar);
  duration = new Date(1970, 0, 1).setSeconds(100);
  //elapsed :from started time ;  duration : how long the video last
 

//ref :https://stackblitz.com/edit/angular-display-mat-slider-value?file=app%2Fslider-overview-example.ts

timeupdate(event) {
  this.timebar = event.value;
  this.elapsed =new Date(1970,1,0).setSeconds(this.timebar)
  console.log(event.value)
}

zoombarvalue :number = 0;

isplaying : boolean =true;
play(value)
{
  console.log("isplaying = "+this.isplaying)

  this.playstat = JSON.parse(localStorage["playstat"])
 
  if(value){
    this.isplaying = true;
    this.playstat["isplaying"] = true
  }
  else{
    this.isplaying = false
    this.playstat["isplaying"] = false

  }
  localStorage["playstat"] = JSON.stringify(this.playstat)

}
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

  private toggleText: string = "Hide";
  private show: boolean = true;

  public onToggle(): void {
      this.show = !this.show;
      this.toggleText = this.show ? "Hidе" : "Show";
  }



  ngOnInit() {
    
  }

  

}
