with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

print('window.THREE:', 'window.THREE' in text or 'window["THREE"]' in text)
print('THREE global:', 'THREE' in text)

# Let's find where player physics / movement / speed / jump is updated
import re
print("Searching player movement...")
for m in re.finditer(r'player\.(vx|vy|vz|speed|move|jump|onGround)', text):
    start = max(0, m.start() - 50)
    end = min(len(text), m.end() + 100)
    print(text[start:end])
    break
