import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';

export interface Section {
  name: string;
  updated: Date;
}

@Component({
  selector: 'app-filelist',
  templateUrl: './filelist.component.html',
  styleUrls: ['./filelist.component.css']
})
export class FilelistComponent implements OnInit {
    ngOnInit() {
    
        console.log(this.folders)

        this.http.get<any>('/api/usb', { observe: 'response' }).subscribe(res => {
          var name = res.body[0]
          var time = res.body[1]

          name.forEach(function(element,index){
            this.folders.push({
              name:element,
              updated: new Date(time[index])
            })
          }.bind(this));

         console.log(this.folders)
          
        });

    }
  folders: Section[] = [
    
  ];




  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer, public router:Router,private http :HttpClient) {
    iconRegistry.addSvgIcon(
      'folder_add',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/folder_add.svg'));

    iconRegistry.addSvgIcon(
      'folder-minus',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/folder_minus.svg'));
 
    
    iconRegistry.addSvgIcon(
      'playlist-save',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/save.svg'));
 
    }


}
