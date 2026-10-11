with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'texSubImage3D', text)]
print("texSubImage3D in main.js:", len(matches))
for idx in matches:
    print(text[idx-50:idx+150])
    print("="*30)
