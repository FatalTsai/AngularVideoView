import { Component, OnInit } from '@angular/core';
import { MatIconRegistry, MatDialogRef,VERSION, MatDialog} from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { FileNameDialogComponent } from './settingdialog/settingdialog.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-titlebar',
  templateUrl: './titlebar.component.html',
  styleUrls: ['./titlebar.component.css']
})
export class TitlebarComponent implements OnInit {
  version = VERSION;
  fileNameDialogRef: MatDialogRef <FileNameDialogComponent>;


  constructor(
    iconRegistry: MatIconRegistry, 
    sanitizer: DomSanitizer,
    private dialog: MatDialog)
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



  files = [
    { name: 'foo.js', content: ''},
    { name: 'bar.js', content: ''}
  ];

  dialogstyle={
    padding:"0px",
    background:"black",
    width: "700px",
    height: "600px",
  }
  openAddFileDialog() {
    this.fileNameDialogRef = this.dialog.open(FileNameDialogComponent,this.dialogstyle);

    this.fileNameDialogRef.afterClosed().pipe(
      filter(name => name)
    ).subscribe(name => {
      this.files.push({ name, content: ''});
    })
  }
  ngOnInit() {
  }

}



