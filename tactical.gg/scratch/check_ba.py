with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'function ba\(', text)]
for idx in matches:
    print(text[idx:idx+500])
    print("="*40)
