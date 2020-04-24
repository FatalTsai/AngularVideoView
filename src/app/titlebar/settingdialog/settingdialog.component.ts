//ref :https://stackblitz.com/edit/matdialog-return-data-demo?file=app%2Fapp.module.ts
import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatIconRegistry } from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  templateUrl: './settingdialog.component.html',
  styleUrls: ['./settingdialog.component.css']

})
export class FileNameDialogComponent implements OnInit {

  form: FormGroup;

  constructor(
    iconRegistry: MatIconRegistry, 
    sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<FileNameDialogComponent>,
  ) {
    iconRegistry.addSvgIcon(
      'close',
      sanitizer.bypassSecurityTrustResourceUrl('assets/titlebar/close.svg'));
      iconRegistry.addSvgIcon(
        'setting',
        sanitizer.bypassSecurityTrustResourceUrl('assets/titlebar/setting.svg'));
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      filename: ''
    })
  }

  submit(form) {
    this.dialogRef.close(`${form.value.filename}`);
  }
}