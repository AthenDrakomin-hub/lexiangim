import { request } from './request';
import SERVER_PATH from './api';
import utils from '../common/utils';

function getTranslate(params = {}){
  let { app_key } = params;
  let url = `${SERVER_PATH.R3D_TRANSLTE_GET}?app_key=${app_key}`;
  return request(url, {
    method: 'GET'
  });
}

function setTranslate(data){
  return request(SERVER_PATH.R3D_TRANSLTE_SET, {
    method: 'POST',
    body: utils.toJSON(data)
  });
}

function getRTC(params = {}){
  let { app_key } = params;
  let url = `${SERVER_PATH.R3D_RTC_GET}?app_key=${app_key}`;
  return request(url, {
    method: 'GET'
  });
}

function setRTC(data){
  return request(SERVER_PATH.R3D_RTC_SET, {
    method: 'POST',
    body: utils.toJSON(data)
  });
}

function getEmail(params = {}){
  let { app_key } = params;
  let url = `${SERVER_PATH.R3D_EMAIL_GET}?app_key=${app_key}`;
  return request(url, {
    method: 'GET'
  });
}

function setEmail(data){
  return request(SERVER_PATH.R3D_EMAIL_SET, {
    method: 'POST',
    body: utils.toJSON(data)
  });
}

function getSms(params = {}){
  let { app_key } = params;
  let url = `${SERVER_PATH.R3D_SMS_GET}?app_key=${app_key}`;
  return request(url, {
    method: 'GET'
  });
}

function setSms(data){
  return request(SERVER_PATH.R3D_SMS_SET, {
    method: 'POST',
    body: utils.toJSON(data)
  });
}

function createInviteCode(data){
  return request(SERVER_PATH.INVITECODE_CREATE, {
    method: 'POST',
    body: utils.toJSON(data)
  });
}

function listInviteCodes(params = {}){
  let { app_key } = params;
  let url = `${SERVER_PATH.INVITECODE_LIST}?app_key=${app_key}`;
  return request(url, {
    method: 'GET'
  });
}

function deleteInviteCode(data){
  return request(SERVER_PATH.INVITECODE_DELETE, {
    method: 'POST',
    body: utils.toJSON(data)
  });
}

function updateInviteCodeStatus(data){
  return request(SERVER_PATH.INVITECODE_STATUS, {
    method: 'POST',
    body: utils.toJSON(data)
  });
}

export default {
  getTranslate,
  setTranslate,
  getRTC,
  setRTC,
  getEmail,
  setEmail,
  getSms,
  setSms,
  createInviteCode,
  listInviteCodes,
  deleteInviteCode,
  updateInviteCodeStatus,
}