with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'\["clearViewPunch"\]\(\)\s*\{', text)
pos = m.start()
# find start of class containing clearViewPunch
class_start = text.rfind('class ', 0, pos)
print("Class containing clearViewPunch:")
print(text[class_start:class_start+200])
