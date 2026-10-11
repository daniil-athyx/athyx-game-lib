with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'var\s+fr\s*=\s*[^;]+;', text)
print("fr matches:", matches[:5])
