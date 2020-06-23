import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { MatIconRegistry, MatDialogRef,VERSION, MatDialog} from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { FileNameDialogComponent } from './settingdialog/settingdialog.component';
import { filter } from 'rxjs/operators';
import * as html2canvas from "html2canvas";

@Component({
  selector: 'app-titlebar',
  templateUrl: './titlebar.component.html',
  styleUrls: ['./titlebar.component.css']
})
export class TitlebarComponent implements OnInit {
  version = VERSION;
  fileNameDialogRef: MatDialogRef <FileNameDialogComponent>;

  text = 'Some data I want to export';
  data = new Blob([this.text], {type: 'text/plain'});
  url = window.URL.createObjectURL(this.data);
  @ViewChild('download_link',{static :true})download_link :ElementRef
  @ViewChild('img',{static:true})img:ElementRef

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
    console.log('fuck titlebar')

    console.log('url = '+this.url)
    this.download_link.nativeElement.href=this.url
    //console.log('download_link = ' +this.download_link)
  }

  showhref()
  {
    console.log('href = '+this.download_link.nativeElement.href)
  }

  download(filename, text) {
//https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

downloadpic(filename, text) {
  //https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);
  
      element.style.display = 'none';
      document.body.appendChild(element);
  
      element.click();
  
      document.body.removeChild(element);
  }


   convertImageToCanvas(image) {
    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    console.log('image = '+JSON.stringify(image) )
    canvas.getContext("2d")
    console.log(canvas)
    //.drawImage(image, 0, 0);
  
    return canvas;
  }

  convertCanvasToImage(canvas) {
    var image = new Image();
    image.src = canvas.toDataURL("image/png");
    return image;
  }
  //https://x-team.com/blog/webcam-image-capture-angular/
  //https://stackblitz.com/edit/angular-html2canvas?file=src%2Fapp%2Fapp.component.ts
  //https://stackblitz.com/edit/canvas2img?file=app%2Fapp.component.ts
  snapshot(){
    console.log( JSON.stringify(this.convertImageToCanvas(this.img) ))

  }

  @ViewChild('screen',{static:true}) screen: ElementRef;
  @ViewChild('canvas',{static:true}) canvas: ElementRef;
  @ViewChild('downloadLink',{static:true}) downloadLink: ElementRef;

  downloadImage(){
    html2canvas(this.screen.nativeElement).then(canvas => {
      this.canvas.nativeElement.src = canvas.toDataURL();
      this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
      this.downloadLink.nativeElement.download = 'marble-diagram.png';
      this.downloadLink.nativeElement.click();
      console.log(this.downloadLink.nativeElement)
    });
  }


}


//https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
