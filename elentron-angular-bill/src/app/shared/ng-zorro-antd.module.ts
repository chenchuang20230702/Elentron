import { NgModule } from '@angular/core';
// 引入组件
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
// 引入全部的图标
import { IconDefinition } from '@ant-design/icons-angular';
import { NzIconModule } from 'ng-zorro-antd/icon';
import * as AllIcons from '@ant-design/icons-angular/icons';
const antDesignIcons = AllIcons as {
  [key: string]: IconDefinition;
};
const icons: IconDefinition[] = Object.keys(antDesignIcons).map(key => antDesignIcons[key])
import zh from '@angular/common/locales/zh';
import {registerLocaleData} from '@angular/common';
registerLocaleData(zh);
@NgModule({
  exports: [NzButtonModule,NzIconModule,NzDatePickerModule,NzSpaceModule,NzSelectModule],
  imports:[
    NzIconModule.forRoot(icons)
  ]
})
export class NgZorroAntdModule {}
