import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VideoControlComponent } from './video-control/video-control.component';
import {MatIconRegistry} from '@angular/material/icon';
import { VideoContainerComponent } from './video-container/video-container.component';





const routes: Routes = [
  //{path: '', redirectTo: 'video-control', pathMatch: 'full'},  
  {path: 'video-control', component: VideoControlComponent},
  {path: 'video-container',component :VideoContainerComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
