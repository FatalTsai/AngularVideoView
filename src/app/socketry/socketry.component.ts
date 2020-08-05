import { Component, OnInit } from '@angular/core';


import * as moment from 'moment';
import { ChatService } from 'src/chat.service';
import { throttleTime,scan,skipWhile,filter,distinctUntilChanged } from 'rxjs/operators';

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
    this.secretCode = 'socketry';
  }
  sendMessage() {
      this.chatService.sendMessage(this.message);
      this.message = '';
    }

    ngOnInit() {
      this.chatService
        .getMessages()
        .subscribe((message: string) => {
          const currentTime = moment().format('hh:mm:ss a');
          const messageWithTimestamp = `${currentTime}: ${message}`;
          this.messages.push(messageWithTimestamp);
        });
    }
}
