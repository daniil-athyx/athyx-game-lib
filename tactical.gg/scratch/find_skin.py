with open('src/main.js', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find('function Sf(')
if idx == -1:
    idx = c.find('Sf =')
print(c[idx-50:idx+600])
