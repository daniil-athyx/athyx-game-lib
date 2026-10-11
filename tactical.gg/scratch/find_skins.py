import re, json

with open('src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

# The string array usually looks like: const arr = ["str1", "str2", ...];
# Let's extract ALL string literals from the javascript file that look like paths.
glbs = set(re.findall(r'"([a-zA-Z0-9_/\-\.]+\.glb)"', text))
pngs = set(re.findall(r'"([a-zA-Z0-9_/\-\.]+\.png)"', text))

print("Found GLBs in double quotes:", len(glbs))
print(list(glbs)[:10])

glbs2 = set(re.findall(r"'([a-zA-Z0-9_/\-\.]+\.glb)'", text))
print("Found GLBs in single quotes:", len(glbs2))
print(list(glbs2)[:10])

# Since the file is obfuscated, there is an array of strings somewhere.
# E.g. var _0x1234 = ["...", "..."]
# Let's just find all strings in double or single quotes that end with .glb or .png.
urls = set(re.findall(r'["\']([a-zA-Z0-9_\-\./]+(?:\.glb|\.png|\.jpg))["\']', text))
print("Total paths found:", len(urls))
print(list(urls)[:20])

# Just to be sure, maybe they don't have .glb in the string directly, maybe it is just names?
# Let's check the size of main.js
import os
print("Size of main.js:", os.path.getsize('src/main.js'))

