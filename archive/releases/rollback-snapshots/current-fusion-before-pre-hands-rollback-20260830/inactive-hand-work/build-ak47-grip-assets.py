"""Deterministically reduce the welded AK/arms/hands OBJ for the offline viewmodel."""
from __future__ import annotations
import argparse, base64, hashlib, json, math
from pathlib import Path
import numpy as np
from PIL import Image

NAMES = {"obj":"cac988e3d8ab58be230e74c9418e438c.obj", "albedo":"texture_pbr_20250901.png", "normal":"texture_pbr_20250901_normal.png", "roughness":"texture_pbr_20250901_roughness.png", "metallic":"texture_pbr_20250901_metallic.png"}
QUALITY_PROFILE = "v1-v2-capacity-fusion"
CELL_SIZE = 0.0085
ALBEDO_SIZE = 1536
NORMAL_SIZE = 1536
MR_SIZE = 768

def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""): h.update(chunk)
    return h.hexdigest()

def parse_obj(path):
    positions, uvs, faces, uv_faces = [], [], [], []
    with path.open("r", encoding="utf-8") as stream:
        for line_no, raw in enumerate(stream, 1):
            fields = raw.strip().split()
            if not fields or fields[0].startswith("#"): continue
            if fields[0] == "v": positions.append(tuple(float(v) for v in fields[1:4]))
            elif fields[0] == "vt": uvs.append(tuple(float(v) for v in fields[1:3]))
            elif fields[0] == "f":
                if len(fields) < 4: raise ValueError(f"incomplete face at line {line_no}")
                corners = [part.split("/") for part in fields[1:]]
                for i in range(1, len(corners) - 1):
                    tri = (corners[0], corners[i], corners[i + 1])
                    faces.append(tuple(int(c[0]) - 1 for c in tri)); uv_faces.append(tuple(int(c[1]) - 1 for c in tri))
    if not positions or not uvs or not faces: raise ValueError("OBJ has no position/UV faces")
    return np.asarray(positions, np.float64), np.asarray(uvs, np.float64), np.asarray(faces, np.int64), np.asarray(uv_faces, np.int64)

def simplify(positions, texcoords, faces, uv_faces, cell=CELL_SIZE):
    source_min = positions.min(0)
    keys = np.floor((positions - source_min) / cell).astype(np.int32)
    unique_keys, clusters = np.unique(keys, axis=0, return_inverse=True)
    centers = np.zeros((len(unique_keys), 3), np.float64); np.add.at(centers, clusters, positions); centers /= np.bincount(clusters)[:, None]
    cf = clusters[faces]; valid = (cf[:,0] != cf[:,1]) & (cf[:,0] != cf[:,2]) & (cf[:,1] != cf[:,2]); cf, cuv = cf[valid], uv_faces[valid]
    _, keep = np.unique(np.sort(cf, axis=1), axis=0, return_index=True); cf, cuv = cf[keep], cuv[keep]
    pairs = np.column_stack((cf.reshape(-1), cuv.reshape(-1))); unique_pairs, inverse = np.unique(pairs, axis=0, return_inverse=True)
    vertices = centers[unique_pairs[:,0]]; output_uvs = texcoords[unique_pairs[:,1]]
    index_dtype = np.uint16 if len(unique_pairs) <= 65535 else np.uint32
    output_faces = inverse.reshape(-1, 3).astype(index_dtype)
    center = (vertices.min(0) + vertices.max(0)) * 0.5; vertices -= center
    return vertices, output_uvs, output_faces, {"cellSize":cell, "clusterCount":int(len(centers)), "triangleCount":int(len(output_faces)), "vertexCount":int(len(vertices)), "center":center.tolist(), "sourceBounds":{"min":positions.min(0).tolist(), "max":positions.max(0).tolist()}}

def compute_normals(vertices, faces):
    out = np.zeros_like(vertices); tri = np.cross(vertices[faces[:,1]] - vertices[faces[:,0]], vertices[faces[:,2]] - vertices[faces[:,0]])
    for corner in range(3): np.add.at(out, faces[:,corner], tri)
    length = np.linalg.norm(out, axis=1, keepdims=True)
    if np.any(length <= 1e-12): raise ValueError("invalid normal in simplified mesh")
    return out / length

def quantize(values):
    minimum, maximum = values.min(0), values.max(0); scale = (maximum - minimum) / 65535.0; scale[scale <= 0] = 1.0
    packed = np.rint((values - minimum) / scale).clip(0, 65535).astype(np.uint16); decoded = minimum + packed.astype(np.float64) * scale
    return packed, minimum, scale, float(np.max(np.abs(decoded - values)))

def b64(values): return base64.b64encode(values.tobytes(order="C")).decode("ascii")

def write_model(path, vertices, uvs, faces, source_hash, simplify_meta):
    pp, pmin, pscale, perr = quantize(vertices); pu, umin, uscale, uerr = quantize(uvs); pn = np.rint(compute_normals(vertices, faces) * 127).clip(-127, 127).astype(np.int8)
    index_format = "H" if faces.dtype == np.uint16 else "I"
    data = {"position":b64(pp.reshape(-1)), "uv":b64(pu.reshape(-1)), "normal":b64(pn.reshape(-1)), "index":b64(faces.reshape(-1)), "indexFormat":index_format, "positionMin":pmin.tolist(), "positionScale":pscale.tolist(), "uvMin":umin.tolist(), "uvScale":uscale.tolist(), "vertexCount":int(len(vertices)), "triangleCount":int(len(faces))}
    metadata = {"version":2, "qualityProfile":QUALITY_PROFILE, "sourceHash":source_hash, "fusedViewModel":True, "description":"AK-47 plus both arms and hands as one authored grasp viewmodel", "sourceForwardAxis":"+X", "runtimeForwardAxis":"-Z", "viewRotationYRadians":math.pi / 2, "indexFormat":index_format, "quantized":True, "vertexCount":int(len(vertices)), "triangleCount":int(len(faces)), "positionMaxError":perr, "uvMaxError":uerr, "simplification":simplify_meta}
    content = """// Generated by tools/build-ak47-grip-assets.py; do not hand-edit.\n(function(global){'use strict';var DATA=%s;var META=Object.freeze(%s);function bytes(e){var r=atob(e),o=new Uint8Array(r.length);for(var i=0;i<r.length;i++)o[i]=r.charCodeAt(i);return o}function u16(e,n,m,s){var p=new Uint16Array(bytes(e).buffer),o=new Float32Array(p.length);for(var i=0;i<p.length;i++)o[i]=m[i%%n]+p[i]*s[i%%n];return o}function norm(e){var p=new Int8Array(bytes(e).buffer),o=new Float32Array(p.length);for(var i=0;i<p.length;i+=3){var x=p[i]/127,y=p[i+1]/127,z=p[i+2]/127,l=Math.hypot(x,y,z)||1;o[i]=x/l;o[i+1]=y/l;o[i+2]=z/l}return o}function build(geometry,material){var g=new THREE.BufferGeometry(),IndexArray=DATA.indexFormat==='I'?Uint32Array:Uint16Array;g.setAttribute('position',new THREE.BufferAttribute(u16(DATA.position,3,DATA.positionMin,DATA.positionScale),3));g.setAttribute('normal',new THREE.BufferAttribute(norm(DATA.normal),3));g.setAttribute('uv',new THREE.BufferAttribute(u16(DATA.uv,2,DATA.uvMin,DATA.uvScale),2));g.setIndex(new THREE.BufferAttribute(new IndexArray(bytes(DATA.index).buffer),1));g.computeBoundingSphere();var m=new THREE.Mesh(g,material);m.name='ak47-fused-grip-viewmodel';m.rotation.y=Math.PI/2;m.userData={fusedViewModel:true,source:'ak47-grip'};return m}Object.defineProperty(global,'Ak47Model',{value:Object.freeze({build:build,metadata:META,posCount:DATA.vertexCount,idxCount:DATA.triangleCount*3,idFormat:DATA.indexFormat,quantized:true}),enumerable:true,writable:false,configurable:false})})(window);\n""" % (json.dumps(data,separators=(',',':')), json.dumps(metadata,separators=(',',':')))
    path.write_text(content, encoding="utf-8", newline="\n"); return metadata

def build_textures(source, output):
    with Image.open(source / NAMES["albedo"]) as image: image.convert("RGB").resize((ALBEDO_SIZE,ALBEDO_SIZE), Image.Resampling.LANCZOS).save(output / "ak47_albedo.webp", "WEBP", quality=90, method=6, exact=True)
    with Image.open(source / NAMES["normal"]) as image: normal = image.convert("RGB").resize((NORMAL_SIZE,NORMAL_SIZE), Image.Resampling.LANCZOS)
    arr = np.asarray(normal, np.float32) / 127.5 - 1.0; arr /= np.maximum(np.linalg.norm(arr, axis=2, keepdims=True), 1e-6); Image.fromarray(np.rint((arr + 1) * 127.5).clip(0,255).astype(np.uint8), "RGB").save(output / "ak47_normal.webp", "WEBP", quality=92, method=6, exact=True)
    with Image.open(source / NAMES["roughness"]) as image: rough = np.asarray(image.convert("L").resize((MR_SIZE,MR_SIZE), Image.Resampling.LANCZOS))
    with Image.open(source / NAMES["metallic"]) as image: metal = np.asarray(image.convert("L").resize((MR_SIZE,MR_SIZE), Image.Resampling.LANCZOS))
    mr = np.empty((MR_SIZE,MR_SIZE,3), np.uint8); mr[:,:,0] = 255; mr[:,:,1] = rough; mr[:,:,2] = metal; Image.fromarray(mr,"RGB").save(output / "ak47_mr.webp", "WEBP", lossless=True, method=6, exact=True)

def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--source", type=Path, required=True); parser.add_argument("--output", type=Path, required=True); args = parser.parse_args(); args.output.mkdir(parents=True, exist_ok=True)
    obj = args.source / NAMES["obj"]; positions, texcoords, faces, uv_faces = parse_obj(obj); vertices, uvs, out_faces, smeta = simplify(positions, texcoords, faces, uv_faces)
    if len(vertices) > 131072: raise ValueError("fusion profile vertex budget exceeded")
    metadata = write_model(args.output / "ak47_model.js", vertices, uvs, out_faces, sha256(obj), smeta); build_textures(args.source, args.output)
    (args.output / "ak47_tex.js").write_text("""// Package-local AK-47 fused viewmodel PBR textures.\nwindow.Ak47Tex={albedo:'ak47_albedo.webp',normal:'ak47_normal.webp',mr:'ak47_mr.webp',metallic:'ak47_mr.webp',roughness:'ak47_mr.webp',size:1536,mrSize:768,qualityProfile:'v1-v2-capacity-fusion',mime:'image/webp'};let ak47LoadAllPromise=null;function loadAk47Texture(l,p,c,a){return new Promise(r=>l.load(p,t=>{t.userData=t.userData||{};t.userData.cs15PersistentAsset=true;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.colorSpace=c;t.anisotropy=a;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;r(t)},undefined,()=>r(null)))}window.Ak47Tex.loadAll=function(o){if(ak47LoadAllPromise)return ak47LoadAllPromise;const l=new THREE.TextureLoader(),a=Math.max(1,Math.min(8,o&&o.anisotropy||1));ak47LoadAllPromise=Promise.all([loadAk47Texture(l,window.Ak47Tex.albedo,THREE.SRGBColorSpace,a),loadAk47Texture(l,window.Ak47Tex.normal,THREE.NoColorSpace,a),loadAk47Texture(l,window.Ak47Tex.mr,THREE.NoColorSpace,a)]).then(([albedo,normal,mr])=>({albedo,normal,metallic:mr,roughness:mr,mr}));return ak47LoadAllPromise};\n""", encoding="utf-8", newline="\n")
    records = {name:{"bytes":(args.output/name).stat().st_size,"sha256":sha256(args.output/name)} for name in ("ak47_model.js","ak47_tex.js","ak47_albedo.webp","ak47_normal.webp","ak47_mr.webp")}
    (args.output / "ak47-grip-model-build.json").write_text(json.dumps({"pipeline":"ak47-fused-grip-obj-quantized-v2","qualityProfile":QUALITY_PROFILE,"source":{"obj":obj.name,"sha256":sha256(obj),"vertexCount":int(len(positions)),"triangleCount":int(len(faces))},"output":metadata,"textureDimensions":{"albedo":ALBEDO_SIZE,"normal":NORMAL_SIZE,"mr":MR_SIZE},"textures":records}, ensure_ascii=True, indent=2)+"\n", encoding="utf-8", newline="\n")

if __name__ == "__main__": main()
