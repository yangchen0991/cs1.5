// Package-local first-person hand PBR texture paths.
window.HandsTex = {
  albedo: 'hands_albedo.webp',
  normal: 'hands_normal.webp',
  mr: 'hands_mr.webp',
  metallic: 'hands_mr.webp',
  roughness: 'hands_mr.webp',
  albedoSize: 1024,
  normalSize: 1024,
  mrSize: 512,
  mime: 'image/webp'
};

let handsAlbedoPromise = null;
let handsLoadAllPromise = null;

function loadHandsTexture(loader, path, colorSpace) {
  return new Promise((resolve) => {
    loader.load(
      path,
      (texture) => {
        texture.userData = texture.userData || {};
        texture.userData.cs15PersistentAsset = true;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = colorSpace;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      () => resolve(null)
    );
  });
}

function loadHandsAlbedo(loader) {
  if (!handsAlbedoPromise) handsAlbedoPromise = loadHandsTexture(loader, window.HandsTex.albedo, THREE.SRGBColorSpace);
  return handsAlbedoPromise;
}

window.HandsTex.loadAll = function (options) {
  const lowEnd = !!(options && options.lowEnd);
  if (lowEnd) {
    const loader = new THREE.TextureLoader();
    return loadHandsAlbedo(loader).then((albedo) => ({
      albedo,
      normal: null,
      metallic: null,
      roughness: null,
      mr: null
    }));
  }
  if (handsLoadAllPromise) return handsLoadAllPromise;

  const loader = new THREE.TextureLoader();
  handsLoadAllPromise = Promise.all([
    loadHandsAlbedo(loader),
    loadHandsTexture(loader, window.HandsTex.normal, THREE.NoColorSpace),
    loadHandsTexture(loader, window.HandsTex.mr, THREE.NoColorSpace)
  ]).then(([albedo, normal, mr]) => ({
    albedo,
    normal,
    metallic: mr,
    roughness: mr,
    mr
  }));

  return handsLoadAllPromise;
};
