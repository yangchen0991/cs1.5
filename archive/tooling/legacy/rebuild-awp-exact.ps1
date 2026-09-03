$file = "weapon.js"
$bytes = [System.IO.File]::ReadAllBytes($file)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

$startMarker = "  _buildAwp(armyMat, woodMat, darkMat, darkDarkMat) {"
$startIdx = $text.IndexOf($startMarker)
if ($startIdx -lt 0) { Write-Error "_buildAwp start not found"; exit 1 }

$endMarker = "  _spawnMuzzleFlash() {"
$endIdx = $text.IndexOf($endMarker, $startIdx)
if ($endIdx -lt 0) { Write-Error "_spawnMuzzleFlash not found"; exit 1 }

$newFunc = @"
  _buildAwp(armyMat, woodMat, darkMat, darkDarkMat) {
    const g = new THREE.Group();
    const X = 0.22;

    // === 按 jimeng 5 视图设计图精确配色 ===
    // 主体：哑光黑聚合物 #2B2B2B
    // 点缀：军橄榄绿 #4A5D3F（握把/枪托局部）
    // 枪管：拉丝钢 #8C9099
    // 瞄准镜：暗枪灰 #3C4048 + 蓝色镜片
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x2B2B2B, metalness: 0.35, roughness: 0.65, clearcoat: 0.15 });
    const accentMat = new THREE.MeshPhysicalMaterial({ color: 0x4A5D3F, metalness: 0.25, roughness: 0.70, clearcoat: 0.1 });
    const barrelMat = new THREE.MeshPhysicalMaterial({ color: 0x8C9099, metalness: 0.80, roughness: 0.30, clearcoat: 0.35 });
    const scopeMat = new THREE.MeshPhysicalMaterial({ color: 0x3C4048, metalness: 0.60, roughness: 0.40, clearcoat: 0.25 });
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x4488CC, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.75, emissive: 0x112244 });
    const dark = darkDarkMat || darkMat;

    // 1. 枪管（拉丝钢，长细，带多孔制退器）
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.50, 16), barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(X, -0.16, -0.98);
    barrel.castShadow = true;
    g.add(barrel);

    // 多孔制退器
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.020, 0.035, 12), barrelMat);
    brake.rotation.x = Math.PI / 2;
    brake.position.set(X, -0.16, -1.24);
    g.add(brake);
    for (let i = 0; i < 3; i++) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.038, 8), dark);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(X, -0.16 + (i - 1) * 0.008, -1.24);
      g.add(hole);
    }

    // 2. 机匣（哑光黑聚合物，圆角长方）
    const body = new THREE.Mesh(this._makeRoundedBox(0.058, 0.072, 0.32, 0.010), bodyMat);
    body.position.set(X, -0.17, -0.60);
    body.castShadow = true;
    g.add(body);

    // 橄榄绿点缀条（机匣侧面）
    const accentStrip = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.008, 0.28), accentMat);
    accentStrip.position.set(X, -0.205, -0.60);
    g.add(accentStrip);

    // 3. 拉机柄（球头弯曲手柄，保留）
    const boltPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(X + 0.030, -0.17, -0.54),
      new THREE.Vector3(X + 0.048, -0.13, -0.52),
      new THREE.Vector3(X + 0.062, -0.10, -0.50),
    ]);
    const boltTube = new THREE.Mesh(new THREE.TubeGeometry(boltPath, 10, 0.005, 8, false), dark);
    g.add(boltTube);
    const boltKnob = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), dark);
    boltKnob.position.set(X + 0.062, -0.10, -0.50);
    g.add(boltKnob);

    // 4. 瞄准镜（暗枪灰 + 蓝色镜片）
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.22, 16), scopeMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(X, -0.055, -0.50);
    scope.castShadow = true;
    g.add(scope);
    // 蓝色镜片（前）
    const lensFront = new THREE.Mesh(new THREE.CircleGeometry(0.030, 16), lensMat);
    lensFront.position.set(X, -0.055, -0.39);
    lensFront.rotation.y = Math.PI;
    g.add(lensFront);
    // 蓝色镜片（后）
    const lensRear = new THREE.Mesh(new THREE.CircleGeometry(0.026, 16), lensMat);
    lensRear.position.set(X, -0.055, -0.61);
    g.add(lensRear);
    // 镜座双环
    const mount1 = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.005, 8, 16), dark);
    mount1.rotation.x = Math.PI / 2;
    mount1.position.set(X, -0.115, -0.42);
    g.add(mount1);
    const mount2 = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.005, 8, 16), dark);
    mount2.rotation.x = Math.PI / 2;
    mount2.position.set(X, -0.115, -0.58);
    g.add(mount2);

    // 5. 弹匣（较长盒形，哑光黑）
    const magBox = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.095, 0.045), bodyMat);
    magBox.position.set(X, -0.26, -0.54);
    magBox.rotation.x = 0.06;
    g.add(magBox);
    // 弹匣底部橄榄绿点缀
    const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.012, 0.047), accentMat);
    magBase.position.set(X, -0.305, -0.545);
    magBase.rotation.x = 0.06;
    g.add(magBase);

    // 6. 扳机护圈 + 扳机
    const guardU = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.003, 6, 12, Math.PI), dark);
    guardU.rotation.x = Math.PI / 2;
    guardU.position.set(X, -0.21, -0.50);
    g.add(guardU);
    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, 0.005), dark);
    trigger.position.set(X, -0.21, -0.50);
    g.add(trigger);

    // 7. 握把（哑光黑 + 菱形纹理）
    const gripShape = new THREE.Shape();
    gripShape.moveTo(0, 0);
    gripShape.lineTo(0.017, 0);
    gripShape.lineTo(0.019, -0.05);
    gripShape.quadraticCurveTo(0.01, -0.078, 0, -0.068);
    gripShape.lineTo(-0.017, -0.05);
    gripShape.lineTo(-0.017, 0);
    gripShape.closePath();
    const gripGeo = new THREE.ExtrudeGeometry(gripShape, {
      depth: 0.038, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2
    });
    const grip = new THREE.Mesh(gripGeo, bodyMat);
    grip.rotation.y = Math.PI / 2;
    grip.position.set(X, -0.17, -0.44);
    g.add(grip);
    // 菱形纹理（侧面 3x2 小菱形凸起）
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const dia = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.004), accentMat);
        dia.rotation.y = Math.PI / 4;
        dia.position.set(X + 0.021, -0.195 - row * 0.014, -0.455 + col * 0.012);
        g.add(dia);
      }
    }

    // 8. 拇指孔枪托（Thumbhole）— 设计图核心特征：中间大圆洞
    const stockShape = new THREE.Shape();
    stockShape.moveTo(0, 0);
    stockShape.lineTo(0.20, 0);
    stockShape.quadraticCurveTo(0.23, -0.01, 0.23, -0.035);
    stockShape.lineTo(0.23, -0.075);
    stockShape.quadraticCurveTo(0.22, -0.095, 0.19, -0.095);
    stockShape.lineTo(0.05, -0.085);
    stockShape.quadraticCurveTo(0.02, -0.075, 0.02, -0.05);
    stockShape.lineTo(0.02, -0.02);
    stockShape.quadraticCurveTo(0.02, 0, 0, 0);
    stockShape.closePath();
    // 拇指孔：中间挖一个大圆
    const thumbHole = new THREE.Path();
    thumbHole.absellipse(0.10, -0.045, 0.035, 0.028, 0, Math.PI * 2, false, 0);
    stockShape.holes.push(thumbHole);
    const stockGeo = new THREE.ExtrudeGeometry(stockShape, {
      depth: 0.048, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2
    });
    stockGeo.rotateY(-Math.PI / 2);
    const stock = new THREE.Mesh(stockGeo, bodyMat);
    stock.position.set(X, -0.16, -0.30);
    stock.castShadow = true;
    g.add(stock);
    // 枪托橄榄绿点缀边
    const stockAccent = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.005, 0.18), accentMat);
    stockAccent.position.set(X, -0.21, -0.22);
    g.add(stockAccent);

    // 9. 枪托缓冲垫（深色圆形）
    const buttPad = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.010, 16), dark);
    buttPad.rotation.x = Math.PI / 2;
    buttPad.position.set(X, -0.16, -0.09);
    g.add(buttPad);

    // 10. 两脚架（展开状态 — 设计图 View 4 清楚显示）
    const bipodMount = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.012, 0.025), dark);
    bipodMount.position.set(X, -0.20, -0.72);
    g.add(bipodMount);
    // 左腿
    const legLPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(X, -0.20, -0.72),
      new THREE.Vector3(X - 0.04, -0.26, -0.74),
      new THREE.Vector3(X - 0.055, -0.32, -0.76),
    ]);
    const legL = new THREE.Mesh(new THREE.TubeGeometry(legLPath, 8, 0.004, 8, false), dark);
    g.add(legL);
    const footL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 8), dark);
    footL.rotation.x = Math.PI / 2;
    footL.position.set(X - 0.055, -0.32, -0.76);
    g.add(footL);
    // 右腿
    const legRPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(X, -0.20, -0.72),
      new THREE.Vector3(X + 0.04, -0.26, -0.74),
      new THREE.Vector3(X + 0.055, -0.32, -0.76),
    ]);
    const legR = new THREE.Mesh(new THREE.TubeGeometry(legRPath, 8, 0.004, 8, false), dark);
    g.add(legR);
    const footR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 8), dark);
    footR.rotation.x = Math.PI / 2;
    footR.position.set(X + 0.055, -0.32, -0.76);
    g.add(footR);

    // 枪口火光
    const flash = this._makeMuzzleFlashMesh(X, -0.16, -1.26);
    g.add(flash);
    g.userData.flash = flash;
    return g;
  }

"@

$newText = $text.Substring(0, $startIdx) + $newFunc + $text.Substring($endIdx)
$newBytes = [System.Text.Encoding]::UTF8.GetBytes($newText)
[System.IO.File]::WriteAllBytes($file, $newBytes)
Write-Output "replaced_ok"
