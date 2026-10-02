#!/usr/bin/env python3
"""Regenerates the shared partials (menu, footer project list) in index.html and
writes the six project pages. Run from anywhere; edits files in the site folder."""
import re, os, sys

ROOT = '/Users/shivin/Desktop/website2'
SP = '/private/tmp/claude-501/-Users-shivin-Desktop-website2/106310a4-4a84-4651-8e69-9fa1df15492f/scratchpad'

PROJ = [
 dict(id='fpga',     n='01', page='fpga-cpu.html',            accent='#D5ACFF', short='FPGA CPU',           theme='fpga',     status='Current',    dest='01 · FPGA CPU'),
 dict(id='pcb',      n='02', page='robot-pcb.html',           accent='#E3B45C', short='Robot PCB',          theme='pcb',      status='Current',    dest='02 · Robot PCB'),
 dict(id='envpcb',   n='03', page='environmental-pcb.html',   accent='#5FD6D0', short='Monitoring PCB',     theme='env',      status='Shipped',    dest='03 · Monitoring PCB'),
 dict(id='robotics', n='04', page='middleton-robotics.html',  accent='#FF7A1A', short='Middleton Robotics', theme='robotics', status='Leadership', dest='04 · Middleton Robotics'),
 dict(id='flsam',     n='05', page='flsam.html',                accent='#7C93FF', short='FLSAM',               theme='flsam',     status='Live',       dest='05 · FLSAM'),
 dict(id='hydro',    n='06', page='hydroponic-chamber.html',  accent='#8EE36B', short='Growth chamber',     theme='hydro',    status='Shipped',    dest='06 · Growth chamber'),
 dict(id='glasses',  n='07', page='smart-glasses.html',       accent='#FF4FA3', short='S³ glasses',     theme='glasses',  status='Prototype',  dest='07 · S³ glasses'),
]
TITLES = {
 'fpga': 'FPGA CPU and quantized NN accelerator',
 'pcb': 'SoutheastCon competition robot PCB',
 'envpcb': 'Autonomous environmental monitoring PCB',
 'robotics': 'Middleton Robotics: leading a program to the World Championship',
 'flsam': 'FLSAM site and regional coordination',
 'hydro': 'Autonomous hydroponic growth chamber',
 'glasses': 'S\u00b3 smart glasses: AR under $150',
}
DESCS = {
 'fpga': 'A CPU in SystemVerilog, ALU and datapath first, as the foundation for a quantized neural-network accelerator. Smart Systems Lab, UF.',
 'pcb': 'The single custom board controlling every electrical system on an autonomous competition robot for IEEE SoutheastCon.',
 'envpcb': 'A custom KiCad PCB with a Teensy 4 and BME680 on a shared 3.3 V I2C bus, logging CO2, VOCs, temperature and humidity.',
 'robotics': 'Leading Middleton Robotics from 20 members to 100+ across nine FTC, VEX and FRC teams, and to the World Championship.',
 'flsam': 'The website and regional pipeline of the Florida Student Association of Mathematics, Region 4a.',
 'hydro': 'A closed-loop hydroponic chamber with a computer-vision biomass estimator. NASA Kennedy Space Center Award.',
 'glasses': 'AR smart glasses for under $150: 87 g, 1.3 s AI answers on the lens, about $83 in parts. A team of three, with an interactive 3D model.',
}
EXTRA_HEAD = {'env': ['explorers.css'], 'hydro': ['explorers.css'], 'fpga': ['explorers.css']}
EXTRA_JS = {'env': ['env.js'], 'hydro': ['hydro3d.js', 'hydro.js'], 'fpga': ['fpga.js', 'fpgamap.js']}

def read(p): return open(os.path.join(ROOT, p)).read()
def write(p, s): open(os.path.join(ROOT, p), 'w').write(s)

idx = read('index.html')

def menu_html(home):
    pre = '' if home else 'index.html'
    dest = '' if home else ' data-dest="Home" data-pa="#D5ACFF"'
    secs = [('work', 'Work'), ('capabilities', 'Capabilities'), ('architecture', 'Architecture'), ('record', 'Record'), ('foot', 'Contact')]
    items = ''
    for i, (h, t) in enumerate(secs):
        items += '      <a class="navlink menu-item" href="%s#%s"%s style="--i:%d"><span class="menu-n">%02d</span><span class="menu-t"><span>%s</span></span></a>\n' % (pre, h, dest if h != 'foot' else '', i, i + 1, t)
        if h == 'foot' and not home:
            items = items.replace('href="index.html#foot"', 'href="#foot"')
    projs = ''
    for i, p in enumerate(PROJ):
        projs += '      <a class="menu-proj" href="%s" data-pa="%s" data-dest="%s" style="--i:%d;--pc:%s"%s><span class="menu-n">%s</span><span class="menu-pt"><span>%s</span><small>%s</small></span></a>\n' % (p['page'], p['accent'], p['dest'], i + 2, p['accent'], '{CUR:%s}' % p['id'], p['n'], p['short'], p['status'])
    m = '''<div id="menuPanel" class="menu-panel on-dark" inert>
  <div class="menu-inner">
    <div class="menu-grid">
    <nav class="menu-nav" aria-label="Sections">
      <p class="lbl menu-mut menu-lab">Sections</p>
%s    </nav>
    <nav class="menu-projects" aria-label="Projects">
      <p class="lbl menu-mut menu-lab">Projects, each with its own page</p>
%s    </nav>
    </div>

    <div class="menu-foot">
      <div class="menu-col" style="--i:7">
        <p class="lbl menu-mut">Get in touch &middot; what is it about?</p>
        <div class="menu-topics">
          <a class="topic" href="mailto:shivin.r.anand@gmail.com?subject=Internship%%20inquiry&amp;body=Hi%%20Shivin%%2C%%0A%%0A">Internship</a>
          <a class="topic" href="mailto:shivin.r.anand@gmail.com?subject=Research%%20opportunity&amp;body=Hi%%20Shivin%%2C%%0A%%0A">Research</a>
          <a class="topic" href="mailto:shivin.r.anand@gmail.com?subject=Hardware%%20project&amp;body=Hi%%20Shivin%%2C%%0A%%0A">Hardware bring-up</a>
          <a class="topic" href="mailto:shivin.r.anand@gmail.com?subject=Hello%%20from%%20your%%20site&amp;body=Hi%%20Shivin%%2C%%0A%%0A">Something else</a>
        </div>
        <a class="menu-link" href="mailto:shivin.r.anand@gmail.com">shivin.r.anand@gmail.com</a>
      </div>
      <div class="menu-col" style="--i:8">
        <p class="lbl menu-mut">Elsewhere</p>
        <a class="menu-link" href="https://github.com/shividoge" target="_blank" rel="noopener">GitHub &#8599;</a>
        <a class="menu-link" href="https://www.linkedin.com/in/shivinranand/" target="_blank" rel="noopener">LinkedIn &#8599;</a>
        <a class="menu-link" href="ShivinAnandResume.pdf" target="_blank" rel="noopener">R&eacute;sum&eacute; (pdf)</a>
      </div>
      <div class="menu-col" style="--i:9">
        <p class="lbl menu-mut">Right now</p>
        <a class="menu-link" href="fpga-cpu.html" data-pa="#D5ACFF" data-dest="01 &middot; FPGA CPU">FPGA CPU &mdash; Smart Systems Lab</a>
      </div>
    </div>
  </div>
</div>''' % (items, projs)
    return m

def cur(m, pid):
    def r(mo):
        return ' aria-current="page"' if mo.group(1) == pid else ''
    return re.sub(r'\{CUR:(\w+)\}', r, m)

def footproj():
    s = ''
    for p in PROJ:
        s += '<a href="%s" data-pa="%s" data-dest="%s"><i style="--pc:%s"></i>%s &nbsp;%s</a>\n          ' % (p['page'], p['accent'], p['dest'], p['accent'], p['n'], p['short'])
    return s.rstrip()

# ---- refresh index partials --------------------------------------------------
if '<!--MENU-->' not in idx:
    a = idx.index('<div id="menuPanel"'); b = idx.index('<main id="main"')
    idx = idx[:a] + '<!--MENU-->\n<!--/MENU-->\n\n' + idx[b:]
idx = re.sub(r'<!--MENU-->.*?<!--/MENU-->', lambda m: '<!--MENU-->\n' + cur(menu_html(True), None) + '\n<!--/MENU-->', idx, flags=re.S)
if '<!--FOOTPROJ-->' in idx and '<!--/FOOTPROJ-->' not in idx:
    idx = idx.replace('<!--FOOTPROJ-->', '<!--FOOTPROJ-->\n          <!--/FOOTPROJ-->', 1)
idx = re.sub(r'<!--FOOTPROJ-->.*?<!--/FOOTPROJ-->', lambda m: '<!--FOOTPROJ-->\n          ' + footproj() + '\n          <!--/FOOTPROJ-->', idx, flags=re.S)
write('index.html', idx)

# ---- shared pieces for the project pages ------------------------------------
curtain = re.search(r'<div id="boot".*?</ul>\s*<div class="boot-foot">.*?</div>\s*</div>\s*</div>', idx, re.S).group(0)
header = re.search(r'<header id="nav".*?</header>', idx, re.S).group(0)
header = header.replace('href="#top"', 'href="index.html" data-dest="Home" data-pa="#D5ACFF"')
footer = re.search(r'<footer class="foot".*?</footer>', idx, re.S).group(0)
FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'

S3_CLASSES = ['brand', 'btn', 'chips', 'foot', 'rv', 'top', 'wrap']
S3_COLOURS = {  # the section's cyan, swapped for this page's own pink
    '52d9ff': 'ff4fa3', '1fb9e0': 'd93a86', '9be9ff': 'ffa6cf', '8aeaff': 'ff9cc8', '9fe4ff': 'ffa9d2',
    'bff4ff': 'ffd0e6', 'dff6ff': 'ffe9f3', 'd8f2fa': 'fbe4ee',
}

def s3_prefix(frag):
    """Make the section part of the site: prefix the class names it shares with the site
    (.foot, .rv, .btn ...), take its own top bar and fonts out, give each heading the site's
    heading style and number, and swap its cyan for this page's pink."""
    import re
    def attr(m):
        v = m.group(1)
        for c in S3_CLASSES: v = re.sub(r'(?<![\w-])' + c + r'(?![\w-])', 's3' + c, v)
        return 'class="' + v + '"'
    frag = re.sub(r'class="([^"]+)"', attr, frag)
    for c in S3_CLASSES:
        frag = re.sub(r'(?<![\w-])\.' + c + r'(?![\w-])', '.s3' + c, frag)
    # no section bar of its own (the site's name and menu are the bar) and no font links of its own
    frag = re.sub(r'<header class="s3top">.*?</header>\s*', '', frag, flags=re.S)
    frag = re.sub(r'<link[^>]*fonts\.g[^>]*>\s*', '', frag)
    # the model block opens like every other section of the site
    frag = re.sub(r'<div class="hero-copy">.*?</div>\s*(?=<div class="stage")',
        '<div class="hero-copy"><p class="lbl pb-n">03 &nbsp;&middot;&nbsp; The model</p><h2 class="pb-h">Turn it in your hands</h2>'
        '<p class="pb-lede">Orbit the real design, pull it apart, look through it, and ask it a question.</p></div>\n  ', frag, count=1, flags=re.S)
    # every other section head: number, label, heading, lede
    n = [3]
    def head(m):
        n[0] += 1
        return ('<div class="sec-head s3rv"><p class="lbl pb-n">%02d &nbsp;&middot;&nbsp; %s</p><h2 class="pb-h">%s</h2><p class="pb-lede">%s</p></div>'
                % (n[0], m.group(1), m.group(2), m.group(3)))
    frag = re.sub(r'<div class="sec-head s3rv">\s*<span class="eyebrow">(.*?)</span>\s*<h2>(.*?)</h2>\s*<p class="lead">(.*?)</p>\s*</div>', head, frag, flags=re.S)
    for k, v in S3_COLOURS.items():
        frag = re.sub(k, v, frag, flags=re.I)
    frag = frag.replace('rgba(82,217,255', 'rgba(255,79,163').replace('rgba(82, 217, 255', 'rgba(255,79,163').replace('rgba(110,200,235', 'rgba(255,140,200')
    return frag

def embed_html(p):
    if p['id'] != 'glasses': return ''
    f = s3_prefix(open(os.path.join(ROOT, 'tools', 's3-fragment.html')).read())
    return '<div id="embed-s3">\n' + f + '\n</div>\n'

def page(p):
    th = p['theme']
    css = ['tailwind.min.css', 'base.css', 'parts.css'] + EXTRA_HEAD.get(th, []) + ['curtain.css', 'chrome.css', 'page.css']
    js = ['curtain.js', 'menu.js', 'projects.js', 'pagedata.js', 'art.js', 'diagrams.js', 'page.js'] + EXTRA_JS.get(th, []) + ['foot.js']
    title = '%s: Shivin Anand' % TITLES[p['id']]
    menu = cur(menu_html(False), p['id'])
    h = '''<!doctype html>
<html lang="en" data-theme="%(th)s">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s</title>
<meta name="description" content="%(desc)s">
<meta property="og:title" content="%(title)s">
<meta property="og:description" content="%(desc)s">
<meta property="og:type" content="website">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="icon" type="image/png" href="favicon.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" media="print" onload="this.media='all'" href="%(fonts)s">
<noscript><link rel="stylesheet" href="%(fonts)s"></noscript>
%(css)s
<script>document.documentElement.classList.add('js');</script>
<script>try{var d=document.documentElement,ss=sessionStorage,rm=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!rm){ss.removeItem('w2tx');d.classList.add('boot','boot-tx');}}catch(e){}</script>
</head>
<body class="antialiased pp" data-project="%(id)s">

%(curtain)s

<a href="#main" class="skip">Skip to content</a>
<div id="scrollProgress" aria-hidden="true"></div>

%(header)s

%(menu)s

<main id="main" class="relative">
<div id="page"></div>
%(embed)s<div id="pageEnd"></div>

%(footer)s
</main>

%(js)s
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js" defer></script>
<script src="pagebar.js?v=0" defer></script>
</body>
</html>
''' % dict(th=th, title=title, desc=DESCS[p['id']], fonts=FONTS, id=p['id'],
           css='\n'.join('<link rel="stylesheet" href="%s?v=0">' % c if c != 'tailwind.min.css' else '<link rel="stylesheet" href="tailwind.min.css">' for c in css),
           curtain=curtain, header=header, menu=menu, footer=footer, embed=embed_html(p),
           js='\n'.join('<script src="%s?v=0" defer></script>' % j for j in js))
    return h

for p in PROJ:
    write(p['page'], page(p))
print('wrote', len(PROJ), 'pages; index partials refreshed')
