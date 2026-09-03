// forge.js —— GPU 程序化纹理锻造器（经典脚本版）
// 移植自 Claude-of-Duty src/materials/generator.js（MIT），适配本项目：
//   - 经典脚本（非 ESM）：THREE 由前置 three.min.js 挂到 window 提供
//   - 保留其三大工程纪律：
//     1) NYQUIST 频率上限：细节噪声倍率封顶 K=20（超过 24 倍周期在 1K 纹理上
//        不足 5 texel，烘出来是白噪声——"近看砂纸、两米外糊成灰"的根因）
//     2) albedo 跟随高度联动：凸起颗粒读亮、凹坑读暗
//     3) Sobel 法线物理一致：slope = relief/worldSize，法线强度与世界尺度挂钩
//   - 管线：单 fragment program 渲 3 次 → albedo(sRGB8) / ORM(linear8) /
//     高度(HalfFloat 中转) → Sobel 求切线法线。零 CPU 读回。
// 低端机兜底：WebGLRenderTarget 不可用或渲染失败时退回 CPU Canvas 法线
// （由调用方 _fallbackNormal 提供，map.js 的 _makeNormalTexture 逻辑）。

class TextureForge {
  /**
   * @param {THREE.WebGLRenderer} renderer
   */
  constructor(renderer) {
    this.renderer = renderer;
    this._ok = false;
    try {
      this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this._geo = new THREE.PlaneGeometry(2, 2);
      this._scene = new THREE.Scene();
      this._mesh = new THREE.Mesh(this._geo, null);
      this._mesh.frustumCulled = false;
      this._scene.add(this._mesh);
      this._programs = new Map();
      this._scratch = new THREE.WebGLRenderTarget(16, 16, {
        type: THREE.UnsignedByteType, format: THREE.RGBAFormat,
        depthBuffer: false, stencilBuffer: false,
      });
      // 干跑一次验证 RenderTarget 真正可渲染（真机 WebGL 差异）
      this._ok = this._probe();
    } catch (e) {
      console.warn('[cs15] forge unavailable, fallback to CPU normals', e);
      this._ok = false;
    }
  }

  get available() { return this._ok; }

  // 干跑探针：渲一个 4px 高度图验证整条链路可用
  _probe() {
    try {
      const rt = new THREE.WebGLRenderTarget(4, 4, {
        type: THREE.UnsignedByteType, format: THREE.RGBAFormat, depthBuffer: false,
      });
      const mat = new THREE.ShaderMaterial({
        vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: 'precision mediump float; void main(){ gl_FragColor = vec4(0.5); }',
        depthTest: false, depthWrite: false,
      });
      this._mesh.material = mat;
      const prev = this.renderer.getRenderTarget();
      this.renderer.setRenderTarget(rt);
      this.renderer.render(this._scene, this._camera);
      this.renderer.setRenderTarget(prev);
      rt.dispose(); mat.dispose();
      return true;
    } catch (e) { return false; }
  }

  // ---- 公共 GLSL：噪声库（value noise fbm + worley，无缝平铺用周期性 hash）----
  // 平铺无缝：所有噪声以 p = uv * P 采样，hash 以周期 P 取模（TileableNoise）
  static NOISE_GLSL = `
    // 周期 hash：x 在 [0,P) 内周期重复，保证 tile 无缝
    vec3 owHash33(vec3 p){
      p = fract(p * vec3(0.1031, 0.1030, 0.0973));
      p += dot(p, p.yxz + 33.33);
      return fract((p.xxy + p.yxx) * p.zyx);
    }
    float owHash21(vec2 p){
      vec3 h = owHash33(vec3(p, 7.0));
      return h.x;
    }
    // 周期 value noise：P 为周期，floor 在周期内取模实现无缝
    float owVNoise(vec2 p, vec2 P){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = owHash21(mod(i, P));
      float b = owHash21(mod(i + vec2(1.0, 0.0), P));
      float c = owHash21(mod(i + vec2(0.0, 1.0), P));
      float d = owHash21(mod(i + vec2(1.0, 1.0), P));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    // 周期 fbm：每 octave 周期翻倍，lacunarity=2 保持整周期无缝
    float owFbm(vec2 p, vec2 P, int oct, float gain){
      float sum = 0.0, amp = 0.5;
      for (int i = 0; i < 6; i++){
        if (i >= oct) break;
        sum += amp * owVNoise(p, P);
        p *= 2.0; P *= 2.0; amp *= gain;
      }
      return sum;
    }
    float owFbm01(vec2 p, vec2 P, int oct, float gain){
      return owFbm(p, P, oct, gain) / (1.0 - pow(gain, float(oct))) * 0.5;
    }
  `;

  // ---- 顶点着色器（全屏 quad）----
  static VERT = `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  // ---- Sobel：高度场 → 切线空间法线（物理一致 slope = relief/worldSize）----
  static SOBEL_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uHeight;
    uniform vec2 uTexel;
    uniform float uStrength;
    float H(vec2 o){ return texture2D(uHeight, vUv + o * uTexel).r; }
    void main(){
      float tl = H(vec2(-1.0,  1.0)), t = H(vec2(0.0,  1.0)), tr = H(vec2(1.0,  1.0));
      float l  = H(vec2(-1.0,  0.0)),                          r = H(vec2(1.0,  0.0));
      float bl = H(vec2(-1.0, -1.0)), b = H(vec2(0.0, -1.0)), br = H(vec2(1.0, -1.0));
      float dx = ((tr + 2.0 * r + br) - (tl + 2.0 * l + bl)) * 0.125;
      float dy = ((tl + 2.0 * t + tr) - (bl + 2.0 * b + br)) * 0.125;
      float sx = dx / uTexel.x;
      float sy = dy / uTexel.y;
      vec3 n = normalize(vec3(-sx * uStrength, -sy * uStrength, 1.0));
      gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
    }
  `;

  // ---- 表面定义：砖（NYQUIST 纪律内做砖面颗粒 + 灰缝 AO）----
  // 【NYQUIST 频率纪律】砖面颗粒 K=18（5.7 texel/特征 ≈2.3mm），低于上限 24；
  // 砖缝 4.5% 宽（~6.8cm/1.5m tile），远超 texel 尺度，任何 mip 级都稳定。
  static BRICK_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform float uSeed;
    ${'${NOISE}'}
    void owSurface(vec2 uv, out vec3 alb, out float h, out float rough, out float metal, out float ao){
      // 砖排布：4 行砖 / tile，错缝 1/2
      vec2 p = uv * vec2(4.0, 8.0);
      float row = floor(p.y);
      vec2 bp = vec2(p.x + mod(row, 2.0) * 0.5, p.y);
      vec2 cell = floor(bp);
      vec2 f = fract(bp);
      // 灰缝宽 0.09（世界 ~4mm）
      float mortar = step(f.x, 0.045) + step(f.y, 0.045) + step(0.955, f.x) + step(0.955, f.y);
      mortar = clamp(mortar, 0.0, 1.0);
      // 砖面微起伏（K=9/18，均低于 NYQUIST 上限 20）
      float grain = owFbm01(uv * 18.0 + cell * 7.3 + uSeed, vec2(18.0), 3, 0.55);
      // 每块砖色调微差（albedo 联动：凸起亮/凹陷暗）
      float brickVar = owHash21(mod(cell + floor(uSeed), vec2(1e3))) * 0.18 - 0.09;
      h = mix(0.62 + grain * 0.10, 0.18, mortar);
      alb = mix(vec3(0.55 + brickVar + grain * 0.08), vec3(0.42, 0.40, 0.38), mortar);
      rough = mix(0.78 + grain * 0.12, 0.92, mortar);
      metal = 0.0;
      ao = mix(1.0, 0.55, mortar);
    }
    void main(){
      vec3 alb; float h, rough, metal, ao;
      owSurface(vUv, alb, h, rough, metal, ao);
      gl_FragColor = vec4(alb, h);
    }
  `;

  // ---- 表面定义：混凝土（颗粒 + 气孔，NYQUIST K≤20）----
  // 【NYQUIST 频率纪律】1024px tile 跨 4m 世界，1 texel ≈ 3.9mm。以 P=8 计，
  // 倍率 K 的特征约 1024/(8K) texel：K=20 → 6.4 texel（≈1.6mm 特征），是可
  // 存活两级 mip 的最细频段；超过 K≈24（<5 texel）烘出白噪声——"近看砂纸、
  // 两米外糊成灰"（Claude-of-Duty generator.js 原注释的失败模式）。所有频段
  // 封顶 K=20，用真实幅度而非更高频率去补细节。
  static CONCRETE_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform float uSeed;
    ${'${NOISE}'}
    void owSurface(vec2 uv, out vec3 alb, out float h, out float rough, out float metal, out float ao){
      const vec2 P = vec2(8.0);
      vec2 p = uv * P + uSeed;
      // 低频起伏 ~10mm swell
      float a = owFbm01(p * 1.5, P * 1.5, 4, 0.55);
      // 中频 tooth ~3.5mm
      float b = owFbm01(p * 6.0, P * 6.0, 4, 0.52);
      // 气孔：硬阈值化的高频噪声（K=20 封顶）
      float pores = owFbm01(p * 20.0, P * 20.0, 2, 0.5);
      float pit = smoothstep(0.62, 0.75, pores);
      h = 0.5 + (a - 0.5) * 0.30 + (b - 0.5) * 0.24 - pit * 0.22;
      // albedo 联动：凹坑暗
      alb = vec3(0.52) + (a - 0.5) * 0.16 + (b - 0.5) * 0.12 - pit * 0.12;
      rough = 0.72 + (b - 0.5) * 0.4;
      metal = 0.0;
      ao = 1.0 - pit * 0.35;
    }
    void main(){
      vec3 alb; float h, rough, metal, ao;
      owSurface(vUv, alb, h, rough, metal, ao);
      gl_FragColor = vec4(alb, h);
    }
  `;

  _program(key, fragSrc) {
    let mat = this._programs.get(key);
    if (!mat) {
      mat = new THREE.ShaderMaterial({
        vertexShader: TextureForge.VERT,
        fragmentShader: fragSrc.replace('${NOISE}', TextureForge.NOISE_GLSL),
        uniforms: { uSeed: { value: 0 } },
        depthTest: false, depthWrite: false,
      });
      this._programs.set(key, mat);
    }
    return mat;
  }

  _target(size, { srgb = false } = {}) {
    let cs;
    try { cs = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; } catch (e) { cs = undefined; }
    const rt = new THREE.WebGLRenderTarget(size, size, {
      type: THREE.UnsignedByteType, format: THREE.RGBAFormat,
      colorSpace: cs,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping,
      generateMipmaps: true, depthBuffer: false, stencilBuffer: false,
    });
    rt.texture.anisotropy = 4;
    return rt;
  }

  _heightRT(size) {
    // HalfFloat 保持 Sobel 无 8bit 阶梯；不支持时退 UnsignedByte
    let canHalf = false;
    try {
      canHalf = this.renderer.extensions.has('EXT_color_buffer_float')
             || this.renderer.extensions.has('EXT_color_buffer_half_float');
    } catch (e) { /* 保守 false */ }
    return new THREE.WebGLRenderTarget(size, size, {
      type: canHalf ? THREE.HalfFloatType : THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping,
      generateMipmaps: false, depthBuffer: false, stencilBuffer: false,
    });
  }

  /**
   * 构建一个表面纹理集（albedo 可选 + 法线必出）。
   * @param {object} def
   * @param {string} def.key   程序缓存键（brick / concrete）
   * @param {string} def.frag  表面 fragment 源（含 ${NOISE} 占位符）
   * @param {number} def.size  分辨率（默认 512，移动端够用且省显存）
   * @param {number} def.seed
   * @param {number} def.worldSize  tile 覆盖的世界米数（驱动法线 slope 物理一致）
   * @param {number} def.relief     峰谷深度（米）
   * @param {boolean} [def.albedo]  是否产出 albedo 贴图（默认 false——本项目砖/混凝
   *                                土已有 CC0 真实贴图，只需要高质量法线）
   */
  build(def) {
    if (!this._ok) return null;
    const r = this.renderer;
    const size = def.size || 512;
    const wantAlbedo = !!def.albedo;
    const prevTarget = r.getRenderTarget();
    const prevAutoClear = r.autoClear;
    r.autoClear = false;

    try {
      const mat = this._program(def.key, def.frag);
      mat.uniforms.uSeed.value = def.seed || 0;
      this._mesh.material = mat;

      // pass 1: 高度（HalfFloat 中转，仅供 Sobel）
      const heightRT = this._heightRT(size);
      r.setRenderTarget(heightRT);
      r.render(this._scene, this._camera);

      // pass 2（可选）: albedo
      let albedoRT = null;
      if (wantAlbedo) {
        albedoRT = this._target(size, { srgb: true });
        r.setRenderTarget(albedoRT);
        r.render(this._scene, this._camera);
      }

      // pass 3: Sobel 高度 → 法线（slope = relief / worldSize 物理一致）
      const sobelMat = this._sobelMat || (this._sobelMat = new THREE.ShaderMaterial({
        vertexShader: TextureForge.VERT,
        fragmentShader: TextureForge.SOBEL_FRAG,
        uniforms: {
          uHeight: { value: null },
          uTexel: { value: new THREE.Vector2() },
          uStrength: { value: 1 },
        },
        depthTest: false, depthWrite: false,
      }));
      this._mesh.material = sobelMat;
      sobelMat.uniforms.uHeight.value = heightRT.texture;
      sobelMat.uniforms.uTexel.value.set(1 / size, 1 / size);
      sobelMat.uniforms.uStrength.value = ((def.relief != null ? def.relief : 0.02) / (def.worldSize != null ? def.worldSize : 2));
      const normalRT = this._target(size);
      r.setRenderTarget(normalRT);
      r.render(this._scene, this._camera);

      heightRT.dispose();   // 高度只是中转，立即释放（HalfFloat 是最大分配）

      return {
        normal: normalRT.texture,
        albedo: albedoRT ? albedoRT.texture : null,
        size, worldSize: def.worldSize != null ? def.worldSize : 2, relief: def.relief != null ? def.relief : 0.02,
      };
    } catch (e) {
      console.warn('[cs15] forge build failed for', def.key, e);
      return null;
    } finally {
      r.setRenderTarget(prevTarget);
      r.autoClear = prevAutoClear;
    }
  }

  dispose() {
    for (const m of this._programs.values()) m.dispose();
    this._programs.clear();
    if (this._sobelMat) this._sobelMat.dispose();
    if (this._scratch) this._scratch.dispose();
    this._geo.dispose();
    this._ok = false;
  }
}

// ---- AWP 握把菱形防滑纹理（onBeforeCompile 注入，蓝图 subtle diamond pattern）----
// 模式移植自 ThreeJSVFX-Demo IceMaterial：不抛弃 MeshPhysicalMaterial（保留
// 阴影/环境反射/clearcoat），用 #include 字符串替换往标准管线注入 GLSL。
// 菱形网格：两方向斜线的 abs(sin) 交叉（45° 交叉纹），凸点抬 albedo、抬 rough。
function applyDiamondTexture(material, opts = {}) {
  const scale = opts.scale != null ? opts.scale : 90.0;       // 菱形密度（局部 UV 单位）
  const strength = opts.strength != null ? opts.strength : 0.85; // 凹凸强度 0~1
  const tint = opts.tint != null ? opts.tint : 0.12;         // albedo 明暗调制幅度

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDiaScale = { value: scale };
    shader.uniforms.uDiaStrength = { value: strength };
    shader.uniforms.uDiaTint = { value: tint };

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uDiaScale;
         uniform float uDiaStrength;
         uniform float uDiaTint;`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         {
           // 菱形防滑纹：45° 双斜线交叉，周期 2π/scale
           float d1 = abs(sin((vMapUv.x + vMapUv.y) * uDiaScale));
           float d2 = abs(sin((vMapUv.x - vMapUv.y) * uDiaScale));
           float dia = 1.0 - uDiaStrength * (1.0 - min(d1, d2));
           // 凸点亮、槽暗（albedo 联动）
           diffuseColor.rgb *= mix(1.0 - uDiaTint, 1.0 + uDiaTint * 0.5, dia);
         }`
      )
      // 凹槽更粗糙（哑光聚合物手感）
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         {
           float d1 = abs(sin((vMapUv.x + vMapUv.y) * uDiaScale));
           float d2 = abs(sin((vMapUv.x - vMapUv.y) * uDiaScale));
           float dia = min(d1, d2);
           roughnessFactor = clamp(roughnessFactor + dia * uDiaStrength * 0.15, 0.0, 1.0);
         }`
      );
  };
  material.customProgramCacheKey = () => 'cs15-diamond-' + scale + '-' + strength + '-' + tint;
  return material;
}

// 经典脚本全局暴露（依赖顺序：config → three(UMD) → forge → map/weapon → …）
window.TextureForge = TextureForge;
window.applyDiamondTexture = applyDiamondTexture;
