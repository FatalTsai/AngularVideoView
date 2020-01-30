//https://stackblitz.com/edit/google-maps-api?file=app%2Fgoogle%2Fgoogle.component.ts
//http://cloverhsc.blogspot.com/2018/07/google-map-api-angular-6-1.html
//https://developers.google.com/maps/documentation/javascript/tutorial
import { Component, OnInit, ViewChild, ElementRef, Inject, Input, SimpleChanges } from '@angular/core';
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

  @Input() playstatModified : boolean =true;
  @Input() playstat : object


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
      self.setup();

    }, 300)
  }

  currentPos
  ngOnChanges(changes :SimpleChanges) {
    var currentTime = Math.round(this.playstat['currentTimeInt'])
    if(this.LaneCoordinates === undefined || this.bearing === undefined || this.marker === undefined){
      return
    }
    this.marker.setPosition(this.LaneCoordinates[currentTime])
    this.currentPos = this.LaneCoordinates[currentTime]
    this.setbox(this.bearing[currentTime]['bearing'])
    console.log(this.currentPos)
    console.log("map receive updated")
  }

  rotation = 146
  //marker.seticon example https://www.oxxostudio.tw/articles/201801/google-maps-6-marker-image.html
  //marker rotation and translate string to url example https://jsfiddle.net/hsf5m9a4/3/ 
  //marker url anchor attibute ref https://www.oxxostudio.tw/articles/201801/google-maps-6-marker-image.html 
  setbox(value){
    this.rotation = value
    const svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" 
    xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="46px" height="46px" 
    viewBox="0 0 46 46" enable-background="new 0 0 46 46" xml:space="preserve">  
    <g transform="rotate(${this.rotation}, 23, 23)">    
        <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="-186.8672" y1="20.1641" x2="-185.9678" y2="20.1641" gradientTransform="matrix(32.629 0 0 41.951 6105.625 -825.7549)">
            <stop offset="0"   style="stop-color:#0086CD"/>
            <stop offset="0.5" style="stop-color:#0086CD"/>
            <stop offset="0.5" style="stop-color:#0077B7"/>
            <stop offset="1"   style="stop-color:#0086CD"/>
        </linearGradient>    
        <polygon fill="url(#SVGID_1_)" points="23.001,1.241 37.677,38.979 23.001,30.594 8.324,38.979"/>    
        <path d="M38.556,40l-15.555-8.889L7.445,40L23.001,0L38.556,40z M23.001,2.481L9.204,37.958l13.797-7.884l13.796,7.884 L23.001,2.481z"/>  
    </g>
    
    </svg>`
    
    this.marker.setIcon({
      url : `data:image/svg+xml;charset=utf-8,
      ${encodeURIComponent(svg)}`, //encodes a text string as a valid component of a Uniform Resource Identifier (URI).

      anchor: new google.maps.Point(13, 13)

    })
  }
  bearing : object
  LaneCoordinates :object
  map = undefined;
  marker = undefined;


  setup(){
    this.http.get<any>('/api/location', { observe: 'response' }).subscribe(res => {
      let response: HttpResponse<any> = res;
      let status: number = res.status;
      let statusText: string = res.statusText;
      let headers: HttpHeaders = res.headers;

        
      this.LaneCoordinates = res.body
      const firstpoint = this.LaneCoordinates[0]
      console.log("first = "+JSON.stringify(firstpoint))


      this.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center:firstpoint,
        mapTypeId: 'roadmap',
      });
    
      
      var landpath = new google.maps.Polyline({
        path: this.LaneCoordinates,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
   
      //var latlng = new google.maps.LatLng(35.52, 139.56);
      //console.log("latling = "+JSON.stringify(latlng))
      this.marker = new google.maps.Marker({
        position: firstpoint,
        map: this.map,
    });

      //this.addMarket(this.map,firstpoint)
      landpath.setMap(this.map);

  });

  this.http.get<any>('/api/bearing', { observe: 'response' }).subscribe(res => {
    this.bearing = res.body
  });


}

/*

  showMap() { //set rolate icon
    //https://shunnien.github.io/2018/10/04/GoogleMap-draw-line/
    //const directionsService = new google.maps.DirectionsService();
    const directionsDisplay = new google.maps.DirectionsRenderer();

    console.log(this.mapRef.nativeElement);
    const building101 = { lat: 25.034010, lng: 121.562428 }
    var options = {
      center: building101,
      zoom: 15
    }

    //ref : https://www.oxxostudio.tw/articles/201810/google-maps-19-directions.html
    const map = new google.maps.Map(this.mapRef.nativeElement, options);
  
      this.marker = new google.maps.Marker({
      position: building101,
      map: map,
      title: "Your current location!"
  });
   
  }
*/
/*
  addMarket(pos, map) {
    return new google.maps.Marker({
      position: pos,
      map: map,
    });
  }
  //ref : https://shunnien.github.io/2018/10/04/GoogleMap-draw-line/
   initMap() {   //can draw polyline from backend data
     
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
        
        //this.addMarket(map,firstpoint)
        bikeLanePath.setMap(map);
    });

   

    
  }
*/

/*
  position = [25, 120];
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
  
  */
  


 
}

