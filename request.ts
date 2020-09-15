import { IFRequest, IFResponse } from 'app-vendors/requests';
import { ListType } from 'app-vendors/types';
import { ValidateTool } from 'app-utils/validate-tools';

import { AppConfigManager } from 'app-utils/config-manager';

/**
 * 获得ifaas-community-sec服务的请求url
 * @param {string} path 相对路径，前面带有/, 可以查看http://192.168.2.150:8090/pages/viewpage.action?pageId=4980867
 * @returns {string} 请求url
 */
export function getRequestUrl(path: string): string {
  // 这句话不要放在函数外边，因为Config的初始化是异步的
  const hostname = AppConfigManager.getBaseApiRequestAddress();
  return `${
    window.location.protocol
  }//${hostname}:${AppConfigManager.getBaseApiRequestPort()}/${path}`;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
}

export interface ExportRequest {
  communityId: string; // 小区id
  communityName?: string; // 小区名称
  eventTypeId: string; // 事件类型
  eventTypeName?: string; // 事件名称
  reportAddress: string; // 报警地点
  reportPersonName: string; // 上报人姓名
  phoneNumber: string; // 上报人手机号
  eventDesc: string; // 事件描述
  imgBase64List: string[]; // 事件相关照片
}

// 查询小区列表
async function getPlotList(): Promise<Item[]> {
  const url = getRequestUrl('community/list');

  const result = await IFRequest.get(url);
  const data = ValidateTool.getValidObject(result.data, {});

  return data.data;
}

// 查询事件类型列表
async function getEventList(): Promise<Item[]> {
  const url = getRequestUrl('report/event/type');

  const result = await IFRequest.get(url);
  const data = ValidateTool.getValidObject(result.data, {});

  return data.data;
}

// 添加事件上报
async function addReport(param: ExportRequest) {
  const url = getRequestUrl('report/event');

  const result = await IFRequest.post(url, param);
  const data = ValidateTool.getValidObject(result.data, {});

  return data.data;
}

const MobileRequest = { getPlotList, getEventList, addReport };

export default MobileRequest;
