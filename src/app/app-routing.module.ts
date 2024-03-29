import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VideoControlComponent } from './video-control/video-control.component';
import {MatIconRegistry} from '@angular/material/icon';
import { VideoContainerComponent } from './video-container/video-container.component';
import { MapComponent } from './map/map.component';
import { FileuploadComponent } from './fileupload/fileupload.component';
import { FilelistComponent } from './filelist/filelist.component';
import { SocketryComponent } from './socketry/socketry.component';
import { TitlebarComponent } from './titlebar/titlebar.component';





const routes: Routes = [
  //{path: '', redirectTo: 'video-control', pathMatch: 'full'},  
  {path: 'video-control', component: VideoControlComponent},
  {path: 'video-container',component :VideoContainerComponent},
  {path: 'map',component :MapComponent},
  {path :'fileupload',component:FileuploadComponent},
  {path : 'filelist',component:FilelistComponent},
  {path : 'socketry',component:SocketryComponent},
  {path : 'titlebar',component:TitlebarComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
