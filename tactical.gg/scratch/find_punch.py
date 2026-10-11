with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'clearViewPunch', text)]
for idx in matches[:5]:
    start = max(0, idx - 100)
    end = min(len(text), idx + 300)
    print("Match clearViewPunch:")
    print(text[start:end])
    print("="*40)
