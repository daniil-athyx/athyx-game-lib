with open('src/main.js', 'r', encoding='utf-8', errors='ignore') as f:
    txt = f.read()

lines = txt.split('\n')
for i, l in enumerate(lines):
    if '} ["damagePlayer"](' in l:
        print(f'{i+1}: {l}')
        for j in range(i, min(len(lines), i+30)):
            print(lines[j])
        break
