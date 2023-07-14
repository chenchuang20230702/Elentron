import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { EChartsOption } from 'echarts';
import { Tools } from '../../shared/tools';
import { db, User, List, Details } from '../../shared/db';
import { NzMessageService } from 'ng-zorro-antd/message';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
})
export class HomeComponent implements OnInit {
  public info: User = {};
  public chartOption: EChartsOption = {};
  public isVisible = false;
  public date = new Date();
  public value = '';
  public options: List[] = [];
  public timels: string[] = [];
  public datals: string[] = [];
  public selectDate = new Date();
  public result: Details[] = [];
  public monthTotall = 0;
  public listOfData:any[] = [];
  constructor(private router: Router, private message: NzMessageService) {
    console.log(localStorage.getItem(Tools.LOGINIDKEY));
  }
  ngOnInit(): void {
    this.getInfo();
  }
  /**
   *
   * @param year 获取选择月的天数
   * @param month
   * @returns
   */
  mGetDate(year: string, month: string) {
    let d = new Date(Number(year), Number(month), 0);
    console.log(year, '年', month, '月有', d.getDate(), '天');
    return d.getDate();
  }
  /**
   *
   * @returns 查询当前数据 并渲染到页面
   */
  async getInfo() {
    if (!this.selectDate) {
      this.message.create('error', '请选择查询日期');
      return;
    }
    let month = Tools.timestampToDateTime(this.selectDate.getTime(), 'yyyy-MM');
    //准备x轴坐标点
    this.timels = [];
    this.datals = [];
    let n = month.split('-');
    let days = this.mGetDate(n[0], n[1]);
    for (let i = 1; i <= days; i++) {
      let time = `${month}-${i < 10 ? '0' + i : i}`;
      this.timels.push(time);
    }
    //查询indexdb中用户的信息
    this.info = await db.getUserInfo();
    //查询当前用户下的消费详情
    let list = await db.details.where('name').equals(this.info.name).toArray();
    //过滤当前日期

    this.result = list.filter((item) => item.month == month);
    //日期排序
    this.result.sort((a, b) => {
      return a.time > b.time ? 1 : -1;
    });
    //图表数据准备
    this.monthTotall = 0;
    this.datals = [];
    this.timels.forEach((t) => {
      let n = this.result.find((item) => item.time == t);
      let money = 0;
      if (n) {
        n.list.forEach((m) => {
          money = Number(money) + Number(m.money);
        });
        this.monthTotall = this.monthTotall + money;

        this.datals.push(money + '');
        //组装表格数据
        this.listOfData = [...this.listOfData,{
          day: n.time,
          money: money,
          details: n.list,
        },
        {
          day: n.time,
          money: money,
          details: n.list,
        }];
        return;
      }
      this.datals.push(money ? money + '' : '');
    });
    //设置图标
    this.setChartOption();
    console.log(this.listOfData)
  }
  /**
   * 日期选择变化
   */
  onChange(event: any) {
    this.getInfo();
  }
  setChartOption() {
    this.chartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let axisValue = params[0].axisValue;
          let items = this.result.find((item) => item.time == axisValue);
          let str = '';
          items?.list.forEach((t) => {
            str += t.type + ':' + t.money + '<br/>';
          });
          return str;
        },
      },
      xAxis: {
        type: 'category',
        data: this.timels,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          data: this.datals,
          type: 'line',
        },
      ],
      grid: {
        left: 50,
        right: 10,
        bottom: 50,
      },
    };
  }
  /**
   * 退出登录
   */
  out() {
    localStorage.clear();
    location.reload();
  }
  edit() {
    this.isVisible = true;
  }
  handleCancel() {
    this.isVisible = false;
    this.options = [];
    this.date = new Date();
  }
  async handleOk() {
    if (this.options.length == 0) {
      this.message.create('error', '请添加具体消费');
      return;
    }
    let time = Tools.timestampToDateTime(this.date.getTime(), 'yyyy-MM-dd');
    //查询当前日期是否已经添加过
    let list = await db.details.where('time').equals(time).toArray();
    let index = list.findIndex((item) => item.name == this.info.name);
    if (index > -1) {
      this.message.create('error', '当前日期已经添加过了');
      return;
    }
    await db.details.add({
      name: this.info.name,
      time: time,
      month: time.substring(0, 7),
      list: this.options,
    });
    this.message.create('success', '添加成功', {
      nzDuration: 2500,
    });
    this.isVisible = false;
    this.date = new Date();
    this.options = [];
  }
  add() {
    if (this.value) {
      if (this.value.includes('&')) {
        let item = this.value.split('&');
        let obj = {
          type: item[0],
          money: item[1],
        };
        this.options.push(obj);
      } else {
        this.message.create('error', '填写不符合规范');
      }
    }
  }
}
