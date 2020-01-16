//https://stackblitz.com/edit/google-maps-api?file=app%2Fgoogle%2Fgoogle.component.ts
//http://cloverhsc.blogspot.com/2018/07/google-map-api-angular-6-1.html
//https://developers.google.com/maps/documentation/javascript/tutorial
import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
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
      { lat: 35.29566208343522, lng: 138.944034952569 },
      { lat: 35.2957254089181, lng: 138.9439732881076 },
      { lat: 35.29578040207533, lng: 138.94391829014288 },
      { lat: 35.29585039336635, lng: 138.94384829273324 },
      { lat: 35.29585039336635, lng: 138.94384829273324 },
      { lat: 35.29593371633186, lng: 138.94376496248364 },
      { lat: 35.295962046140126, lng: 138.94373663019877 },
      { lat: 35.29598870948908, lng: 138.9437099645189 },
      { lat: 35.296010373460106, lng: 138.943688298654 },
      { lat: 35.2960237051346, lng: 138.94367496581407 },
      { lat: 35.29602370501817, lng: 138.94366829970105 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.296030370971835, lng: 138.94366829939415 },
      { lat: 35.29604536910563, lng: 138.94365329994918 },
      { lat: 35.296065366617334, lng: 138.94363330068927 },
      { lat: 35.296093696425615, lng: 138.94360496840443 },
      { lat: 35.29612869207113, lng: 138.94356996969964 },
      { lat: 35.296170353553876, lng: 138.9435283045748 },
      { lat: 35.29621201503662, lng: 138.94348663945001 },
      { lat: 35.29625367640295, lng: 138.94343830821217 },
      { lat: 35.296302003722936, lng: 138.94338997666745 },
      { lat: 35.29635699688017, lng: 138.9433349787027 },
      { lat: 35.29641199000829, lng: 138.94327831420972 },
      { lat: 35.296461983700276, lng: 138.94322331647518 },
      { lat: 35.296516976857504, lng: 138.94316831851046 },
      { lat: 35.29657196998562, lng: 138.94311165401746 },
      { lat: 35.296628629747694, lng: 138.94306332208902 },
      { lat: 35.29669028874217, lng: 138.94300165770437 },
      { lat: 35.29675361431238, lng: 138.94294499282773 },
      { lat: 35.29680860758603, lng: 138.94289666097606 } ]


  
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

