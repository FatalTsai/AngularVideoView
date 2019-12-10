import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-video-container',
  templateUrl: './video-container.component.html',
  styleUrls: ['./video-container.component.css']
})
export class VideoContainerComponent implements OnInit {
  @Input() test : string
  @ViewChild('player',{static : true}) player : ElementRef //document.getElementById("player") 
  @ViewChild('play',{static :true}) play :ElementRef
  

  forward()
  {
    //this.player.nativeElement.currentTime+=120
    this.player.nativeElement.pause();
    console.log("click!!")
  }

  public onTimeUpdate(value){
    //console.log(value.target.currentTime);
    //this.video_player = value.target
    
    console.log(this.test)
   

    //value.target.currentTime =1000;
    //ref : https://stackoverflow.com/questions/48059697/angular-5-get-current-time-of-video
    }
 

  name
  ngOnInit() {
    console.log(this.test)
    //this.name = this.route.snapshot.paramMap; // <-- 從route的snapshot取得Router Parameter:name
    //console.log("this.name = "+this.name)
  }



}
