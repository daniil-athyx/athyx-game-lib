with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'\["fire"\]\(\)\s*\{', text)
pos = m.start()
print("fire method:")
print(text[pos:pos+3500])
