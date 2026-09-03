$file = "weapon.js"
$bytes = [System.IO.File]::ReadAllBytes($file)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# 找到 _buildAwp 函数的起始位置
$startMarker = "  _buildAwp(armyMat, woodMat, darkMat, darkDarkMat) {"
$startIdx = $text.IndexOf($startMarker)
if ($startIdx -lt 0) { Write-Error "_buildAwp start not found"; exit 1 }

# 找到 _spawnMuzzleFlash 的起始位置（_buildAwp 后的下一个函数）
$endMarker = "  _spawnMuzzleFlash() {"
$endIdx = $text.IndexOf($endMarker, $startIdx)
if ($endIdx -lt 0) { Write-Error "_spawnMuzzleFlash not found"; exit 1 }

# 新内容：辅助函数 + 新 _buildAwp
$newFunc = @"
  _makeRoundedBox(w, h, d, r) {
    const s = new THREE.Shape();
    const x0 = -w / 2, y0 = -h / 2;
    const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001);
    s.moveTo(x0 + rr, y0);
    s.lineTo(x0 + w - rr, y0);
    s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + rr);
    s.lineTo(x0 + w, y0 + h - rr);
    s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - rr, y0 + h);
    s.lineTo(x0 + rr, y0 + h);
    s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - rr);
    s.lineTo(x0, y0 + rr);
    s.quadraticCurveTo(x0, y0, x0 + rr, y0);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: d, bevelEnabled: true, bevelThickness: rr * 0.5, bevelSize: rr * 0.5, bevelSegments: 2,
    });
    geo.translate(0, 0, -d / 2);
    return geo;
  }

  _makeWoodNormalTexture(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const H = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const grain = Math.sin(x * 0.28 + Math.sin(y * 0.09) * 1.5) * 0.5 + 0.5;
        H[y * size + x] = 0.35 + grain * 0.3 + (Math.random() - 0.5) * 0.08;
      }
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const hL = H[y * size + (x + size - 1) % size];
        const hR = H[y * size + (x + 1) % size];
        const hD = H[((y + size - 1) % size) * size + x];
        const hU = H[((y + 1) % size) * size + x];
        const nx = (hL - hR) * 3;
        const ny = (hD - hU) * 1.2;
        const nz = 1;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const p = i * 4;
        img.data[p]     = (nx / len * 0.5 + 0.5) * 255;
        img.data[p + 1] = (ny / len * 0.5 + 0.5) * 255;
        img.data[p + 2] = (nz / len * 0.5 + 0.5) * 255;
        img.data[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _buildAwp(armyMat, woodMat, darkMat, darkDarkMat) {
    const g = new THREE.Group();
    const X = 0.22;

    // 按设计图（jimeng 4 视图）配色与结构重建
    const barrelMat = new THREE.MeshPhysicalMaterial({ color: 0x5a7fa0, metalness: 0.75, roughness: 0.35, clearcoat: 0.3 });
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x5a6e45, metalness: 0.5, roughness: 0.5, clearcoat: 0.2 });
    const gripMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2e32, metalness: 0.1, roughness: 0.75 });
    const stockMat = woodMat.clone();
    stockMat.color.setHex(0xcfaa7e);
    stockMat.metalness = 0;
    stockMat.roughness = 0.55;

    // 1. 枪管（蓝灰，长而细，裸露无护木）
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.52, 16), barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(X, -0.16, -1.0);
    barrel.castShadow = true;
    g.add(barrel);

    // 2. 机匣（军绿，圆角盒 + 3 条纵向刻线）
    const body = new THREE.Mesh(this._makeRoundedBox(0.055, 0.075, 0.30, 0.008), bodyMat);
    body.position.set(X, -0.17, -0.62);
    body.castShadow = true;
    g.add(body);
    for (let i = 0; i < 3; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.002, 0.26), darkDarkMat || darkMat);
      line.position.set(X, -0.195 + i * 0.018, -0.62);
      g.add(line);
    }

    // 3. 拉机柄（弯曲 L 形，AWP 标志）
    const boltPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(X + 0.028, -0.17, -0.56),
      new THREE.Vector3(X + 0.05, -0.13, -0.54),
      new THREE.Vector3(X + 0.065, -0.10, -0.52),
    ]);
    const boltTube = new THREE.Mesh(new THREE.TubeGeometry(boltPath, 10, 0.005, 8, false), darkMat);
    g.add(boltTube);
    const boltKnob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), darkDarkMat || darkMat);
    boltKnob.position.set(X + 0.065, -0.10, -0.52);
    g.add(boltKnob);

    // 4. 瞄准镜（深色，双环固定座 + 前后镜片 + 调焦钮）
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.24, 16), darkDarkMat || darkMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(X, -0.055, -0.52);
    scope.castShadow = true;
    g.add(scope);
    const scopeFront = new THREE.Mesh(new THREE.CircleGeometry(0.032, 16), darkMat);
    scopeFront.position.set(X, -0.055, -0.40);
    scopeFront.rotation.y = Math.PI;
    g.add(scopeFront);
    const scopeRear = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), darkMat);
    scopeRear.position.set(X, -0.055, -0.64);
    g.add(scopeRear);
    const mount1 = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.006, 8, 16), darkMat);
    mount1.rotation.x = Math.PI / 2;
    mount1.position.set(X, -0.12, -0.44);
    g.add(mount1);
    const mount2 = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.006, 8, 16), darkMat);
    mount2.rotation.x = Math.PI / 2;
    mount2.position.set(X, -0.12, -0.60);
    g.add(mount2);
    const focusKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), darkMat);
    focusKnob.rotation.x = Math.PI / 2;
    focusKnob.position.set(X + 0.034, -0.055, -0.52);
    g.add(focusKnob);

    // 5. 弹匣（黑色，短盒形）
    const magShape = new THREE.Shape();
    magShape.moveTo(-0.014, -0.03);
    magShape.lineTo(0.014, -0.03);
    magShape.lineTo(0.011, 0.03);
    magShape.lineTo(-0.011, 0.03);
    magShape.closePath();
    const magGeo = new THREE.ExtrudeGeometry(magShape, {
      depth: 0.035, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2
    });
    const mag = new THREE.Mesh(magGeo, darkMat);
    mag.rotation.y = Math.PI / 2;
    mag.position.set(X, -0.255, -0.55);
    g.add(mag);

    // 6. 扳机护圈（U 形）+ 扳机
    const guardU = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 6, 12, Math.PI), darkMat);
    guardU.rotation.x = Math.PI / 2;
    guardU.position.set(X, -0.215, -0.52);
    g.add(guardU);
    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.015, 0.006), darkMat);
    trigger.position.set(X, -0.215, -0.52);
    g.add(trigger);

    // 7. 握把（黑色手枪握把）
    const gripShape = new THREE.Shape();
    gripShape.moveTo(0, 0);
    gripShape.lineTo(0.018, 0);
    gripShape.lineTo(0.02, -0.055);
    gripShape.quadraticCurveTo(0.01, -0.085, 0, -0.075);
    gripShape.lineTo(-0.018, -0.055);
    gripShape.lineTo(-0.018, 0);
    gripShape.closePath();
    const gripGeo = new THREE.ExtrudeGeometry(gripShape, {
      depth: 0.04, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2
    });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.rotation.y = Math.PI / 2;
    grip.position.set(X, -0.17, -0.46);
    g.add(grip);

    // 8. 枪托（木色，ExtrudeGeometry 侧视轮廓 + 木纹法线）
    const stockShape = new THREE.Shape();
    stockShape.moveTo(0, 0);
    stockShape.lineTo(0.22, 0);
    stockShape.quadraticCurveTo(0.24, -0.015, 0.24, -0.04);
    stockShape.lineTo(0.24, -0.065);
    stockShape.quadraticCurveTo(0.22, -0.085, 0.20, -0.085);
    stockShape.lineTo(0, -0.075);
    stockShape.lineTo(0, 0);
    stockShape.closePath();
    const stockGeo = new THREE.ExtrudeGeometry(stockShape, {
      depth: 0.05, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2
    });
    stockGeo.rotateY(-Math.PI / 2);
    const stockNormal = this._makeWoodNormalTexture(128);
    stockNormal.repeat.set(2, 1);
    stockMat.normalMap = stockNormal;
    stockMat.normalScale.set(0.4, 0.4);
    const stock = new THREE.Mesh(stockGeo, stockMat);
    stock.position.set(X, -0.165, -0.32);
    stock.castShadow = true;
    g.add(stock);

    // 9. 枪托缓冲垫（深色圆形）
    const buttPad = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 16), darkMat);
    buttPad.rotation.x = Math.PI / 2;
    buttPad.position.set(X, -0.165, -0.10);
    g.add(buttPad);

    // 枪口火光
    const flash = this._makeMuzzleFlashMesh(X, -0.16, -1.26);
    g.add(flash);
    g.userData.flash = flash;
    return g;
  }

"@

# 组装新文件
$newText = $text.Substring(0, $startIdx) + $newFunc + $text.Substring($endIdx)
$newBytes = [System.Text.Encoding]::UTF8.GetBytes($newText)
[System.IO.File]::WriteAllBytes($file, $newBytes)
Write-Output "replaced_ok"
