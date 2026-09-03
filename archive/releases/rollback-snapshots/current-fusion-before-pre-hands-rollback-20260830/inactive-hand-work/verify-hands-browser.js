// 第一人称双手真实 WebGL 验证：检查三把武器姿势、共享几何和低端贴图分支。
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'output', 'playwright', 'hands');
fs.mkdirSync(outputDir, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

function createServer() {
  return http.createServer((request, response) => {
    const urlPath = decodeURIComponent((request.url || '/').split('?')[0]);
    const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    if (relative === 'favicon.ico') {
      response.writeHead(204).end();
      return;
    }
    const target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(root + path.sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    fs.readFile(target, (error, data) => {
      if (error) {
        response.writeHead(404).end('Not found');
        return;
      }
      response.writeHead(200, {
        'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream',
      });
      response.end(data);
    });
  });
}

async function verifyProfile(browser, baseUrl, profile) {
  const context = await browser.newContext(profile.context);
  if (profile.lowEnd) {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 4 });
    });
  }
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') {
      errors.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
  });

  await page.goto(`${baseUrl}?map=classic`, { waitUntil: 'networkidle' });
  await page.locator('#startBtn').click();
  await page.waitForFunction(() => {
    const game = window.__game;
    const weapons = game && game.weapons;
    return game && game.state === 'playing' && weapons && weapons._viewHands && weapons._viewHands.userData.leftHand &&
      weapons._viewHands.userData.rightHand;
  }, null, { timeout: 15000 });
  await page.waitForTimeout(500);

  const poses = {};
  for (const weaponId of ['usp', 'ak47', 'awp']) {
    await page.evaluate((id) => {
      const weapons = window.__game.weapons;
      if (weapons.currentId !== id) weapons.switchTo(id);
      weapons.switching = false;
      weapons._switchAnim = 0;
      weapons._viewRecoil = 0;
      weapons.reloadTimer = 0;
      weapons._updateViewModel(0);
    }, weaponId);
    await page.waitForTimeout(150);
    const canvas = page.locator('#gameRoot > canvas').first();
    await canvas.screenshot({ path: path.join(outputDir, `${profile.name}-${weaponId}.png`) });
    const idle = await page.evaluate(() => {
      const weapons = window.__game.weapons;
      const hands = weapons._viewHands;
      const ak = weapons._viewGuns.ak47;
      const akMesh = ak && ak.children.find(child => child.isMesh);
      const left = hands.userData.leftHand;
      const right = hands.userData.rightHand;
      return {
        visibleGun: Object.entries(weapons._viewGuns).filter(([, gun]) => gun.visible).map(([id]) => id),
        handsVisible: !!hands.visible,
        akMeshCount: ak ? ak.children.filter(child => child.isMesh).length : 0,
        akFused: !!(akMesh && akMesh.userData && akMesh.userData.fusedViewModel),
        akTriangles: akMesh && akMesh.geometry && akMesh.geometry.index ? akMesh.geometry.index.count / 3 : 0,
        akRotationY: akMesh ? akMesh.rotation.y : null,
        left: { position: left.position.toArray(), rotation: left.rotation.toArray().slice(0, 3), scale: left.scale.x },
        right: { position: right.position.toArray(), rotation: right.rotation.toArray().slice(0, 3), scale: right.scale.x },
      };
    });
    await page.evaluate(() => {
      const weapons = window.__game.weapons;
      const weapon = window.CONFIG.weapons[weapons.currentId];
      weapons.reloadTimer = weapon.reloadTime * 0.5;
      weapons._updateViewModel(0);
    });
    await page.waitForTimeout(50);
    await canvas.screenshot({ path: path.join(outputDir, `${profile.name}-${weaponId}-reload.png`) });
    const reload = await page.evaluate(() => {
      const weapons = window.__game.weapons;
      const hands = weapons._viewHands;
      const left = hands.userData.leftHand;
      const right = hands.userData.rightHand;
      return {
        handsVisible: !!hands.visible,
        left: { position: left.position.toArray(), rotation: left.rotation.toArray().slice(0, 3) },
        right: { position: right.position.toArray(), rotation: right.rotation.toArray().slice(0, 3) },
        viewGroup: {
          position: weapons._viewGroup.position.toArray(),
          rotation: weapons._viewGroup.rotation.toArray().slice(0, 3),
        },
      };
    });
    poses[weaponId] = { ...idle, reload };
  }

  const runtime = await page.evaluate(() => {
    const weapons = window.__game.weapons;
    const pair = weapons._viewHands;
    const left = pair.userData.leftHand;
    const right = pair.userData.rightHand;
    const material = pair.userData.material;
    return {
      lowEnd: !!window.CS15_LOWEND,
      handMeshCount: pair.children.filter(child => child.isMesh).length,
      triangles: (left.geometry.index.count + right.geometry.index.count) / 3,
      leftName: left.name,
      rightName: right.name,
      albedo: !!material.map,
      normal: !!material.normalMap,
      mr: !!material.roughnessMap && material.roughnessMap === material.metalnessMap,
      sourceHash: window.HandsModel.metadata.sourceHash,
      renderer: {
        calls: window.__game.renderer.info.render.calls,
        triangles: window.__game.renderer.info.render.triangles,
        pixelRatio: window.__game.renderer.getPixelRatio(),
        maxAnisotropy: window.__game.renderer.capabilities.getMaxAnisotropy(),
      },
      ak: (() => {
        const gun = weapons._viewGuns.ak47;
        const mesh = gun && gun.children.find(child => child.isMesh);
        return {
          childMeshCount: gun ? gun.children.filter(child => child.isMesh).length : 0,
          fusedViewModel: !!(mesh && mesh.userData && mesh.userData.fusedViewModel),
          triangles: mesh && mesh.geometry && mesh.geometry.index ? mesh.geometry.index.count / 3 : 0,
          vertices: mesh && mesh.geometry && mesh.geometry.attributes.position ? mesh.geometry.attributes.position.count : 0,
          sourceHash: window.Ak47Model && window.Ak47Model.metadata && window.Ak47Model.metadata.sourceHash,
          qualityProfile: window.Ak47Model && window.Ak47Model.metadata && window.Ak47Model.metadata.qualityProfile,
          sourceForwardAxis: window.Ak47Model && window.Ak47Model.metadata && window.Ak47Model.metadata.sourceForwardAxis,
          runtimeForwardAxis: window.Ak47Model && window.Ak47Model.metadata && window.Ak47Model.metadata.runtimeForwardAxis,
          rotationY: mesh ? mesh.rotation.y : null,
          albedo: !!(gun.userData && gun.userData.material && gun.userData.material.map),
          normal: !!(gun.userData && gun.userData.material && gun.userData.material.normalMap),
          mr: !!(gun.userData && gun.userData.material && gun.userData.material.roughnessMap) &&
            gun.userData.material.roughnessMap === gun.userData.material.metalnessMap,
          anisotropy: gun && gun.userData && gun.userData.material && gun.userData.material.map ?
            gun.userData.material.map.anisotropy : 0,
          textureSize: window.Ak47Tex && window.Ak47Tex.size,
          mrSize: window.Ak47Tex && window.Ak47Tex.mrSize,
        };
      })(),
    };
  });
  await context.close();
  return { errors, runtime, poses };
}

(async () => {
  const localServer = createServer();
  await new Promise(resolve => localServer.listen(0, '127.0.0.1', resolve));
  const address = localServer.address();
  const baseUrl = `http://127.0.0.1:${address.port}/`;
  const executablePath = process.env.PLAYWRIGHT_CHROME ||
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const desktop = await verifyProfile(browser, baseUrl, {
      name: 'desktop',
      context: { viewport: { width: 1280, height: 720 } },
    });
    const mobile = await verifyProfile(browser, baseUrl, {
      name: 'mobile',
      lowEnd: true,
      context: {
        viewport: { width: 844, height: 390 },
        screen: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
        userAgent: 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
      },
    });
    const report = { desktop, mobile };
    const reportPath = path.join(outputDir, 'hands-browser-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));

    const assertions = [
      desktop.errors.length === 0,
      mobile.errors.length === 0,
      desktop.runtime.handMeshCount === 2,
      desktop.runtime.triangles === 17996,
      desktop.runtime.leftName === 'hand-left' && desktop.runtime.rightName === 'hand-right',
      desktop.runtime.albedo && desktop.runtime.normal && desktop.runtime.mr,
      desktop.runtime.ak.childMeshCount === 1,
      desktop.runtime.ak.fusedViewModel,
      desktop.runtime.ak.triangles === 39674,
      desktop.runtime.ak.vertices === 86131,
      desktop.runtime.ak.sourceForwardAxis === '+X' && desktop.runtime.ak.runtimeForwardAxis === '-Z',
      desktop.runtime.ak.qualityProfile === 'v1-v2-capacity-fusion',
      desktop.runtime.ak.textureSize === 1536 && desktop.runtime.ak.mrSize === 768,
      desktop.runtime.ak.albedo && desktop.runtime.ak.normal && desktop.runtime.ak.mr,
      desktop.runtime.ak.anisotropy === Math.min(8, desktop.runtime.renderer.maxAnisotropy),
      Math.abs(desktop.runtime.ak.rotationY - Math.PI / 2) < 0.000001,
      mobile.runtime.lowEnd && mobile.runtime.albedo && !mobile.runtime.normal && !mobile.runtime.mr,
      mobile.runtime.ak.childMeshCount === 1 && mobile.runtime.ak.fusedViewModel,
      mobile.runtime.ak.triangles === 39674 && mobile.runtime.ak.vertices === 86131,
      mobile.runtime.ak.albedo && mobile.runtime.ak.normal && mobile.runtime.ak.mr,
      mobile.runtime.ak.anisotropy === Math.min(8, mobile.runtime.renderer.maxAnisotropy),
      Math.abs(mobile.runtime.ak.rotationY - Math.PI / 2) < 0.000001,
      mobile.runtime.renderer.pixelRatio <= 1.25,
      Object.values(desktop.poses).every(pose => pose.visibleGun.length === 1),
      desktop.poses.ak47.handsVisible === false,
      Math.abs(desktop.poses.ak47.akRotationY - Math.PI / 2) < 0.000001,
      desktop.poses.usp.handsVisible === true && desktop.poses.awp.handsVisible === true,
      Object.entries(desktop.poses).filter(([id]) => id !== 'ak47').every(([, pose]) =>
        pose.reload.left.position.some((value, index) => Math.abs(value - pose.left.position[index]) > 0.001)),
      Object.entries(desktop.poses).filter(([id]) => id !== 'ak47').every(([, pose]) =>
        pose.reload.right.position.every((value, index) => Math.abs(value - pose.right.position[index]) < 0.000001)),
      Object.values(desktop.poses).every(pose => pose.reload.viewGroup.position[1] < -0.09),
    ];
    if (assertions.some(value => !value)) process.exitCode = 1;
  } finally {
    await browser.close();
    await new Promise(resolve => localServer.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
