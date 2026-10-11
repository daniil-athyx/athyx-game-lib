import json, struct

with open('models/cs2/ctm_sas.glb', 'rb') as f:
    magic, ver, length = struct.unpack('<III', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    gltf = json.loads(f.read(chunk_len))

print('nodes:', [n.get('name') for n in gltf.get('nodes', []) if any(k in (n.get('name') or '').lower() for k in ['arm', 'glove', 'firstperson', 'sleeve'])])
print('meshes:', [m.get('name') for m in gltf.get('meshes', []) if any(k in (m.get('name') or '').lower() for k in ['arm', 'glove', 'firstperson', 'sleeve'])])
