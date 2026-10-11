with open('src/main.js', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find('let M = !!c && j["i')
print(c[idx:idx+1500])
