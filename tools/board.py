# Generates the circuit-board loader SVG + markup (deterministic).
import random, math
random.seed(7)
CX, CY = 800, 450
HALF = 100          # chip half-size
N = 10              # pins per side
PITCH = 17
PL = 18             # pin length

def fan(side):
    """return list of (pin_rect, path_d, end_pt, delay)"""
    out = []
    for i in range(N):
        o = (i - (N - 1) / 2) * PITCH            # offset along the side
        # local frame: trace leaves the chip in +u direction, spread along v
        # start point
        k = abs(i - (N - 1) / 2)                  # 0.5 .. 4.5
        spread = 44 + random.uniform(-3, 3)
        ty = (i - (N - 1) / 2) * spread           # target v
        dv = ty - o
        u0 = HALF + PL                             # pin end (distance from center)
        u1 = u0 + 30 + (4.5 - k) * 22             # jog start: outer traces jog first (nearer chip)
        u2 = u1 + abs(dv)                          # after 45 deg
        uend = 640 + random.choice([0, 40, 80, 120, 160]) - 0
        if side in ('L', 'R'):
            uend = min(uend, 690)
        else:
            uend = min(uend, 360)
        uend = max(uend, u2 + 40)
        pts = [(u0, o), (u1, o), (u2, ty), (uend, ty)]
        out.append((o, pts, uend, ty))
    return out

def to_xy(side, u, v):
    if side == 'R': return (CX + u, CY + v)
    if side == 'L': return (CX - u, CY + v)
    if side == 'B': return (CX + v, CY + u)
    if side == 'T': return (CX + v, CY - u)

paths = []; pins = []; pads = []
idx = 0
for side in 'LRTB':
    for (o, pts, uend, ty) in fan(side):
        xy = [to_xy(side, u, v) for (u, v) in pts]
        # clamp to board
        d = 'M%.1f %.1f' % xy[0] + ''.join(' L%.1f %.1f' % p for p in xy[1:])
        delay = round(random.uniform(0.0, 0.5), 3)
        paths.append((idx, d, delay))
        ex, ey = xy[-1]
        pads.append((ex, ey, idx))
        # the pin itself
        px, py = to_xy(side, HALF + PL / 2, o)
        if side in 'LR': pins.append((px - PL / 2, py - 3, PL, 6))
        else:            pins.append((px - 3, py - PL / 2, 6, PL))
        idx += 1

# extra board furniture: SMD parts sitting on some traces, mounting holes
parts = []
for (i, d, dl) in paths[::3]:
    pass

svg = []
svg.append('<svg class="boot-board" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">')
svg.append('<defs>')
for i, d, dl in paths:
    svg.append('<path id="bt%d" pathLength="1" d="%s"/>' % (i, d))
svg.append('</defs>')
svg.append('<rect class="bb-edge" x="24" y="24" width="1552" height="852" rx="26"/>')
for (x, y) in [(70, 70), (1530, 70), (70, 830), (1530, 830)]:
    svg.append('<circle class="bb-hole" cx="%d" cy="%d" r="16"/><circle class="bb-hole-in" cx="%d" cy="%d" r="6"/>' % (x, y, x, y))
svg.append('<g class="bb-base">')
for i, d, dl in paths:
    svg.append('<use href="#bt%d"/>' % i)
svg.append('</g>')
svg.append('<g class="bb-lit">')
for i, d, dl in paths:
    svg.append('<use href="#bt%d" style="--d:%s"/>' % (i, dl))
svg.append('</g>')
svg.append('<g class="bb-spark">')
for i, d, dl in paths:
    if i % 2 == 0:
        svg.append('<use href="#bt%d" style="--s:%.2fs;--o:%.2fs"/>' % (i, random.uniform(1.6, 2.8), random.uniform(0, 2)))
svg.append('</g>')
svg.append('<g class="bb-pads">')
for (x, y, i) in pads:
    svg.append('<circle cx="%.1f" cy="%.1f" r="6.5" style="--d:%s"/><circle class="bb-pad-in" cx="%.1f" cy="%.1f" r="2.4"/>' % (x, y, paths[i][2] + 0.4, x, y))
svg.append('</g>')
# chip
svg.append('<g class="bb-chip">')
svg.append('<g class="bb-pins">')
for (x, y, w, h) in pins:
    svg.append('<rect x="%.1f" y="%.1f" width="%d" height="%d" rx="1.5"/>' % (x, y, w, h))
svg.append('</g>')
svg.append('<rect class="bb-body" x="%d" y="%d" width="%d" height="%d" rx="10"/>' % (CX - HALF, CY - HALF, HALF * 2, HALF * 2))
svg.append('<circle class="bb-dot" cx="%d" cy="%d" r="5"/>' % (CX - HALF + 18, CY - HALF + 18))
svg.append('<text class="bb-num" id="bootN" x="800" y="468" text-anchor="middle">00</text>')
svg.append('<text class="bb-pct" x="800" y="504" text-anchor="middle">PERCENT</text>')
svg.append('<text class="bb-tag" x="800" y="392" text-anchor="middle">SA-01</text>')
svg.append('</g>')
svg.append('</svg>')
board = '\n'.join(svg)

markup = '''<div id="boot" class="boot" role="status" aria-live="polite" aria-label="Loading the page">
  <div class="boot-fill" aria-hidden="true"></div>
  @@BOARD@@
  <div class="boot-ui" aria-hidden="true">
    <div class="boot-head"><span class="lbl">Shivin Anand</span><span class="lbl" id="bootMode">Power-on self test</span></div>
    <div class="boot-dest"><span class="lbl">Now loading</span><b id="bootDest"></b></div>
    <ul class="boot-list">
      <li class="boot-row"><span class="st"></span><b>FPGA CPU</b><span class="v">ALU · in progress</span></li>
      <li class="boot-row"><span class="st"></span><b>Robot PCB</b><span class="v">sole designer · KiCad</span></li>
      <li class="boot-row"><span class="st"></span><b>Env board</b><span class="v">BME680 · I²C · 3.3 V</span></li>
      <li class="boot-row"><span class="st"></span><b>Robotics</b><span class="v">Rising All-Star at Worlds</span></li>
      <li class="boot-row"><span class="st"></span><b>FLSAM site</b><span class="v">60% less overhead</span></li>
      <li class="boot-row"><span class="st"></span><b>Hydro CV</b><span class="v">6.9% MAPE · 6 trials</span></li>
      <li class="boot-row"><span class="st"></span><b>S³ glasses</b><span class="v">87 g · ≈$83 in parts</span></li>
    </ul>
    <div class="boot-foot"><span class="lbl">Press any key to skip</span></div>
  </div>
</div>'''.replace('@@BOARD@@', board)
import sys
open(sys.argv[1] if len(sys.argv) > 1 else 'curtain-markup.html', 'w').write(markup)
print(len(markup), 'chars,', len(paths), 'traces')
