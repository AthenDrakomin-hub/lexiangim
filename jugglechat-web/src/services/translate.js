import { request } from './request';
import SERVER_PATH from './api';

function translate({ text, target_lang }){
  return request(SERVER_PATH.TRANSLATE, {
    method: 'POST',
    body: JSON.stringify({ text, target_lang: target_lang || 'zh' })
  });
}

export default {
  translate,
};
