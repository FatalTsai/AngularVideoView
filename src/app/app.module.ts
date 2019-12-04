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


@NgModule({
  declarations: [
    AppComponent,
    VideoControlComponent,
    
    
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatSliderModule,
    HttpClientModule,
    FormsModule,
    PopupModule     
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
