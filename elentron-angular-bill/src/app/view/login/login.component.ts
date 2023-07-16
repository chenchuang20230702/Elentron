import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { liveQuery } from 'dexie';
import { db } from '../../shared/db';
import { Tools } from '../../shared/tools';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
})
export class LoginComponent implements OnInit {
  mode = null;
  username = '';
  userpassword = '';

  signUsername = '';
  signUserpassword = '';
  signUserpassword2 = '';
  constructor(private router: Router, private message: NzMessageService) {
    console.log(Tools.timestampToDateTime());
  }

  ngOnInit(): void {
    console.log('LoginComponent INIT');
  }

  async login() {
    console.log(this.username, this.userpassword);
    let user: any[] = [];
    try {
      //查询当前用户是否在库中
      user = await db.userInfos.where('name').equals(this.username).toArray();
    } catch (error) {
      this.message.create('error', '请重启客户端');
      return;
    }
    if (user.length == 0) {
      this.message.create('error', '该用户未注册');
      return;
    }
    let exist = user.find((item) => item.password == this.userpassword);
    if (!exist) {
      this.message.create('error', '关联手机号错误');
      return;
    }
    this.message.create('success', '登录成功', {
      nzDuration: 2500,
    });
    //更新登录时间
    await db.userInfos.update(exist.id, {
      lasttimes: exist.times,
      times: Tools.timestampToDateTime(),
    });
    localStorage.setItem(Tools.LOGINIDKEY, this.username);
    this.router.navigate(['home']);
  }
  async sign() {
    console.log(
      this.signUsername,
      this.signUserpassword,
      this.signUserpassword2
    );
    switch (false) {
      case !!this.signUsername:
        this.message.create('error', '请输入用户名称');
        break;
      case !!this.signUserpassword:
        this.message.create('error', '请输入手机号');
        break;
      case !!this.signUserpassword2:
        this.message.create('error', '请输入确认手机号');
        break;
      case this.signUserpassword == this.signUserpassword2:
        this.message.create('error', '两次手机号输入不一样，请重新输入');
        break;
      default:
        let user: any[] = [];
        try {
          //查询本地是否存在该用户
          user = await db.userInfos
            .where('name')
            .equals(this.signUsername)
            .toArray();
        } catch (error) {
          this.message.create('error', '请重启客户端');
          return;
        }
        let index = user.findIndex((item) => item.name == this.signUsername);
        if (index > -1) {
          this.message.create('error', '该用户已经注册');
          return;
        }
        this.message.create('success', '注册成功 请重新登录', {
          nzDuration: 2500,
        });
        //添加数据到本地
        await db.userInfos.add({
          name: this.signUsername,
          password: this.signUserpassword,
          createtime: Tools.timestampToDateTime(),
        });
        this.signUsername = '';
        this.signUserpassword = '';
        this.signUserpassword2 = '';
        break;
    }
  }
}
