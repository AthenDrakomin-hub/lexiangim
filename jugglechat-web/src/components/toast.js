import { createVNode, render } from "vue";
import Toast from "./toast.vue";

let clsName = 'jg-toast';
export function showToast(options) {
  let container = document.querySelector(`.${clsName}`);
  if (!container) {
    container = document.createElement("div");
    container.className = clsName;
    document.body.appendChild(container);
  }
  let vm = createVNode(Toast, options);
  render(vm, container);
  setTimeout(() => {
    container.style = 'top: 5%';
  }, 200)
  setTimeout(() => {
    container.style = "top: -100%;"
  }, options.duration || 3000)
};
const $toast = showToast;

export default {
  install(app) {
    let container = document.createElement("div");
    container.className = clsName;
    document.body.appendChild(container);
    app.config.globalProperties.$toast = $toast;
  }
};
