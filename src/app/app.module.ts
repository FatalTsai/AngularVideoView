import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatSliderModule} from '@angular/material/slider';MatIconModule
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { VideoControlComponent } from './video-control/video-control.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PopupModule } from '@progress/kendo-angular-popup';
import { VideoContainerComponent } from './video-container/video-container.component';
import { MapComponent } from './map/map.component';
import { FileuploadComponent } from './fileupload/fileupload.component';
import { ResizableModule } from 'angular-resizable-element';
import { ResizableDirective } from './resizable.directive';
import { FilelistComponent } from './filelist/filelist.component'


@NgModule({
  declarations: [
    AppComponent,
    VideoControlComponent,
    VideoContainerComponent,
    MapComponent,
    FileuploadComponent,
    ResizableDirective,
    FilelistComponent
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatSliderModule,
    HttpClientModule,
    FormsModule,
    PopupModule,
    BrowserModule,
    ResizableModule     
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
