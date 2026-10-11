with open('src/main.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Let's search for player class
for i, line in enumerate(lines):
    if 'class ' in line and ('Player' in line or 'player' in line):
        print(f"Player class candidate line {i+1}: {line[:120]}")

# Let's search for recoil / punch / spray
for i, line in enumerate(lines):
    if 'punch' in line.lower() or 'recoil' in line.lower():
        if i < 10000:
            print(f"Recoil line {i+1}: {line[:120]}")
            if i > 2000: break
