with open('src/main.js', 'r', encoding='utf-8', errors='ignore') as f:
    txt = f.read()

import re
lines = txt.split('\n')
for i, l in enumerate(lines):
    if 'new Game(' in l or 'new class' in l or 'startGame' in l or 'window.game' in l or 'window["game"]' in l:
        print(f'{i+1}: {l[:120]}')
