import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VideoControlComponent } from './video-control/video-control.component';
import {MatIconRegistry} from '@angular/material/icon';





const routes: Routes = [  
  {path: 'video-control', component: VideoControlComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
