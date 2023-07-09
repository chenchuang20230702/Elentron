import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {
  mode = null;
  username = '';
  userpassword = '';
  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('LoginComponent INIT');
  }

}
