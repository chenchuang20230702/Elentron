interface Details {
    type:string;
    money:string;
}
export interface ListOfDataTable {
    /**日期 */
    day:string
    /**当日消费 */
    money:any
    details: Details[]
}

export interface ExportXLSData {
      /**日期 */
    day: string;
     /**当日消费 */
    money:any;
    /** 当前消费详情格式 ',' 逗号分隔*/
    details:string
}
export interface Titles {
    /**日期 */
    day: string;
    /**消费 */
    money:any;
    /**明细*/
    details:string
}
export const FieldsMap ={
    '日期':'day',
    '明细': 'details',
    '消费':'money'
}
export interface YearsTable {
    month: string
    total: number
}