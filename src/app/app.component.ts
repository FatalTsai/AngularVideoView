import { Component, Input, ViewChild } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Router,ActivatedRoute } from '@angular/router';
import { ResizeEvent } from 'angular-resizable-element';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {


  playstat  = {
    "isplaying":true,
    "currentTime":0,
    "currentTimeInt":0,
    "duration":0,
    "LabelcurrentTime": 0,
    "Labelduration":0,
    "isfullscreen":false,
    "volume":0.2,
    "brightness":1,
    "saturate":1,
    "contrast":1,
    "buffering":false,
    "zoom":1
  }
  playstatModified = true
 



  constructor(  public router: Router , public route : ActivatedRoute) {}

  name : String
  ngOnInit() {
    //this.name = this.route.snapshot.paramMap.get('name'); // <-- 從route的snapshot取得Router Parameter:name
    console.log("router.url = "+ this.router.url)
    
  }

  update(event){
    this.playstatModified = event
    //console.log("playstat = " + JSON.stringify(this.playstat))
  }
  playstatUpadte(event){
    this.playstat = event
    //console.log("fuck")
  }
  
}
