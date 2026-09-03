// 勋章系统与分享能力专项测试
// 运行：node tests/test_medals.js
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function createRuntime() {
  const sandbox = {
    console,
    document: { getElementById() { return null; } },
    window: {},
  };
  vm.createContext(sandbox);
  for (const file of ['config.js', 'medal_system.js', 'medal_share.js']) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(source, sandbox, { filename: file });
  }
  return {
    sandbox,
    config: sandbox.window.CONFIG,
    MedalSystem: sandbox.window.MedalSystem,
    MedalShare: sandbox.window.MedalShare,
  };
}

function memoryStorage(raw = null) {
  let value = raw;
  return {
    getItem() {
      return value;
    },
    setItem(_key, next) {
      value = String(next);
    },
    read() {
      return value;
    },
  };
}

function makeSystem(runtime, storage) {
  return new runtime.MedalSystem({
    medals: runtime.config.medals.list,
    storageKey: runtime.config.medals.storageKey,
    storage,
  });
}

function ids(items) {
  return Array.from(items, (item) => item.id);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${error && error.stack ? error.stack : error}`);
  }
}

async function main() {
  const runtime = createRuntime();
  const medals = runtime.config.medals.list;
  const expected = [
    ['first_edge', 25],
    ['vanguard', 100],
    ['veteran', 300],
    ['elite', 750],
    ['ace', 1500],
    ['one_man_stand', 3000],
  ];

  console.log('--- A. medal configuration and threshold boundaries ---');
  await check('六枚勋章 ID、阈值严格匹配且按升序排列', () => {
    const actual = Array.from(medals, (medal) => [medal.id, medal.kills]);
    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(new Set(actual.map(([id]) => id)).size, 6);
    for (let index = 1; index < actual.length; index++) {
      assert.ok(actual[index - 1][1] < actual[index][1]);
    }
  });

  await check('24→25 等六个边界各只解锁对应勋章，后续击杀不重复解锁', () => {
    const system = makeSystem(runtime, memoryStorage());
    const expectedByKills = new Map(expected.map(([id, kills]) => [kills, id]));
    const unlockedCounts = new Map(expected.map(([id]) => [id, 0]));

    for (let kill = 1; kill <= 3001; kill++) {
      const result = system.recordKill({ source: 'medal-test' });
      const expectedIds = expectedByKills.has(kill) ? [expectedByKills.get(kill)] : [];
      const actualIds = ids(result.unlocked);
      assert.deepStrictEqual(actualIds, expectedIds, `击杀 ${kill} 的解锁结果不正确`);
      for (const id of actualIds) unlockedCounts.set(id, unlockedCounts.get(id) + 1);
    }

    assert.deepStrictEqual(Array.from(unlockedCounts.values()), [1, 1, 1, 1, 1, 1]);
    assert.strictEqual(system.snapshot().careerKills, 3001);
  });

  console.log('--- B. persistence, sanitization and public state APIs ---');
  await check('careerKills 和 announcedMedals 可跨 MedalSystem 实例恢复', () => {
    const storage = memoryStorage();
    const first = makeSystem(runtime, storage);
    for (let index = 0; index < 137; index++) first.recordKill();
    assert.strictEqual(first.markAnnounced('first_edge'), true);

    const second = makeSystem(runtime, storage);
    const snapshot = plain(second.snapshot());
    assert.strictEqual(snapshot.careerKills, 137);
    assert.deepStrictEqual(snapshot.announcedMedals, ['first_edge']);
    assert.strictEqual(second.getNextMedal().id, 'veteran');
    assert.deepStrictEqual(ids(second.pendingAnnouncements()), ['vanguard']);
  });

  await check('损坏 JSON、负数、非整数和未知 announced ID 会被安全清洗', () => {
    const malformed = makeSystem(runtime, memoryStorage('{not-json'));
    assert.deepStrictEqual(plain(malformed.snapshot()), {
      version: 1,
      careerKills: 0,
      announcedMedals: [],
      persistenceAvailable: false,
    });

    const invalid = makeSystem(runtime, memoryStorage(JSON.stringify({
      version: 999,
      careerKills: -10,
      announcedMedals: ['vanguard', 'unknown', 'vanguard', null, 25],
    })));
    assert.strictEqual(invalid.snapshot().careerKills, 0);
    assert.deepStrictEqual(Array.from(invalid.snapshot().announcedMedals), ['vanguard']);

    const fractional = makeSystem(runtime, memoryStorage(JSON.stringify({
      careerKills: 12.5,
      announcedMedals: ['not-a-medal'],
    })));
    assert.strictEqual(fractional.snapshot().careerKills, 0);
    assert.deepStrictEqual(Array.from(fractional.snapshot().announcedMedals), []);
  });

  await check('getNextMedal、getProgress、pendingAnnouncements 和 markAnnounced 行为正确', () => {
    const storage = memoryStorage(JSON.stringify({ careerKills: 100, announcedMedals: [] }));
    const system = makeSystem(runtime, storage);

    assert.strictEqual(system.getNextMedal().id, 'veteran');
    const progress = Array.from(system.getProgress(), (medal) => ({
      id: medal.id,
      kills: medal.kills,
      unlocked: medal.unlocked,
    }));
    assert.deepStrictEqual(progress.map((medal) => medal.unlocked), [true, true, false, false, false, false]);
    assert.deepStrictEqual(ids(system.pendingAnnouncements()), ['first_edge', 'vanguard']);
    assert.strictEqual(system.markAnnounced('vanguard'), true);
    assert.strictEqual(system.markAnnounced('vanguard'), false);
    assert.strictEqual(system.markAnnounced('unknown'), false);
    assert.deepStrictEqual(ids(system.pendingAnnouncements()), ['first_edge']);
    assert.strictEqual(system.markAnnounced('first_edge'), true);
    assert.deepStrictEqual(ids(system.pendingAnnouncements()), []);

    const complete = makeSystem(runtime, memoryStorage(JSON.stringify({ careerKills: 3000 })));
    assert.strictEqual(complete.getNextMedal(), null);
    assert.strictEqual(complete.getProgress().every((medal) => medal.unlocked), true);
  });

  await check('storage getItem/setItem 抛错时 recordKill 不阻断且保留内存计数', () => {
    const getFailure = {
      getItem() { throw new Error('get failure'); },
      setItem() { throw new Error('set failure'); },
    };
    const getSystem = makeSystem(runtime, getFailure);
    const getResult = getSystem.recordKill();
    assert.strictEqual(getResult.careerKills, 1);
    assert.strictEqual(getResult.persisted, false);
    assert.strictEqual(getSystem.snapshot().careerKills, 1);

    const setFailure = {
      getItem() { return null; },
      setItem() { throw new Error('set failure'); },
    };
    const setSystem = makeSystem(runtime, setFailure);
    const setResult = setSystem.recordKill();
    assert.strictEqual(setResult.careerKills, 1);
    assert.strictEqual(setResult.persisted, false);
    assert.strictEqual(setSystem.snapshot().careerKills, 1);
  });

  console.log('--- C. share payload and local media fallback ---');
  await check('note payload 限制标题/正文长度并只带本地或 data URL 媒体', () => {
    const system = makeSystem(runtime, memoryStorage());
    for (let index = 0; index < 25; index++) system.recordKill();
    const share = new runtime.MedalShare({
      system,
      config: runtime.config.medals,
      bindTap() {},
      toast() {},
    });
    share.activeMedal = {
      ...medals[0],
      title: '勋章名称'.repeat(40),
    };
    share.activeStats = { runKills: 7 };
    const dataUrl = 'data:image/jpeg;base64,ZmFrZS1tZWRpYQ==';
    const payload = share._notePayload(dataUrl);

    assert.ok(typeof payload.title === 'string' && payload.title.length <= 20);
    assert.ok(typeof payload.content === 'string' && payload.content.length <= 1000);
    assert.strictEqual(typeof payload.tags, 'string');
    assert.ok(payload.mediaInfo && Array.isArray(payload.mediaInfo.image_resources));
    assert.strictEqual(payload.mediaInfo.image_resources.length, 1);
    const mediaUrl = payload.mediaInfo.image_resources[0].url;
    assert.strictEqual(mediaUrl, dataUrl);
    assert.ok(/^(?:data:|(?:wxfile|xhs):\/\/|\/|\.\.?\/)/i.test(mediaUrl));
    assert.ok(!/^https?:\/\//i.test(mediaUrl));
  });

  await check('_mediaUrl 在临时文件成功时返回 filePath，抛错时回退 data URI', async () => {
    const system = makeSystem(runtime, memoryStorage());
    const dataUrl = 'data:image/jpeg;base64,ZmFrZS1jYXJk';
    const successShare = new runtime.MedalShare({ system, config: runtime.config.medals });
    successShare._dataUrl = dataUrl;
    const writes = [];
    const filePath = await successShare._mediaUrl({
      async writeTempFile(payload) {
        writes.push(payload);
        return { filePath: 'wxfile://tmp/medal-card.jpg' };
      },
    });
    assert.strictEqual(filePath, 'wxfile://tmp/medal-card.jpg');
    assert.strictEqual(successShare._filePath, filePath);
    assert.deepStrictEqual(plain(writes), [{ data: dataUrl }]);

    const fallbackShare = new runtime.MedalShare({ system, config: runtime.config.medals });
    fallbackShare._dataUrl = dataUrl;
    const fallback = await fallbackShare._mediaUrl({
      async writeTempFile() {
        throw new Error('temporary file unavailable');
      },
    });
    assert.strictEqual(fallback, dataUrl);
    assert.strictEqual(fallbackShare._filePath, '');
  });

  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
