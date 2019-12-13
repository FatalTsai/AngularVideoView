import { Component, Input } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Router,ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  playstat  = {
    "isplaying":true
  }
  test = "test la"   
  isplaying = true
 

  title = 'viewer';
  constructor(  public router: Router , public route : ActivatedRoute) {}

  name : String
  ngOnInit() {

    //this.name = this.route.snapshot.paramMap.get('name'); // <-- 從route的snapshot取得Router Parameter:name
    //console.log("this.name = "+this.name)
    console.log("router.url = "+ this.router.url)
    
   
    localStorage["playstat"] = JSON.stringify(this.playstat)
    
    //console.log(localStorage["playstat"]["currentTime"])
    var data =  JSON.parse(localStorage["playstat"])
    console.log(data["currentTime"])

/*
    localStorage["cur"]=240;
    console.log("localStorage[\"cur\"] = "+localStorage["cur"] )
*/

  }

  update(event){
    this.isplaying = event
    console.log("fuck")
  }
  playstatUpadte(event){
    this.playstat = event
    console.log("fuck")
  }
  
}
