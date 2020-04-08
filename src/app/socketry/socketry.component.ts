import { Component, OnInit } from '@angular/core';


import * as moment from 'moment';
import { ChatService } from 'src/chat.service';


@Component({
  selector: 'app-socketry',
  templateUrl: './socketry.component.html',
  styleUrls: ['./socketry.component.css']
})
export class SocketryComponent implements OnInit {
  message: string;
  messages: string[] = [];
  secretCode: string;

  constructor(private chatService :ChatService) 
  { 
    this.secretCode = 'fuck';
  }
  sendMessage() {
      this.chatService.sendMessage(this.message);
      this.message = '';
    }

  ngOnInit() {
 
  }

}
