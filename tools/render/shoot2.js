const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p = await b.newPage();
  p.on('pageerror', e => console.log('err:', e.message));
  await p.goto('file://' + __dirname + '/render.html?w=2400&h=1500');
  await p.waitForFunction('window.ready', null, {timeout:120000});
  let u = await p.evaluate(() => window.trioShot({}));
  fs.writeFileSync('out/trio.png', Buffer.from(u.split(',')[1], 'base64'));
  u = await p.evaluate(() => window.trioShot({el:30, dist:340, az:8}));
  fs.writeFileSync('out/trio_high.png', Buffer.from(u.split(',')[1], 'base64'));
  await p.goto('file://' + __dirname + '/render.html?w=900&h=900');
  await p.waitForFunction('window.ready', null, {timeout:120000});
  fs.mkdirSync('out/spin', {recursive:true});
  for (const f of ['sun','sak','dai']) for (let i=0;i<36;i++) {
    const url = await p.evaluate(o => window.shot(o), {flower:f, stand:true, el:8, az:0, spin:i*10, dist:175, ty:24});
    fs.writeFileSync(`out/spin/${f}_${String(i).padStart(2,'0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log('done'); await b.close();
})();
