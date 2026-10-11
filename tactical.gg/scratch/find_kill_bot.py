with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'killEntity', text)]
print("killEntity matches:", len(matches))
for idx in matches[:5]:
    start = max(0, idx - 50)
    end = min(len(text), idx + 200)
    print(text[start:end])
    print("="*40)

# If no killEntity, search for killBot or bot death
if not matches:
    print("Searching for bot death / damage:")
    for m in re.finditer(r'botMgr', text):
        idx = m.start()
        print(text[idx-50:idx+200])
        print("-"*30)
        break
