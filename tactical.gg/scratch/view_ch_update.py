with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'if \(e\["chFollow"\]\)', text)
pos = m.start()
print("Around crosshair update:")
print(text[pos-400:pos+1000])
