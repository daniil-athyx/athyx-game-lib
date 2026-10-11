with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'\["playerShoot"\]\s*=', text)
if not m:
    m = re.search(r'\["playerShoot"\]\([a-zA-Z0-9_,\s]+\)\s*\{', text)
pos = m.start()
print("playerShoot method:")
print(text[pos:pos+2500])
