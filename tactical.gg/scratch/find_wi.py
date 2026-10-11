with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'var Wi\s*=\s*class\b', text)
if m:
    pos = m.start()
    print("Found var Wi = class at:", pos)
    print(text[pos:pos+1500])
else:
    print("Wi class not found with that pattern")
