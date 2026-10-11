with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
print("texSubImage2D:", len(re.findall(r'texSubImage2D', text)))
print("compressedTexSubImage2D:", len(re.findall(r'compressedTexSubImage2D', text)))
print("compressedTexImage2D:", len(re.findall(r'compressedTexImage2D', text)))
print("compressedTexImage3D:", len(re.findall(r'compressedTexImage3D', text)))
print("compressedTexSubImage3D:", len(re.findall(r'compressedTexSubImage3D', text)))
print("texImage2D:", len(re.findall(r'texImage2D', text)))
