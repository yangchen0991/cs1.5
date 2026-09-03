const fs = require('fs');
const file = 'weapon.js';
let text = fs.readFileSync(file, 'utf8');

const startMarker = '  _buildAwp(armyMat, woodMat, darkMat, darkDarkMat) {';
const endMarker = '  _spawnMuzzleFlash() {';

const startIdx = text.indexOf(startMarker);
if (startIdx < 0) { console.error('_buildAwp not found'); process.exit(1); }

const endIdx = text.indexOf(endMarker, startIdx);
if (endIdx < 0) { console.error('_spawnMuzzleFlash not found'); process.exit(1); }

const newFunc = `  _buildAwp(armyMat, woodMat, darkMat, darkDarkMat) {
    const g = new THREE.Group();
    const X = 0.22;

    // Design: matte black polymer body + olive drab accents + brushed steel barrel
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x2B2B2B, metalness: 0.35, roughness: 0.65, clearcoat: 0.15 });
    const accentMat = new THREE.MeshPhysicalMaterial({ color: 0x4A5D3F, metalness: 0.25, roughness: 0.70, clearcoat: 0.1 });
    const barrelMat = new THREE.MeshPhysicalMaterial({ color: 0x8C9099, metalness: 0.80, roughness: 0.30, clearcoat: 0.35 });
    const scopeMat = new THREE.MeshPhysicalMaterial({ color: 0x3C4048, metalness: 0.60, roughness: 0.40, clearcoat: 0.25 });
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x4488CC, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.75, emissive: 0x112244 });
    const dark = darkDarkMat || darkMat;

    // 1. Barrel (brushed steel, tapered, with multi-port muzzle brake)
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.50, 16), barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(X, -0.16, -0.98);
    barrel.castShadow = true;
    g.add(barrel);

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

    // 2. Receiver (matte black polymer, rounded box + accent strip)
    const body = new THREE.Mesh(this._makeRoundedBox(0.058, 0.072, 0.32, 0.010), bodyMat);
    body.position.set(X, -0.17, -0.60);
    body.castShadow = true;
    g.add(body);

    const accentStrip = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.008, 0.28), accentMat);
    accentStrip.position.set(X, -0.205, -0.60);
    g.add(accentStrip);

    // 3. Bolt handle (curved L-shape with ball knob)
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

    // 4. Scope (dark gunmetal + blue lens)
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.22, 16), scopeMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(X, -0.055, -0.50);
    scope.castShadow = true;
    g.add(scope);
    const lensFront = new THREE.Mesh(new THREE.CircleGeometry(0.030, 16), lensMat);
    lensFront.position.set(X, -0.055, -0.39);
    lensFront.rotation.y = Math.PI;
    g.add(lensFront);
    const lensRear = new THREE.Mesh(new THREE.CircleGeometry(0.026, 16), lensMat);
    lensRear.position.set(X, -0.055, -0.61);
    g.add(lensRear);
    const mount1 = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.005, 8, 16), dark);
    mount1.rotation.x = Math.PI / 2;
    mount1.position.set(X, -0.115, -0.42);
    g.add(mount1);
    const mount2 = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.005, 8, 16), dark);
    mount2.rotation.x = Math.PI / 2;
    mount2.position.set(X, -0.115, -0.58);
    g.add(mount2);

    // 5. Magazine (black box, 10-round, with olive base)
    const magBox = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.095, 0.045), bodyMat);
    magBox.position.set(X, -0.26, -0.54);
    magBox.rotation.x = 0.06;
    g.add(magBox);
    const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.012, 0.047), accentMat);
    magBase.position.set(X, -0.305, -0.545);
    magBase.rotation.x = 0.06;
    g.add(magBase);

    // 6. Trigger guard + trigger
    const guardU = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.003, 6, 12, Math.PI), dark);
    guardU.rotation.x = Math.PI / 2;
    guardU.position.set(X, -0.21, -0.50);
    g.add(guardU);
    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, 0.005), dark);
    trigger.position.set(X, -0.21, -0.50);
    g.add(trigger);

    // 7. Grip (matte black + diamond texture)
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
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const dia = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.004), accentMat);
        dia.rotation.y = Math.PI / 4;
        dia.position.set(X + 0.021, -0.195 - row * 0.014, -0.455 + col * 0.012);
        g.add(dia);
      }
    }

    // 8. Thumbhole stock (matte black polymer, large central hole)
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
    const stockAccent = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.005, 0.18), accentMat);
    stockAccent.position.set(X, -0.21, -0.22);
    g.add(stockAccent);

    // 9. Buttpad (dark rubber)
    const buttPad = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.010, 16), dark);
    buttPad.rotation.x = Math.PI / 2;
    buttPad.position.set(X, -0.16, -0.09);
    g.add(buttPad);

    // 10. Bipod (deployed, View 4)
    const bipodMount = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.012, 0.025), dark);
    bipodMount.position.set(X, -0.20, -0.72);
    g.add(bipodMount);
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

    // Muzzle flash
    const flash = this._makeMuzzleFlashMesh(X, -0.16, -1.26);
    g.add(flash);
    g.userData.flash = flash;
    return g;
  }

`;

const newText = text.substring(0, startIdx) + newFunc + text.substring(endIdx);
fs.writeFileSync(file, newText, 'utf8');
console.log('replaced_ok');
