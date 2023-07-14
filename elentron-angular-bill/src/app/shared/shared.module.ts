import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { NgZorroAntdModule } from './ng-zorro-antd.module';
import * as echarts from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';
@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    NgZorroAntdModule,
    NgxEchartsModule.forRoot({
      echarts
    }),
  ],
  exports: [
    TranslateModule,
    WebviewDirective,
    FormsModule,
    NgZorroAntdModule,
    NgxEchartsModule,
  ],
})
export class SharedModule {}
