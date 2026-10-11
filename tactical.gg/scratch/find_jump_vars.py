with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'var\s+ni\s*=\s*[^;]+;', text)
print("ni matches:", matches[:5])
matches_ti = re.findall(r'var\s+ti\s*=\s*[^;]+;', text)
print("ti (gravity) matches:", matches_ti[:5])
