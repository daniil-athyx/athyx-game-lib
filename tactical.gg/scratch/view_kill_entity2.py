with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'\["killEntity"\]\(e,\s*t,\s*n,\s*r', text)
pos = m.start()
print("killEntity part 2:")
print(text[pos+2000:pos+4500])
