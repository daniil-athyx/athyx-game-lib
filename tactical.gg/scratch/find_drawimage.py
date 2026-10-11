import re

with open("src/main.js", "r", encoding="utf-8", errors="ignore") as f:
    txt = f.read()

for m in re.finditer(r'.{0,70}"score".{0,70}', txt):
    print("MATCH:", m.group(0).replace('\n', ' '))
