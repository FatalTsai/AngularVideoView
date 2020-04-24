import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-titlebar',
  templateUrl: './titlebar.component.html',
  styleUrls: ['./titlebar.component.css']
})
export class TitlebarComponent implements OnInit {

  constructor(
    iconRegistry: MatIconRegistry, 
    sanitizer: DomSanitizer)
    {
      iconRegistry.addSvgIcon(
        'folder_add',
        sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/folder_add.svg'));
      iconRegistry.addSvgIcon(
        'camera',
        sanitizer.bypassSecurityTrustResourceUrl('assets/titlebar/camera.svg'));
      iconRegistry.addSvgIcon(
        'setting',
        sanitizer.bypassSecurityTrustResourceUrl('assets/titlebar/setting.svg'));
      iconRegistry.addSvgIcon(
        'minimize',
        sanitizer.bypassSecurityTrustResourceUrl('assets/titlebar/minimize.svg'));
      iconRegistry.addSvgIcon(
        'fullscreen',
        sanitizer.bypassSecurityTrustResourceUrl('assets/titlebar/fullscreen.svg'));  
      iconRegistry.addSvgIcon(
        'unfullscreen',
        sanitizer.bypassSecurityTrustResourceUrl('assets/titlebar/unfullscreen.svg'));
      iconRegistry.addSvgIcon(
        'close',
        sanitizer.bypassSecurityTrustResourceUrl('assets/titlebar/close.svg'));
  }  

  ngOnInit() {
  }

}
