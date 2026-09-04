import utils from './utils';
import { EventSourcePolyfill } from 'event-source-polyfill';

function EventSent(url, options){
  let { onMessage, onError, headers } = options;
  let events = {
    msg: onMessage,
    finish: onMessage,
  }
  let es = {};
  let isReceiving = false;
  function connnect(){
    es = new EventSourcePolyfill(url, { headers });
    let timer = setTimeout(() => {
      clearTimeout(timer)
      if(!isReceiving){
        es.close();
        connnect();
      }
    }, 1000 * 29)

    function onReceived(e){
      // console.log('onreceived', e)
      clearTimeout(timer);
      let message;
      try {
        message = JSON.parse(e.data);
      } catch (err) {
        console.warn('[EventSent] JSON parse error:', err, 'data:', e.data);
        return;
      }
      let { type, is_finished, payload } = message;
      if(is_finished){
        es.close();
        isReceiving = !is_finished;
      }
      let event = events[type] || utils.noop;
      event(payload, is_finished);
    }
    function onError(e){
      es.close();
      isReceiving = false;
      clearTimeout(timer);
    }

    es.addEventListener('message', onReceived);
    es.addEventListener('error', onError)
  }
  connnect();
  return es;
}

export default EventSent;