import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-video-container',
  templateUrl: './video-container.component.html',
  styleUrls: ['./video-container.component.css']
})
export class VideoContainerComponent implements OnInit {

  
  video_player //document.getElementById("player") 

  forward()
  {
    this.video_player.currentTime+=60
    console.log("click!!")
  }

  public onTimeUpdate(value){
    //console.log(value.target.currentTime);
    this.video_player = value.target
    //value.target.currentTime =1000;
    //ref : https://stackoverflow.com/questions/48059697/angular-5-get-current-time-of-video
    }
 
  constructor(private route :ActivatedRoute) { }

  name
  ngOnInit() {
    this.name = this.route.snapshot.paramMap; // <-- 從route的snapshot取得Router Parameter:name
    console.log("this.name = "+this.name)
  }

}
