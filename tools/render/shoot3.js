const { chromium } = require('playwright'); const fs = require('fs');
const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
(async () => {
  const b = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p = await b.newPage(); p.on('pageerror', e => console.log('err:', e.message));
  for (const j of jobs) {
    await p.goto('file://' + __dirname + `/render.html?w=${j.w}&h=${j.h}`);
    await p.waitForFunction('window.ready', null, {timeout:120000});
    const u = await p.evaluate(o => window.studioShot(o), j.o);
    fs.writeFileSync(j.out, Buffer.from(u.split(',')[1], 'base64')); console.log('wrote', j.out);
  }
  await b.close();
})();
