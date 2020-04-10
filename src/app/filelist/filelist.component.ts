import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ChatService } from 'src/chat.service';
import * as moment from 'moment';

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
  folders: Section[] = [  ];
  message: string;
  messages: string[] = [];
  secretCode: string;
  disk_plugins :object
  ngOnInit() {
  
      this.fetchfilelist()

      this.chatService
      .getMessages()
      .subscribe((message: string) => {
        const currentTime = moment().format('hh:mm:ss a');
        this.disk_plugins = ( JSON.parse(message) )
        const messageWithTimestamp = `${currentTime}: ${message}`;
        this.messages.push(messageWithTimestamp);

        console.log(this.disk_plugins['now'])
        this.fetchfilelist()
      });

  }




  constructor(iconRegistry: MatIconRegistry, 
    sanitizer: DomSanitizer, 
    public router:Router,
    private http :HttpClient,
    private chatService :ChatService) {
    iconRegistry.addSvgIcon(
      'folder_add',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/folder_add.svg'));

    iconRegistry.addSvgIcon(
      'folder-minus',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/folder_minus.svg'));
 
    
    iconRegistry.addSvgIcon(
      'playlist-save',
      sanitizer.bypassSecurityTrustResourceUrl('assets/video-control/save.svg'));
 
    }

  sendMessage() {
      this.chatService.sendMessage(this.message);
      this.message = '';
    }

  fetchfilelist(){
    this.folders = [  ];

    this.http.get<any>('/api/usb', { observe: 'response' }).subscribe(res => {
      var name = res.body[0]
      var time = res.body[1]

      name.forEach(function(element,index){
        this.folders.push({
          name:element,
          updated: new Date(time[index])
        })
      }.bind(this));

      console.log(this.folders)
      
    });
  }
}
