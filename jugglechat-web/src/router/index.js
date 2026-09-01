import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { Layout } from '@/views/layout';
import Common from '@/common/common';
import utils from '@/common/utils';
import { STORAGE } from "../common/enum";
import Storage from "../common/storage";

let routes = [{
  path: '/',
  name: 'Root',
  component: Layout,
  children: [
    {
      path: '/conversation',
      name: 'ConversationList',
      component:  () => import('@/views/conversation/conversation-list.vue'),
    },
    {
      path: '/contacts',
      name: 'Contacts',
      component: () => import('@/views/contacts/contacts.vue'),
    },
    {
      path: '/setting',
      name: 'Setting',
      component: () => import('@/views/setting/setting.vue'),
    }
  ],
},
{
  path: '/invite',
  name: 'Invite',
  component: () => import('@/views/invite/invite.vue'),
},
{
  path: '/login',
  name: 'Login',
  component: () => import('@/views/login/login.vue'),
},
{
  path: '/404',
  name: '404',
  component: () => import('@/views/error/404.vue'),
},
{
  path: '/:pathMatch(.*)*',
  name: 'notFound',
  redirect: '/404',
}];

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes
})

router.beforeEach((to, from, next) => {
  let user = Storage.get(STORAGE.USER_TOKEN);

  if (utils.isEqual(to.name, 'Root')) {
    if (!user.id) return next({ name: 'Invite' });
    return next({ name: 'ConversationList' });
  }
  // 已登录用户访问登录页，跳转到首页
  if (user.id && utils.isEqual(to.name, 'Login')) {
    return next({ name: 'ConversationList' });
  }
  // 未登录用户访问邀请或登录页，正常放行
  if (!user.id && (utils.isEqual(to.name, 'Invite') || utils.isEqual(to.name, 'Login'))) {
    return next();
  }
  // 未登录访问受保护页面，跳转到邀请页
  if (!user.id) {
    return next({ name: 'Invite' });
  }
  next();
})

export async function setupRouter(app) {
  app.use(router);
  await router.isReady();
}
