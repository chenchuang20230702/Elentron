import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { EChartsOption } from 'echarts';
import { read, utils, writeFile,writeFileXLSX,readFile,WorkBook } from 'xlsx';
import { Tools } from '../../shared/tools';
import { db, User, List, Details } from '../../shared/db';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ListOfDataTable,ExportXLSData,Titles,FieldsMap,YearsTable } from '../../app.model';
import { truncate } from 'fs/promises';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
})
export class HomeComponent implements OnInit,AfterViewInit {
  public info: User = {};
  public chartOption: EChartsOption = {};
  public chartOptionYear: EChartsOption = {};
  public isVisible = false;
  public date = new Date();
  public value = '';
  public options: List[] = [];
  public timels: string[] = [];
  public datals: string[] = [];
  public selectDate = new Date();
  public result: Details[] = [];
  public monthTotall = 0;
  public eatMoney = 0;//吃饭
  public otherMoney = 0;//其它
  public otherMoneyTitle = '';
  public listOfDataTable:ListOfDataTable[] = [];
  public yearsTable:YearsTable[] = [];
  public title = '新增';
  public isDisabled = false;
  public eatTypes = ['饭','外卖','聚餐','返现','夜宵'];
  constructor(private router: Router, private message: NzMessageService) {
    console.log(localStorage.getItem(Tools.LOGINIDKEY));
  }
  getTitle(){
    return `吃饭支出只统计：${this.eatTypes.join(',')}`
  }
  ngOnInit(): void {
    this.getInfo();
  }
  ngAfterViewInit() {
    const handleFile = async(e:any)=> {
      const id = this.message.loading('导入中..', { nzDuration: 0 }).messageId;
      const file = e.target.files[0];
      e.target.value = null;
      const data = await file.arrayBuffer();
      const workbook = readFile(data,{type:"binary"});
      const wsname = workbook.SheetNames[0];
      const jsonData:any[] = utils.sheet_to_json(workbook.Sheets[wsname]);
      let tabData: ListOfDataTable[] = [];
      jsonData.forEach(item=>{
        let obj = {} as any;
        for(let key in item){
          const k = (FieldsMap as any)[key]
          obj[k] = item[key];
          //类型单独处理
          if(k == 'details'){
            let dls:any = [];
            let arr:string[] = item[key].split(',');
            arr.forEach(t=>{
              let d = t.split(':');
              if(d[0] || d[1]){
                let details = {
                  money:d[1] || '',
                  type:d[0] || ''
                }
                dls.push(details);
              }
            })
            obj[k] = dls;
          }
        }
        tabData.push(obj);
      });
      //写入indexdb
      let month_ = tabData[0].day.substring(0, 7);
      for(let i = 0; i<tabData.length;i++){
        let list = await db.details.where('time').equals(tabData[i].day).toArray();
        let its = list.find((item) => item.name == this.info.name);
        if(!!its){
          setTimeout(() => {
            this.message.remove(id);
            this.message.create('error', '当月数据已存在,请手动维护');
          }, 100);
         return;
        }
        //新增
        await db.details.add({
          name: this.info.name,
          time: tabData[i].day,
          month: tabData[i].day.substring(0, 7),
          list: tabData[i].details,
        });
      }
      setTimeout(() => {
        this.message.remove(id);
        this.message.create('success', `${month_}导入成功`,{
          nzDuration: 2500,
        });
        this.getInfo();
      }, 100);
    
    }
    document.getElementById("xlf")?.addEventListener("change", handleFile, false);
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
    this.monthTotall = 0; //月支出统计
    this.eatMoney = 0; 
    this.otherMoney = 0; 
    this.otherMoneyTitle = '';
    this.datals = [];
    this.listOfDataTable = [];
    this.timels.forEach((t) => {
      let n = this.result.find((item) => item.time == t);
      let money = 0;
      let eatMoney = 0;//吃饭
      let otherMoney = 0;//其它
      if (n) {
        n.list.forEach((m) => {
          money = Number(money) + Number(m.money);
          if(this.eatTypes.find(t=> m.type.includes(t))){
            eatMoney = eatMoney + Number(m.money);
          }else {
            otherMoney = otherMoney + Number(m.money);
            this.otherMoneyTitle = this.otherMoneyTitle + m.type + ':' + m.money + '\n';
          }
        });
        //月统计
        this.monthTotall = this.monthTotall + money;
        this.eatMoney = this.eatMoney + eatMoney;
        this.otherMoney = this.otherMoney + otherMoney;
        this.datals.push(money ? Number(money).toFixed(2): '');
        //组装表格数据
        this.listOfDataTable = [...this.listOfDataTable,{
          day: n.time,
          money: money ? Number(money).toFixed(2) : '',
          details: n.list,
        }];
        return;
      }
      //组装表格数据
      this.listOfDataTable = [...this.listOfDataTable,{
        day: t,
        money: null,
        details: [],
      }];
      this.datals.push(money ? Number(money).toFixed(2) + '' : '');
    
    });
    //精度设置
    this.monthTotall = Number(this.monthTotall).toFixed(2) as any;
    this.eatMoney = Number(this.eatMoney).toFixed(2) as any;
    this.otherMoney = Number(this.otherMoney).toFixed(2) as any;
    //设置图标
    console.log(this.datals,'this.datals')
    this.setChartOption();
    //组装当年的数据
    let years = [];
    let yearsData:string[] = [];
    let year = Tools.timestampToDateTime(this.selectDate.getTime(), 'yyyy');
    for(let y = 0;y <12;y++){
      if(y < 9){
        years.push(`${year}-0${y+1}`)
      }else {
        years.push(`${year}-${y+1}`)
      }
    }
    //查询对应月份的数据
    this.yearsTable= []
    years.forEach(y=>{
      yearsData.push(this.getMonth(y,list));
    });
    this.setYearChartOption(years,yearsData);
  }
  getMonth(month:string,result:Details[]){
   let m = result.filter(item=> item.month == month);
   let total = 0;
   m.forEach(item=>{
      item.list.forEach(m=>{
        total = total + Number(m.money)
      });
   });
   return Number(total).toFixed(2);
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
          let value = params[0].value;
          let items = this.result.find((item) => item.time == axisValue);
          let str = axisValue + '<br/>';
          items?.list.forEach((t) => {
            str += t.type + ':' + t.money + '<br/>';
          });
          return '当日总计：' + value + '<br/>' + str;
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
          label:{
            show:true
          }
        },
      ],
      grid: {
        left: 50,
        right: 10,
        bottom: 50,
      },
    };
  }
  setYearChartOption(years:string[],data:string[]){
    this.chartOptionYear = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        top:'20',
        left: '15',
        right: '15',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: years
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: data,
          type: 'bar',
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(180, 180, 180, 0.2)'
          },
          label:{
            show:true,
            position: 'top'
          }
        }
      ]
    }
  }
  /**
   * 退出登录
   */
  out() {
    localStorage.clear();
    this.router.navigate(['login']);
  }
  /**
   * 
   * @param data 新增 编辑
   */
  edit(data?:any) {
    this.title = '新增'
    this.isDisabled = false;
    this.options = [];
    this.date = new Date();
    if(data){
      this.title = '编辑'
      this.date = new Date(`${data.day} 00:00:00`); 
      this.isDisabled = true;
      this.options = [...data.details]
    }
    this.isVisible = true;
  }
  /**
   * 
   * @param index 删除
   */
  delete(index:number){
    console.log(index)
    this.options.splice(index,1);
  }
  /**
   * 取消
   */
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
    let its = list.find((item) => item.name == this.info.name);
    //修改
    if(this.isDisabled){
      await db.details.update(its?.id,{
        name: this.info.name,
        time: time,
        month: time.substring(0, 7),
        list: this.options,
      })
    }else {
      if (its) {
        this.message.create('error', '当前日期已经添加过了');
        return;
      }
      await db.details.add({
        name: this.info.name,
        time: time,
        month: time.substring(0, 7),
        list: this.options,
      });
    }

    this.message.create('success', '添加成功', {
      nzDuration: 2500,
    });
    this.isVisible = false;
    this.date = new Date();
    this.options = [];
    this.getInfo();
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
  createWs(data:ExportXLSData[],fields:string[],titles:any){
    //创建表格实例
    const ws = utils.json_to_sheet(data,{
      header: fields
    });
    //表格设置宽度
    ws["!cols"] = [
      { wch: 10 },
      { wch: 10 },
      { wch: 100 }
    ]
    //设置表头
    const range = utils.decode_range((ws['!ref']) as string);
    for(let c = range.s.c; c <= range.e.c; c++){
      const header = utils.encode_col(c) + '1';
      ws[header].v = titles[ws[header].v];
    }
    return ws;
  }
  /**
   * 导出当前页
   */
  async downLoad(){
    console.log(this.listOfDataTable,'listOfDataTable');
   let exportList: ExportXLSData[] = [];
    for(let item of this.listOfDataTable){
      let exportData = {} as ExportXLSData;
      exportData.day = item.day;
      exportData.money = item.money;
      exportData.details = ''
      item.details.forEach(t=>{
        exportData.details =  exportData.details + ',' + t.type + ':' + t.money;
      });
      exportData.details = exportData.details.slice(1);
      exportList.push(exportData); 
    }
    const fields:string[] = ['day','money','details']
    const titles:Titles = {
      day:'日期',
      money:'消费',
      details:'明细'
    }
    const ws = this.createWs(exportList, fields, titles)
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "sheet");
    let month = Tools.timestampToDateTime(this.selectDate.getTime(), 'yyyy-MM');
    writeFileXLSX(wb, `${month}个人消费账单_支出${this.monthTotall}.xlsx`);
  }
  /**
   * 一键清库
   */
  async deleteAll(){
    await db.delete();
    this.message.create('success', '清库成功，请关闭客户端重新登录',{
      nzDuration:3000
    });
    setTimeout(() => {
      this.out();
    }, 1500);
  }
}
