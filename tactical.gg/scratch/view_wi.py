with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'var Wi\s*=\s*class\b', text)
pos = m.start()
# Print 5000 characters from Wi
print(text[pos:pos+5000])
