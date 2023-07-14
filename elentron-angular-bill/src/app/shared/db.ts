// db.ts
import Dexie, { Table } from 'dexie';
import { Tools } from './tools';

export interface User {
  id?: number | any;
  name?: string | any
  password?: string
  /**上次登录时间 */
  lasttimes?: string 
  /**当前登录时间 */
  times?:string
  /**账户创建时间 */
  createtime?:string
}
export interface List {
  type:string
  money:string
}
export interface Details {
  id?: number | any
  name:string | any
  time:string | any
  month?:string | any
  list:List[]
}
export class AppDB extends Dexie {
  userInfos!: Table<User, number>;
  details!: Table<Details, number>;
  constructor() {
    super('MyBaseData');
    this.version(3).stores({
      userInfos: '++id,name',//索引 用户查询
      details: '++id,name,time',//索引 用户查询
    });
  }
 async getUserInfo():Promise<any>{
    let key:any = localStorage.getItem(Tools.LOGINIDKEY);
    return this.userInfos.where('name').equals(key).toArray().then(res=> res[0]);
  }
}
export const db = new AppDB();