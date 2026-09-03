const fs = require('fs');
const file = 'weapon.js';
let text = fs.readFileSync(file, 'utf8');

const s = text.indexOf('  _buildAwp(armyMat, woodMat, darkMat, darkDarkMat) {');
const e = text.indexOf('  _spawnMuzzleFlash() {', s);
if (s < 0 || e < 0) { console.error('markers not found'); process.exit(1); }

const f = `  _buildAwp(armyMat, woodMat, darkMat, darkDarkMat) {
    const g = new THREE.Group(), X = 0.22, dark = darkDarkMat || darkMat;
    const black = new THREE.MeshPhysicalMaterial({color:0x2B2B2B,metalness:0.30,roughness:0.70,clearcoat:0.10});
    const olive = new THREE.MeshPhysicalMaterial({color:0x4A5D3F,metalness:0.20,roughness:0.75,clearcoat:0.05});
    const steel = new THREE.MeshPhysicalMaterial({color:0x8C9099,metalness:0.85,roughness:0.25,clearcoat:0.40});
    const scopeMat = new THREE.MeshPhysicalMaterial({color:0x3C4048,metalness:0.55,roughness:0.45,clearcoat:0.20});

    // 1. Barrel: heavy 63cm, #8C9099, with muzzle brake
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.020,0.55,16),steel);
    barrel.rotation.x = Math.PI/2; barrel.position.set(X,-0.16,-1.02); barrel.castShadow=true; g.add(barrel);
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.022,0.04,12),steel);
    brake.rotation.x = Math.PI/2; brake.position.set(X,-0.16,-1.30); g.add(brake);
    for(let i=0;i<3;i++){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.042,8),dark);p.rotation.x=Math.PI/2;p.position.set(X,-0.16+(i-1)*0.009,-1.30);g.add(p);}

    // 2. Receiver: cylindrical bolt-action, #2B2B2B, 20cm
    const rec = new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.22,16),black);
    rec.rotation.x = Math.PI/2; rec.position.set(X,-0.16,-0.62); rec.castShadow=true; g.add(rec);
    const recFlat = new THREE.Mesh(new THREE.BoxGeometry(0.030,0.012,0.20),black);
    recFlat.position.set(X,-0.138,-0.62); g.add(recFlat);

    // 3. Bolt handle: curved L + ball knob
    const bp = new THREE.CatmullRomCurve3([new THREE.Vector3(X+0.028,-0.16,-0.56),new THREE.Vector3(X+0.045,-0.12,-0.54),new THREE.Vector3(X+0.058,-0.09,-0.52)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(bp,10,0.005,8,false),dark));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.010,10,8),dark)).position.set(X+0.058,-0.09,-0.52);

    // 4. Scope: large optical #3C4048, Picatinny dual-ring
    const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.034,0.034,0.26,16),scopeMat);
    sc.rotation.x=Math.PI/2; sc.position.set(X,-0.065,-0.52); sc.castShadow=true; g.add(sc);
    const scF = new THREE.Mesh(new THREE.CylinderGeometry(0.038,0.034,0.04,16),scopeMat);
    scF.rotation.x=Math.PI/2; scF.position.set(X,-0.065,-0.39); g.add(scF);
    const scR = new THREE.Mesh(new THREE.CylinderGeometry(0.030,0.034,0.04,16),scopeMat);
    scR.rotation.x=Math.PI/2; scR.position.set(X,-0.065,-0.65); g.add(scR);
    // Picatinny rail on receiver
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.016,0.005,0.18),dark);
    rail.position.set(X,-0.132,-0.52); g.add(rail);
    // Dual rings
    [0.42,0.58].forEach(z=>{const m=new THREE.Mesh(new THREE.TorusGeometry(0.038,0.005,8,16),dark);m.rotation.x=Math.PI/2;m.position.set(X,-0.12,-z);g.add(m);});

    // 5. Magazine: box 9cm, #2B2B2B
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.036,0.090,0.042),black);
    mag.position.set(X,-0.26,-0.54); mag.rotation.x=0.06; g.add(mag);

    // 6. Trigger guard + trigger
    const tg = new THREE.Mesh(new THREE.TorusGeometry(0.015,0.003,6,12,Math.PI),dark);
    tg.rotation.x=Math.PI/2; tg.position.set(X,-0.21,-0.50); g.add(tg);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.004,0.012,0.005),dark)).position.set(X,-0.21,-0.50);

    // 7. Thumbhole stock: #2B2B2B base + #4A5D3F side panels, 35cm x 16cm x 5cm
    const sp = new THREE.Shape();
    sp.moveTo(0,0); sp.lineTo(0.22,0); sp.quadraticCurveTo(0.25,-0.005,0.25,-0.03);
    sp.lineTo(0.25,-0.08); sp.quadraticCurveTo(0.24,-0.10,0.20,-0.10);
    sp.lineTo(0.03,-0.09); sp.quadraticCurveTo(0.01,-0.07,0.01,-0.04);
    sp.lineTo(0.01,-0.01); sp.closePath();
    const hole = new THREE.Path(); hole.absellipse(0.11,-0.048,0.038,0.030,0,Math.PI*2,false,0); sp.holes.push(hole);
    const sg = new THREE.ExtrudeGeometry(sp,{depth:0.050,bevelEnabled:true,bevelThickness:0.003,bevelSize:0.003,bevelSegments:2});
    sg.rotateY(-Math.PI/2);
    const stock = new THREE.Mesh(sg,black); stock.position.set(X,-0.16,-0.28); stock.castShadow=true; g.add(stock);
    // Side panels (#4A5D3F)
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.052,0.090,0.18),olive);
    sideL.position.set(X-0.027,-0.16,-0.20); g.add(sideL);
    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.052,0.090,0.18),olive);
    sideR.position.set(X+0.027,-0.16,-0.20); g.add(sideR);

    // 8. Buttpad
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.010,16),dark)).position.set(X,-0.16,-0.08);

    // 9. Bipod: deployed downward
    const bpm = new THREE.Mesh(new THREE.BoxGeometry(0.024,0.012,0.024),dark);
    bpm.position.set(X,-0.20,-0.74); g.add(bpm);
    [[-1,0.055],[1,0.055]].forEach(([sgn,off])=>{
      const lp = new THREE.CatmullRomCurve3([new THREE.Vector3(X,-0.20,-0.74),new THREE.Vector3(X+sgn*0.035,-0.26,-0.76),new THREE.Vector3(X+sgn*0.050,-0.32,-0.78)]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(lp,8,0.004,8,false),dark));
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.006,8),dark)).position.set(X+sgn*0.050,-0.32,-0.78);
    });

    // Muzzle flash
    const flash = this._makeMuzzleFlashMesh(X,-0.16,-1.32); g.add(flash); g.userData.flash = flash;
    return g;
  }

`;

fs.writeFileSync(file, text.substring(0,s) + f + text.substring(e), 'utf8');
console.log('ok');
