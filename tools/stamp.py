import io, re, os, hashlib, glob
os.chdir('/Users/shivin/Desktop/website2')
seen = {}
def sub(m):
    attr, name, ver = m.group(1), m.group(2), m.group(3)
    if not os.path.exists(name):
        print('  MISSING FILE for', name); return m.group(0)
    h = hashlib.md5(open(name, 'rb').read()).hexdigest()[:8]
    seen[name] = h
    return '%s="%s?v=%s"' % (attr, name, h)
tot = 0
for f in sorted(glob.glob('*.html')):
    src = io.open(f, encoding='utf-8').read()
    if f == 'index.html': assert len(src) > 50000, 'index.html looks truncated -- refusing to write'
    out = re.sub(r'(src|href)="([A-Za-z0-9_.-]+\.(?:js|css|png|svg))\?v=([0-9a-f]+)"', sub, src)
    io.open(f + '.tmp', 'w', encoding='utf-8').write(out); os.replace(f + '.tmp', f); tot += 1
print('stamped', len(seen), 'assets across', tot, 'pages')
