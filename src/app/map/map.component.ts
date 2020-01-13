//https://stackblitz.com/edit/google-maps-api?file=app%2Fgoogle%2Fgoogle.component.ts
//http://cloverhsc.blogspot.com/2018/07/google-map-api-angular-6-1.html
//https://developers.google.com/maps/documentation/javascript/tutorial
import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  @ViewChild("mapRef",{static : true}) mapRef: ElementRef;
  constructor( @Inject(DOCUMENT) private document,
    private elementRef: ElementRef) {
  };

  ngAfterViewInit() {
    var s = this.document.createElement("script");
    s.type = "text/javascript";
    s.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAhBhsozaS0TyM4OV2NgKqeHk2_oVsbnsw"; 
    this.elementRef.nativeElement.appendChild(s);

  }
  ngOnInit() {

    var self=this;
    setTimeout(function () {
      self.showMap();
    }, 2000)


  }

  showMap() {
    
    console.log(this.mapRef.nativeElement);
    const location = { lat: 25.0723177, lng: 121.574737 }; //it's in Neihu  >///<
    const bikestore ={lat: 25.0723177, lng: 121.574737 }
    var options = {
      center: location,
      zoom: 13
    }

    const map = new google.maps.Map(this.mapRef.nativeElement, options);
    this.addMarket(map, location);
  }
  addMarket(pos, map) {
    return new google.maps.Marker({
      position: pos,
      map: map,
    });
  }

}
