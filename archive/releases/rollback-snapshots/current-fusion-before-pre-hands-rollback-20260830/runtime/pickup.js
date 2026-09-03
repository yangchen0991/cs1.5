// pickup.js —— 补给包拾取系统（血包 + 弹药包 + 敌人掉落护甲）
// 职责：地图上摆放补给（悬浮旋转），玩家走近自动拾取生效，
//       拾取后进入重生倒计时，倒计时结束重新出现。
// 满血/满弹药/满护甲时不消耗（保留在场上，避免浪费）。
// 经典脚本（非 ES Module）：THREE / CONFIG 由前置脚本挂到 window 提供

class Pickup {
  constructor(scene, pos, type = 'health', isDynamic = false) {
    this.pos = pos;
    this.type = type;                       // 'health' 血包 / 'ammo' 弹药包 / 'armor' 护甲（敌人掉落）
    this.isDynamic = isDynamic;             // 动态掉落物：不重生，新局清理
    this.amount = type === 'health' ? CONFIG.pickup.healAmount : 0;
    this.respawnTime = CONFIG.pickup.respawnTime;
    this.active = true;
    this._timer = 0;
    this._spin = Math.random() * Math.PI * 2;
    this._buildMesh(scene);
  }

  _buildMesh(scene) {
    const g = new THREE.Group();

    if (this.type === 'ammo') {
      // ---- 弹药包：军绿弹药箱 + 顶部弹头（黄铜色）+ 琥珀色光晕 ----
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.18, 0.28),
        new THREE.MeshStandardMaterial({ color: 0x4a5d3a, roughness: 0.6, metalness: 0.1 })
      );
      crate.position.y = 0.05;
      crate.castShadow = true;
      g.add(crate);

      // 三枚立起的弹头
      const bulletMat = new THREE.MeshStandardMaterial({ color: 0xd8a531, roughness: 0.35, metalness: 0.6 });
      for (let i = -1; i <= 1; i++) {
        const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 6), bulletMat);
        bullet.position.set(i * 0.09, 0.16, 0);
        g.add(bullet);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 6), bulletMat);
        tip.position.set(i * 0.09, 0.25, 0);
        g.add(tip);
      }

      // 琥珀色光晕（与血包的红色区分，远距离可辨）
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.55, 16),
        new THREE.MeshBasicMaterial({ color: 0xffc24d, transparent: true, opacity: 0.22, depthWrite: false })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.02;
      g.add(glow);
    } else if (this.type === 'armor') {
      // ---- 护甲（敌人掉落）：军绿防弹背心板 + 蓝色护盾光晕 ----
      // 背心前板
      const plateMat = new THREE.MeshStandardMaterial({ color: 0x3f5a3c, roughness: 0.45, metalness: 0.35 });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.22, 0.10), plateMat);
      plate.position.y = 0.08;
      plate.castShadow = true;
      g.add(plate);
      // 斜切肩部（两小块前倾板，营造背心轮廓）
      const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x35493a, roughness: 0.5, metalness: 0.3 });
      for (const side of [-1, 1]) {
        const sh = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 0.10), shoulderMat);
        sh.position.set(side * 0.15, 0.19, 0);
        sh.rotation.z = side * 0.25;
        g.add(sh);
      }
      // 中央护盾标志（浅蓝圆片，视觉识别为"护盾"）
      const shieldMat = new THREE.MeshStandardMaterial({ color: 0x7ec0ff, roughness: 0.3, metalness: 0.5, emissive: 0x2a6a9e, emissiveIntensity: 0.25 });
      const shieldDot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.014, 16), shieldMat);
      shieldDot.rotation.x = Math.PI / 2;
      shieldDot.position.set(0, 0.08, 0.052);
      g.add(shieldDot);
      // 蓝色光晕（与血包红、弹药琥珀区分）
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.55, 16),
        new THREE.MeshBasicMaterial({ color: 0x4a90e2, transparent: true, opacity: 0.22, depthWrite: false })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.02;
      g.add(glow);
    } else {
      // ---- 血包：白底医疗箱 + 红色十字 + 红色光晕 ----
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.16, 0.26),
        new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5, metalness: 0.05 })
      );
      box.position.y = 0.05;
      box.castShadow = true;
      g.add(box);

      const crossMat = new THREE.MeshStandardMaterial({ color: 0xd83030, roughness: 0.4 });
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.12), crossMat);
      vBar.position.y = 0.09;
      g.add(vBar);
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.12), crossMat);
      hBar.position.y = 0.09;
      g.add(hBar);

      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.55, 16),
        new THREE.MeshBasicMaterial({ color: 0xff6666, transparent: true, opacity: 0.22, depthWrite: false })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.02;
      g.add(glow);
    }

    g.position.set(this.pos.x, 0.6, this.pos.z);
    this.mesh = g;
    scene.add(g);
  }

  // 每帧更新：旋转/浮动 + 拾取检测 + 重生计时
  update(dt, player, hud, audio, weapons) {
    if (this.active) {
      this._spin += dt * 1.6;
      this.mesh.rotation.y = this._spin;
      this.mesh.position.y = 0.6 + Math.sin(this._spin * 0.7) * 0.06;

      // 拾取检测（水平距离）
      const dx = player.position.x - this.pos.x;
      const dz = player.position.z - this.pos.z;
      if (dx * dx + dz * dz < CONFIG.pickup.pickupRadius * CONFIG.pickup.pickupRadius) {
        if (this.type === 'ammo') {
          if (!weapons) return;
          const r = weapons.addAmmo(CONFIG.pickup.ammo);
          if (!r.added) return;             // 全满：不消耗
          hud.toast('弹药补给 ' + r.parts.join(' / '));
          if (audio) audio.heal();
        } else if (this.type === 'armor') {
          // 护盾点数：满盾不消耗，保留在场上
          if (player.armor >= CONFIG.player.maxArmor) return;
          player.addArmor(CONFIG.pickup.armorAmount);
          hud.toast(`护盾 +${CONFIG.pickup.armorAmount}`);
          if (audio) audio.heal();
        } else {
          // 满血不消耗，保留在场上
          if (player.health >= CONFIG.player.maxHealth) return;
          player.heal(this.amount);
          hud.toast(`+${this.amount} HP`);
          if (audio) audio.heal();
        }
        this.consume();
      }
    } else {
      this._timer -= dt;
      if (this._timer <= 0) {
        this.active = true;
        this.mesh.visible = true;
      }
    }
  }

  reset() {
    this.active = true;
    this.mesh.visible = true;
    this._timer = 0;
  }

  // 玩家和敌人共用同一条消耗路径，避免敌人取弹时绕过重生/动态掉落规则。
  consume() {
    if (!this.active) return false;
    this.active = false;
    this.mesh.visible = false;
    // 动态掉落物不重生；固定点位进入重生倒计时。
    this._timer = this.isDynamic ? Infinity : this.respawnTime;
    return true;
  }
}

class PickupSystem {
  constructor(scene, gameMap, player, hud, audio, weapons) {
    this.scene = scene;
    this.gameMap = gameMap;
    this.player = player;
    this.hud = hud;
    this.audio = audio;
    this.weapons = weapons;
    this.pickups = [];
    this._buildFixedPickups();
  }

  _buildFixedPickups() {
    for (const [x, z] of CONFIG.pickup.spawns) {
      this.pickups.push(new Pickup(this.scene, this._safeGroundPosition(x, z), 'health'));
    }
    for (const [x, z] of CONFIG.pickup.ammoSpawns) {
      this.pickups.push(new Pickup(this.scene, this._safeGroundPosition(x, z), 'ammo'));
    }
  }

  // 地图切换后同一组逻辑补给点也要经过当前地图碰撞层校正，避免新地图的箱体
  // 把弹药包生成在不可达结构内部，敌人和玩家都只能看到却拿不到。
  _safeGroundPosition(x, z) {
    if (this.gameMap && typeof this.gameMap.findNearestFree === 'function') {
      const safe = this.gameMap.findNearestFree(x, z, 0.35, 10);
      if (safe) return { x: safe.x, z: safe.z };
    }
    return { x, z };
  }

  _disposePickup(pk) {
    if (!pk || !pk.mesh) return;
    this.scene.remove(pk.mesh);
    const textures = new Set();
    pk.mesh.traverse((object) => {
      if (object.geometry && typeof object.geometry.dispose === 'function') object.geometry.dispose();
      const material = object.material;
      const materials = Array.isArray(material) ? material : [material];
      for (const mat of materials) {
        if (!mat) continue;
        for (const key of Object.keys(mat)) {
          const value = mat[key];
          if (value && value.isTexture) textures.add(value);
        }
        mat.dispose?.();
      }
    });
    for (const texture of textures) texture.dispose();
  }

  // 地图切换只在未开始或玩家死亡后发生；固定补给必须跟随新地图重建，
  // 否则旧地图的拾取物会残留在新地图坐标层中。
  setMap(gameMap) {
    this.gameMap = gameMap;
    for (const pk of this.pickups) this._disposePickup(pk);
    this.pickups.length = 0;
    this._buildFixedPickups();
  }

  // 敌人死亡掉落护甲（动态拾取物，新局清理、不重生）
  addDynamic(pk) {
    this.pickups.push(pk);
  }

  // 敌人只搜索已经在自己附近的弹药包；返回最近的活动补给，避免每帧创建临时数组。
  findNearestActive(type, x, z, maxDistance = Infinity) {
    let nearest = null;
    let nearestSq = maxDistance * maxDistance;
    for (const pk of this.pickups) {
      if (!pk || !pk.active || pk.type !== type) continue;
      const dx = pk.pos.x - x;
      const dz = pk.pos.z - z;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq <= nearestSq) {
        nearestSq = distanceSq;
        nearest = pk;
      }
    }
    return nearest;
  }

  // 敌人抵达弹药包时补入自己的备用弹量；弹药包由 Pickup 自己负责进入重生计时。
  collectAmmoForEnemy(enemy, pickup) {
    if (!enemy || !pickup || !pickup.active || pickup.type !== 'ammo') return false;
    const reserveMax = Math.max(0, Number(enemy.reserveMax) || 0);
    const current = Math.max(0, Number(enemy.reserve) || 0);
    if (current >= reserveMax) return false;
    const amount = Math.max(1, Number(CONFIG.enemy.ammo.pickupAmount) || 1);
    enemy.reserve = Math.min(reserveMax, current + amount);
    pickup.consume();
    return true;
  }

  update(dt) {
    for (const pk of this.pickups) pk.update(dt, this.player, this.hud, this.audio, this.weapons);
  }

  // 新一局开始时所有补给恢复；动态掉落物（敌人掉的护甲）移除
  reset() {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      if (pk.isDynamic) {
        this._disposePickup(pk);
        this.pickups.splice(i, 1);
      } else {
        pk.reset();
      }
    }
  }

  dispose() {
    for (const pk of this.pickups) this._disposePickup(pk);
    this.pickups.length = 0;
  }
}

// 经典脚本全局暴露（依赖顺序：… → audio → pickup → main）
window.PickupSystem = PickupSystem;
