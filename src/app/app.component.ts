import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Router,ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'viewer';
  constructor(  public router: Router , public route : ActivatedRoute) 
  {}

  name : String
  ngOnInit() {
    //this.name = this.route.snapshot.paramMap.get('name'); // <-- 從route的snapshot取得Router Parameter:name
    //console.log("this.name = "+this.name)
    console.log("router.url = "+ this.router.url)
  }

  
}
