with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'var\s+ei\s*=\s*[^;]+;', text)
print("ei matches:", matches[:5])
