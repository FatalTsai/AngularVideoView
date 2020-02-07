import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';

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

    }
  folders: Section[] = [
    {
      name: 'Photos',
      updated: new Date('1/1/16'),
    },
    {
      name: 'Recipes',
      updated: new Date('1/17/16'),
    },
    {
      name: 'Work',
      updated: new Date('1/28/16'),
    }
  ];

  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer, public router:Router) {
    iconRegistry.addSvgIcon(
      'folder_add',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/folder_add.svg'));

    iconRegistry.addSvgIcon(
      'zoom-out',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/folder_minus.svg'));
 
    }

}
