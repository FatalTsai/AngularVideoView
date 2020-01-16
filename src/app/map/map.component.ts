//https://stackblitz.com/edit/google-maps-api?file=app%2Fgoogle%2Fgoogle.component.ts
//http://cloverhsc.blogspot.com/2018/07/google-map-api-angular-6-1.html
//https://developers.google.com/maps/documentation/javascript/tutorial
import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Direction } from '@angular/cdk/bidi';

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
      self.initMap();
    }, 2000)
  }

  showMap() {
    //https://shunnien.github.io/2018/10/04/GoogleMap-draw-line/
    const directionsService = new google.maps.DirectionsService();
    const directionsDisplay = new google.maps.DirectionsRenderer();

    console.log(this.mapRef.nativeElement);
    const location = { lat: 25.0723177, lng: 121.574737 }; //it's in Neihu  >///<
    const bikestore ={lat: 25.0723177, lng: 121.574737 }
    const building101 = { lat: 25.034010, lng: 121.562428 }
    var options = {
      center: location,
      zoom: 15
    }

    //ref : https://www.oxxostudio.tw/articles/201810/google-maps-19-directions.html
    //init map
    const map = new google.maps.Map(this.mapRef.nativeElement, options);
    this.addMarket(map, location);

    directionsDisplay.setMap(map);
/* 
//direction service
//routing setting 
var request : Object = {
      origin: { lat: 25.034010, lng: 121.562428 },
      destination: { lat: 25.037906, lng: 121.549781 },
      travelMode: 'DRIVING'
  };


  directionsService.route(request, function (result, status) {
    if (status == 'OK') {
        // reply the detail of each node in routing 
        console.log(result.routes[0].legs[0].steps);
        directionsDisplay.setDirections(result);
    } else {
        console.log(status);
    }
});*/
   
  }

   initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 13,
      center: {
        lat: 35.52868967362264,
        lng: 139.56509764371336
      },
      mapTypeId: 'roadmap',
    });
  
    var bikeLaneCoordinates = [{
        lat: 35.52868967362264,
        lng:  139.56509764371336
      },
      {
        lat: 35.528586353058095,
        lng: 139.56519597363808
      },
      {
        lat: 35.52848136597603,
        lng: 139.56529263711124
      },
      {
        lat: 35.52837137957425,
        lng: 139.56539763345592
      }
    ];
    var bikeLanePath = new google.maps.Polyline({
      path: bikeLaneCoordinates,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
  
    bikeLanePath.setMap(map);
  }



 
  addMarket(pos, map) {
    return new google.maps.Marker({
      position: pos,
      map: map,
    });
  }
}

