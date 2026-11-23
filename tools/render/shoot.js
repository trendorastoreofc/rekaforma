const { chromium } = require('playwright');
const fs = require('fs');
const shots = JSON.parse(process.argv[2]);
(async () => {
  const b = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p = await b.newPage({viewport:{width:800,height:800}});
  p.on('console', m => console.log('console:', m.text()));
  p.on('pageerror', e => console.log('err:', e.message));
  await p.goto('file://' + __dirname + '/render.html?w=1600&h=1600');
  await p.waitForFunction('window.ready', null, {timeout:120000});
  for (const s of shots) {
    const url = await p.evaluate(o => window.shot(o), s.o);
    fs.writeFileSync(s.out, Buffer.from(url.split(',')[1], 'base64'));
    console.log('wrote', s.out);
  }
  await b.close();
})();
