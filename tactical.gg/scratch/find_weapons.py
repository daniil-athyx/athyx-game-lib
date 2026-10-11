with open('src/main.js', 'r', encoding='utf-8', errors='ignore') as f:
    txt = f.read()

import re
m = re.search(r'var H = \{([^;]+)\};', txt)
if m:
    keys = re.findall(r'\[\"([a-zA-Z0-9_]+)\"\]:\s*\{', m.group(1))
    print('Weapon keys in H:', keys)
