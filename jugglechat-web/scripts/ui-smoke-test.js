// UI/UX Smoke Test for 乐享 IM
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const outDir = __dirname;
  const results = [];
  const screenshots = [];

  async function takeShot(page, name) {
    const file = path.join(outDir, `screenshot-${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    screenshots.push(file);
  }

  // ── Desktop browser ───────────────────────────────────────────────────
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  let consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  // ── Test 1: Invite Page ───────────────────────────────────────────────
  console.log('\n=== Test 1: Invite Page (/invite) ===');
  await page.goto('http://localhost:5173/#/invite', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1500);
  await takeShot(page, 'invite');

  const inviteInputs = await page.locator('.lx-input').count();
  const inviteBtns = await page.locator('.lx-btn').count();
  const inviteOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  results.push({ test: '邀请页渲染(输入框+按钮)', pass: inviteInputs >= 1 && inviteBtns >= 1, note: `inputs=${inviteInputs}, btns=${inviteBtns}` });
  results.push({ test: '邀请页无横向溢出', pass: !inviteOverflow, note: inviteOverflow ? '溢出!' : '正常' });

  // Check button min size
  const btnRect = await page.locator('.lx-btn').first().evaluate(el => el.getBoundingClientRect());
  results.push({ test: '邀请页按钮≥44px高度', pass: btnRect.height >= 44, note: `h=${btnRect.height.toFixed(1)}px` });

  // ── Test 2: Login Page ────────────────────────────────────────────────
  console.log('\n=== Test 2: Login Page (/login) ===');
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1500);
  await takeShot(page, 'login');

  const loginInputs = await page.locator('.lx-input').count();
  const loginBtns = await page.locator('.lx-btn').count();
  const loginOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  results.push({ test: '登录页渲染', pass: loginInputs >= 2 && loginBtns >= 1, note: `inputs=${loginInputs}, btns=${loginBtns}` });
  results.push({ test: '登录页无横向溢出', pass: !loginOverflow, note: loginOverflow ? '溢出!' : '正常' });

  // Form validation - empty submit
  await page.locator('.lx-btn').first().click({ timeout: 5000 });
  await page.waitForTimeout(500);
  const emptyErrors = await page.locator('.lx-error').count();
  results.push({ test: '空表单提交显示错误提示', pass: emptyErrors > 0, note: `errors=${emptyErrors}` });

  // Login button touch target
  const loginBtnRect = await page.locator('.lx-btn').first().evaluate(el => el.getBoundingClientRect());
  results.push({ test: '登录按钮≥44px高度', pass: loginBtnRect.height >= 44, note: `h=${loginBtnRect.height.toFixed(1)}px` });

  // ── Test 3: 404 Page ──────────────────────────────────────────────────
  console.log('\n=== Test 3: 404 Page ===');
  // Note: beforeEach guard redirects unauthenticated users to /invite,
  // so 404 is only reachable after auth or by direct route lookup.
  await page.goto('http://localhost:5173/#/404', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1500);
  await takeShot(page, '404');

  const has404Img = await page.locator('.error-404-illustration').count();
  const has404Btn = await page.locator('.error-404-btn').count();
  results.push({ test: '404页渲染(直接访问)', pass: has404Img > 0 && has404Btn > 0, note: `img=${has404Img}, btn=${has404Btn}` });

  if (has404Btn > 0) {
    await page.locator('.error-404-btn').click({ timeout: 5000 });
    await page.waitForTimeout(1000);
    const urlAfter = page.url();
    results.push({ test: '404返回首页跳转', pass: urlAfter.includes('/#/conversation') || urlAfter.includes('/#/invite'), note: urlAfter });
  }

  // Also verify that unknown routes redirect to invite (intentional behavior)
  await page.goto('http://localhost:5173/#/some-random-path', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1500);
  const unknownUrl = page.url();
  results.push({ test: '未知路由未登录时跳邀请页', pass: unknownUrl.includes('/#/invite'), note: unknownUrl });

  // ── Test 4: Desktop overflow on login ──────────────────────────────────
  console.log('\n=== Test 4: Desktop overflow recheck ===');
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1000);
  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  results.push({ test: '桌面端登录页无横向溢出', pass: !desktopOverflow, note: desktopOverflow ? '有溢出' : '正常' });

  // ── Test 5: Console errors ────────────────────────────────────────────
  console.log('\n=== Test 5: Console Errors ===');
  results.push({ test: '无控制台错误', pass: consoleErrors.length === 0, note: consoleErrors.length > 0 ? `${consoleErrors.length} errors` : 'clean' });
  if (consoleErrors.length > 0) {
    consoleErrors.slice(0, 5).forEach(e => console.log('  ERROR:', e));
  }

  // ── Test 6: Mobile viewport (375px) ────────────────────────────────────
  console.log('\n=== Test 6: Mobile Viewport (375px) ===');
  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  const mobilePage = await mobileCtx.newPage();

  mobilePage.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[MOBILE][${msg.type()}] ${msg.text()}`);
  });

  // Mobile invite page
  await mobilePage.goto('http://localhost:5173/#/invite', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await mobilePage.waitForTimeout(1500);
  await takeShot(mobilePage, 'mobile-invite');
  const mobInviteInputs = await mobilePage.locator('.lx-input').count();
  const mobInviteOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  results.push({ test: '移动端邀请页渲染', pass: mobInviteInputs >= 1, note: `inputs=${mobInviteInputs}` });
  results.push({ test: '移动端邀请页无横向溢出', pass: !mobInviteOverflow, note: mobInviteOverflow ? '溢出!' : '正常' });
  const mobBtnRect = await mobilePage.locator('.lx-btn').first().evaluate(el => el.getBoundingClientRect());
  results.push({ test: '移动端按钮≥44px高度', pass: mobBtnRect.height >= 44, note: `h=${mobBtnRect.height.toFixed(1)}px` });

  // Mobile login page
  await mobilePage.goto('http://localhost:5173/#/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await mobilePage.waitForTimeout(1500);
  await takeShot(mobilePage, 'mobile-login');
  const mobLoginInputs = await mobilePage.locator('.lx-input').count();
  const mobLoginOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  results.push({ test: '移动端登录页渲染', pass: mobLoginInputs >= 2, note: `inputs=${mobLoginInputs}` });
  results.push({ test: '移动端登录页无横向溢出', pass: !mobLoginOverflow, note: mobLoginOverflow ? '溢出!' : '正常' });
  const mobLoginBtnRect = await mobilePage.locator('.lx-btn').first().evaluate(el => el.getBoundingClientRect());
  results.push({ test: '移动端登录按钮≥44px高度', pass: mobLoginBtnRect.height >= 44, note: `h=${mobLoginBtnRect.height.toFixed(1)}px` });

  // Mobile 404 page (direct access)
  await mobilePage.goto('http://localhost:5173/#/404', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await mobilePage.waitForTimeout(1500);
  await takeShot(mobilePage, 'mobile-404');
  const mob404Img = await mobilePage.locator('.error-404-illustration').count();
  const mob404Btn = await mobilePage.locator('.error-404-btn').count();
  results.push({ test: '移动端404页渲染(直接访问)', pass: mob404Img > 0 && mob404Btn > 0, note: `img=${mob404Img}, btn=${mob404Btn}` });

  // Mobile unknown route → invite
  await mobilePage.goto('http://localhost:5173/#/some-mob-path', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await mobilePage.waitForTimeout(1000);
  const mobUnknownUrl = mobilePage.url();
  results.push({ test: '移动端未知路由跳邀请页', pass: mobUnknownUrl.includes('/#/invite'), note: mobUnknownUrl });

  await mobileCtx.close();

  // ── Summary ────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('UI/UX SMOKE TEST SUMMARY');
  console.log('========================================');
  let passCount = 0, failCount = 0;
  for (const r of results) {
    const icon = r.pass ? '✅' : '❌';
    if (r.pass) passCount++; else failCount++;
    console.log(`${icon} ${r.test}: ${r.pass ? 'PASS' : 'FAIL'} — ${r.note}`);
  }
  console.log(`\n总计: ${passCount} 通过, ${failCount} 失败`);
  console.log(`截图数: ${screenshots.length}`);

  await browser.close();

  const report = { results, screenshots, consoleErrors, timestamp: new Date().toISOString() };
  fs.writeFileSync(path.join(outDir, 'ui-test-results.json'), JSON.stringify(report, null, 2));
  console.log('\n结果已保存至 ui-test-results.json');
})();
