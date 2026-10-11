with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'function Nt\(', text)
if m:
    pos = m.start()
    print("Found function Nt at:", pos)
    print(text[pos:pos+1500])
else:
    print("Nt not found")
