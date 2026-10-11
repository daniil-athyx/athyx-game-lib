with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'\["clearViewPunch"\]\(\)\s*\{', text)
pos = m.start()
print("Around clearViewPunch:")
print(text[pos-1000:pos+1500])
