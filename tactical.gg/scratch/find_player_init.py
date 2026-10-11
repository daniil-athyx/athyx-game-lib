with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's search for where game.player is created
import re
matches = [m.start() for m in re.finditer(r'this\["player"\]\s*=', text)]
for idx in matches[:5]:
    start = max(0, idx - 100)
    end = min(len(text), idx + 200)
    print("Match player assignment:")
    print(text[start:end])
    print("="*40)
