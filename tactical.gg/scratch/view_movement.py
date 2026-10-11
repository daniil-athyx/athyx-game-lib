with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'let v = n\["weapons"\]\["maxSpeed"\]\(\);', text)
pos = m.start()
print(text[pos:pos+3000])
