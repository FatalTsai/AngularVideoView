//https://stackblitz.com/edit/google-maps-api?file=app%2Fgoogle%2Fgoogle.component.ts
//http://cloverhsc.blogspot.com/2018/07/google-map-api-angular-6-1.html
//https://developers.google.com/maps/documentation/javascript/tutorial
import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
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
      self.initialize();

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

  addMarket(pos, map) {
    return new google.maps.Marker({
      position: pos,
      map: map,
    });
  }
  //ref : https://shunnien.github.io/2018/10/04/GoogleMap-draw-line/
   initMap() {
     
      //ref : https://blog.miniasp.com/post/2019/01/20/Angular-HttpClient-Pitfall-and-Tricks
      this.http.get<any>('/api/location', { observe: 'response' }).subscribe(res => {
        let response: HttpResponse<any> = res;
        let status: number = res.status;
        let statusText: string = res.statusText;
        let headers: HttpHeaders = res.headers;

          
        const LaneCoordinates = res.body
        const firstpoint = LaneCoordinates[0]
        console.log("first = "+JSON.stringify(firstpoint))


        var map = new google.maps.Map(document.getElementById('map'), {
          zoom: 15,
          center:firstpoint,
          mapTypeId: 'roadmap',
        });
      
        
        var bikeLanePath = new google.maps.Polyline({
          path: LaneCoordinates,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 2
        });
      
        this.addMarket(map,firstpoint)
        bikeLanePath.setMap(map);
    });

    

    
  }

  map = undefined;
  marker = undefined;
  position = [43, -89];
   initialize() { // sliding marker test ref:https://jsfiddle.net/rcravens/RFHKd/2363/
          
      var latlng = new google.maps.LatLng(this.position[0], this.position[1]);
      var myOptions = {
          zoom: 8,
          center: latlng,
          mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      this.map = new google.maps.Map(document.getElementById("map"), myOptions);
  
      this.marker = new google.maps.Marker({
          position: latlng,
          map: this.map,
          title: "Your current location!"
      });

      google.maps.event.addListener(this.map, 'click', function(me) {
          var result = [me.latLng.lat(), me.latLng.lng()];
          console.log(me.latLng.lat()+'  '+ me.latLng.lng())
          this.transition(result);
      }.bind(this));
  }
  
  numDeltas = 100;
  delay = 10; //milliseconds
  i = 0;
  moveMarker(deltaLat,deltaLng){
    //console.log("deltaLat = "+deltaLat)
    //console.log("deltaLng = "+deltaLng)
    this.position[0] += deltaLat;
    this.position[1] += deltaLng;
    var latlng = new google.maps.LatLng(this.position[0], this.position[1]);
    this.marker.setPosition(latlng);
    if(this.i!=this.numDeltas){
        this.i++;
  
        setTimeout(function(){
          this.moveMarker(deltaLat,deltaLng);
        }.bind(this), this.delay);
    }
}
  transition(result){
      this.i = 0;
      var deltaLat = (result[0] - this.position[0])/this.numDeltas;
      var deltaLng = (result[1] - this.position[1])/this.numDeltas;
      this.moveMarker(deltaLat,deltaLng);
  }
  
  


 
}

