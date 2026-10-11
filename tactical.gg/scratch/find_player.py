with open('src/main.js', 'r', encoding='utf-8', errors='ignore') as f:
    txt = f.read()

import re
lines = txt.split('\n')
for i, l in enumerate(lines):
    if 'this["bots"]' in l or 'this["enemies"]' in l or 'class Wi' in l or 'function Wi(' in l or 'var Wi =' in l or 'let Wi =' in l:
        print(f'{i+1}: {l[:120]}')
