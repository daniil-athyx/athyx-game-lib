with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'updateCrosshair', text)]
print("updateCrosshair matches:", len(matches))
for idx in matches:
    start = max(0, idx - 50)
    end = min(len(text), idx + 200)
    print(text[start:end])
    print("="*40)
