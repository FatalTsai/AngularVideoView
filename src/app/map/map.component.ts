//https://stackblitz.com/edit/google-maps-api?file=app%2Fgoogle%2Fgoogle.component.ts
//http://cloverhsc.blogspot.com/2018/07/google-map-api-angular-6-1.html
//https://developers.google.com/maps/documentation/javascript/tutorial
import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
declare var google: any; //https://stackoverflow.com/questions/51677452/angular-6-application-cannot-find-namespace-google
//solve : error TS2304: Cannot find name 'google'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {




  @ViewChild("mapRef",{static : true}) mapRef: ElementRef;
  constructor( @Inject(DOCUMENT) private document,
    private elementRef: ElementRef ,private http :HttpClient) {
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
    }, 1000)
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
  //ref : https://shunnien.github.io/2018/10/04/GoogleMap-draw-line/
   initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 15,
      center: {
        lat: 35.295962046140126, lng: 138.94373663019877
      },
      mapTypeId: 'roadmap',
    });
  
    var bikeLaneCoordinates =[ 
      { lat: 35.2954754400216, lng: 138.94422327885636 },
      { lat: 35.29552376734159, lng: 138.9441749473116 },
      { lat: 35.29559375863261, lng: 138.9441049499019 },
       ]

       this.http.get('/location')
       .subscribe((response) => {
           console.log('response received is ', response);
       })
   


  
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

