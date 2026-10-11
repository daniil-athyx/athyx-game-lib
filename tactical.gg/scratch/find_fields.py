import re

with open('src/main.js', 'r', encoding='utf-8', errors='ignore') as f:
    txt = f.read()

matches = re.findall(r'player\["[a-zA-Z0-9_]+"\]', txt)
print('player fields:', sorted(set(matches))[:40])

matches2 = re.findall(r'game\["[a-zA-Z0-9_]+"\]', txt)
print('game fields:', sorted(set(matches2))[:40])
