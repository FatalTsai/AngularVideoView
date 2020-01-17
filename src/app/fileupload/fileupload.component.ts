import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
//https://blog.jscrambler.com/implementing-file-upload-using-node-and-angular/
@Component({
  selector: 'app-fileupload',
  templateUrl: './fileupload.component.html',
  styleUrls: ['./fileupload.component.css']
})
export class FileuploadComponent implements OnInit {

  uploadedFiles: Array < File > ;

    constructor(private http: HttpClient) {

    }

    ngOnInit() {

    }

    fileChange(element) {
        this.uploadedFiles = element.target.files;
    }

    upload() {
        let formData = new FormData();
        for (var i = 0; i < this.uploadedFiles.length; i++) {
            formData.append("uploads[]", this.uploadedFiles[i], this.uploadedFiles[i].name);
        }
        this.http.post('/api/upload', formData)
            .subscribe((response) => {
                console.log('response received is ', response);
            })
    }

}
