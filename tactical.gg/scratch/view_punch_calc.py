with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'Ta\(this\["punch"\]\)', text)
pos = m.start()
print("Around punch update in weapons.update:")
print(text[pos-400:pos+800])
