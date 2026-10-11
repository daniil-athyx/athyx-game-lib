with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'spawnPlayer|spawnAt', text)]
print("spawnPlayer/spawnAt matches:", len(matches))
for idx in matches[:6]:
    start = max(0, idx - 50)
    end = min(len(text), idx + 200)
    print(text[start:end])
    print("="*40)
