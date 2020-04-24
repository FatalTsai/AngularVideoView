import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatSliderModule} from '@angular/material/slider';
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
import { FilelistComponent } from './filelist/filelist.component'
import {MatListModule} from '@angular/material/list';

import { AngularResizedEventModule } from 'angular-resize-event';
import { AngularSplitModule } from 'angular-split';
import { ChatService } from 'src/chat.service';
import { SocketryComponent } from './socketry/socketry.component';
import { CommonSvc } from './common.svc';
import { TitlebarComponent } from './titlebar/titlebar.component';

//using in titlebar
import {MatDialogModule} from '@angular/material/dialog';
import { FileNameDialogComponent } from './titlebar/settingdialog/settingdialog.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import { ReactiveFormsModule} from '@angular/forms';


@NgModule({
  declarations: [
    AppComponent,
    VideoControlComponent,
    VideoContainerComponent,
    MapComponent,
    FileuploadComponent,
    FilelistComponent,
    SocketryComponent,
    TitlebarComponent,
    FileNameDialogComponent
    
    
    
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
    ResizableModule,
    MatListModule,
    AngularResizedEventModule,
    AngularSplitModule.forRoot(),
    MatDialogModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    FormsModule
     
  ],
  providers: [ChatService,CommonSvc],
  entryComponents:[FileNameDialogComponent], //https://majing.io/posts/10000004551171 
  //In the case of a dynamically loaded component and in order for a ComponentFactory to be generated, the component must also be added to the module’s entryComponents:
  bootstrap: [AppComponent]
})
export class AppModule { }
