/* ===========================================================================
   The chamber, in 3D.

   This is the model from the project's own site (shividoge.github.io/
   hydroponics-growth-system), ported over with its hooks changed and its
   geometry left exactly as written: a procedural rebuild of the CAD design,
   so the board and the CAD stay the source of truth, and the panel says so.

   Three.js is loaded only when the explorer nears the screen, and the scene
   stops rendering whenever it is off screen or its tab is hidden.
   =========================================================================== */
(function () {
  'use strict';
  function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function visible(el,cb){new IntersectionObserver(e=>cb(e[0].isIntersecting),{rootMargin:'100px'}).observe(el)}

  window.Hydro3D = {
    init: function (o) {
      const T = window.THREE, canvas = o.canvas, stage = o.stage, labelsEl = o.labels, $ = o.$;
      const ORDER = o.order, PARTS = o.parts, reduce = o.reduce, select = o.select, labelFor = o.labelFor;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 const scene=new T.Scene();
 const cam=new T.PerspectiveCamera(36,1,.1,100);
 scene.add(new T.HemisphereLight(0xc9ccff,0x140d30,.95));
 const dl=new T.DirectionalLight(0xffffff,.85);dl.position.set(5,9,5);scene.add(dl);
 const rim=new T.DirectionalLight(0x8a6bff,.7);rim.position.set(-6,3,-6);scene.add(rim);
 const ledLight=new T.PointLight(0x8c6bff,2.2,9);ledLight.position.set(.6,3.8,0);scene.add(ledLight);
 const grid=new T.GridHelper(22,22,0x3a2f7a,0x1c1740);grid.position.y=-.02;grid.material.transparent=true;grid.material.opacity=.7;scene.add(grid);

 const M={
  white:new T.MeshStandardMaterial({color:0xecebf5,roughness:.5,metalness:.05}),
  grey:new T.MeshStandardMaterial({color:0xcfd0de,roughness:.6}),
  wall:new T.MeshStandardMaterial({color:0xd5d6e6,roughness:.5,transparent:true,opacity:.26,depthWrite:false}),
  glass:new T.MeshStandardMaterial({color:0xa8d8ff,roughness:.05,metalness:.1,transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide}),
  water:new T.MeshStandardMaterial({color:0x1fd8b8,roughness:.2,transparent:true,opacity:.38,depthWrite:false}),
  dark:new T.MeshStandardMaterial({color:0x14161f,roughness:.5,metalness:.3}),
  gold:new T.MeshStandardMaterial({color:0xd6b45a,roughness:.3,metalness:.8}),
  steel:new T.MeshStandardMaterial({color:0xb9bccb,roughness:.3,metalness:.8}),
  blue:new T.MeshStandardMaterial({color:0x2b62e8,roughness:.5}),
  leaf:new T.MeshStandardMaterial({color:0x3fbf7c,roughness:.6,emissive:0x0b3a2b}),
  rock:new T.MeshStandardMaterial({color:0xb7b0c8,roughness:.95}),
  ledOn:new T.MeshBasicMaterial({color:0xa58bff}),
  tube:new T.MeshStandardMaterial({color:0x7be8d5,roughness:.3,transparent:true,opacity:.8}),
  pump:new T.MeshStandardMaterial({color:0x2a2f45,roughness:.4,metalness:.4})
 };
 const mesh=(g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);return o};
 const box=(w,h,d,m,x,y,z)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z);
 const edge=(o,c=0x9aa8ff,op=.6)=>{o.add(new T.LineSegments(new T.EdgesGeometry(o.geometry),new T.LineBasicMaterial({color:c,transparent:true,opacity:op})));return o};
 const G={};ORDER.forEach(id=>{G[id]=new T.Group();scene.add(G[id])});
 const OFF={reservoir:0,pump:0,platform:.8,plumb:1,teensy:1.6,bme:1.6,fan:1.7,chamber:1.7,plant:2.6,led:3,camera:4};
 const NOPICK=new Set();

 // reservoir
 const res=edge(box(4,1.3,2.8,M.wall,0,.65,0),0xb9c4ff,.7);NOPICK.add(res);G.reservoir.add(res,box(4,.08,2.8,M.grey,0,.04,0));
 const wat=box(3.84,.9,2.64,M.water,0,.52,0);NOPICK.add(wat);G.reservoir.add(wat);
 // platform
 G.platform.add(edge(box(4,.3,2.8,M.white,0,1.45,0),0x8090d0,.4));
 [[0,1.66,1.35,4,.06,.1],[0,1.66,-1.35,4,.06,.1],[1.95,1.66,0,.1,.06,2.6],[-1.95,1.66,0,.1,.06,2.6]].forEach(a=>G.platform.add(box(a[3],a[4],a[5],M.white,a[0],a[1],a[2])));
 // chamber
 const ch=edge(box(2.4,2.6,2,M.glass,.6,2.9,0),0xbfd0ff,.8);NOPICK.add(ch);G.chamber.add(ch);
 [[-.6,1.6],[1.8,1.6]].forEach(a=>[-1,1].forEach(z=>G.chamber.add(box(.07,2.6,.07,M.white,a[0],2.9,z*1))));
 // led
 const ledPanel=box(2,.08,1.4,M.ledOn,.6,4.13,0);G.led.add(ledPanel);
 const ledFrame=box(2.1,.05,1.5,M.white,.6,4.19,0);G.led.add(ledFrame);
 const beam=mesh(new T.ConeGeometry(1.05,2.25,40,1,true),new T.MeshBasicMaterial({color:0x7c5cff,transparent:true,opacity:.11,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),.6,2.98,0);NOPICK.add(beam);G.led.add(beam);
 // plant
 G.plant.add(box(.55,.5,.55,M.rock,.6,1.85,0));
 const plantG=new T.Group();plantG.position.set(.6,2.12,0);G.plant.add(plantG);
 const R=rng(7);
 for(let i=0;i<11;i++){const lg=new T.Group();lg.rotation.y=i*2.399;const l=mesh(new T.SphereGeometry(1,14,9),M.leaf,.42+i*.015,.05*i,0);l.scale.set(.5-.012*i,.05,.24-.006*i);l.rotation.z=.32+R()*.25;lg.add(l);lg.position.y=i*.045;plantG.add(lg)}
 plantG.add(mesh(new T.CylinderGeometry(.03,.04,.3,8),M.leaf,0,.1,0));
 // fan
 const fanG=new T.Group();fanG.position.set(-.84,2.35,0);G.fan.add(fanG);
 fanG.add(box(.14,.75,.75,M.white),box(.12,.02,.02,M.dark));
 G.fan.add(box(.14,.55,.14,M.white,-.84,1.87,0));
 const blades=new T.Group();fanG.add(blades);
 for(let i=0;i<5;i++){const b=new T.Group();b.rotation.x=i*Math.PI*2/5;b.add(box(.03,.3,.1,M.dark,.09,.18,0));blades.add(b)}
 blades.add(mesh(new T.CylinderGeometry(.07,.07,.06,16),M.steel,.09,0,0)); blades.children[5].rotation.z=Math.PI/2;
 // teensy
 G.teensy.add(box(.5,.05,1,M.dark,-1.55,1.65,-.35),box(.22,.03,.22,M.steel,-1.55,1.69,-.2),box(.18,.09,.2,M.steel,-1.55,1.7,-.8));
 [-.2,.2].forEach(x=>G.teensy.add(box(.03,.03,.9,M.gold,-1.55+x,1.68,-.35)));
 // bme
 G.bme.add(box(.5,.04,.5,M.blue,-1.55,1.64,.85),box(.16,.04,.16,M.steel,-1.55,1.68,.85));
 [[-1.72,0xff6b7d],[-1.62,0xffd166],[-1.5,0x23e6c0],[-1.4,0x918db3]].forEach(a=>{const g=new T.BufferGeometry().setFromPoints([new T.Vector3(a[0],1.7,.1),new T.Vector3(a[0],1.7,.62)]);G.bme.add(new T.Line(g,new T.LineBasicMaterial({color:a[1]})))});
 // camera
 G.camera.add(box(.1,4.1,.1,M.white,2.3,3.65,0));
 const hold=new T.Group();G.camera.add(hold);
 hold.add(box(1.75,.09,.14,M.white,1.475,0,0),box(.55,.3,.4,M.dark,.6,-.15,0),mesh(new T.CylinderGeometry(.11,.11,.1,20),new T.MeshStandardMaterial({color:0x123a8a,metalness:.6,roughness:.2}),.6,-.35,0),box(.03,.03,.03,new T.MeshBasicMaterial({color:0xff4b5c}),.82,-.06,.21));
 let camY=4.6,camTarget=4.6;hold.position.y=camY;
 // pump
 G.pump.add(mesh(new T.CylinderGeometry(.3,.3,.55,24),M.pump,-1.3,.42,.6),mesh(new T.CylinderGeometry(.09,.09,.3,12),M.steel,-1.3,.8,.6));
 // plumbing
 const sup=new T.CatmullRomCurve3([[-1.3,.8,.6],[-1.3,1.5,1.2],[-1.3,4.0,1.2],[-.2,4.45,.95],[.1,3.9,.86],[.3,3.3,.5],[.35,2.5,.25]].map(p=>new T.Vector3(...p)));
 const ret=new T.CatmullRomCurve3([new T.Vector3(1.2,1.75,.2),new T.Vector3(1.2,1,.2)]);
 G.plumb.add(mesh(new T.TubeGeometry(sup,80,.045,8),M.tube),mesh(new T.TubeGeometry(ret,8,.05,8),M.tube));
 const drops=[];const dg=new T.SphereGeometry(.06,8,8),dm=new T.MeshBasicMaterial({color:0xbafff2});
 for(let i=0;i<16;i++){const d=new T.Mesh(dg,dm);d.userData={t:i/16,c:i<12?sup:ret};G.plumb.add(d);drops.push(d)}
 // pipe stubs drawn on platform
 // anchors (local, before explode)
 const ANCH={chamber:[1.8,3.6,1],reservoir:[2,.55,1.4],platform:[2,1.45,1.4],teensy:[-1.55,1.75,-.85],bme:[-1.55,1.75,.9],fan:[-.84,2.9,0],led:[.6,4.25,-.7],camera:[.6,4.6,0],pump:[-1.3,.7,.6],plumb:[-1.3,3.2,1.2],plant:[.6,2.5,0]};

 // selection box
 const selBox=new T.Box3Helper(new T.Box3(),0x23e6c0);scene.add(selBox);

 // orbit
 const V={az:.75,po:1.18,r:11.4,ty:2.7,az0:.75,tgtR:11.4,tgtPo:1.18,tgtAz:null,auto:true,lastTouch:0};
 const views={Iso:[.75,1.18],Front:[0,1.5],Top:[.75,.12]};let viewNames=Object.keys(views),vi=0;
 let exploded=0,exTarget=0,size=[1,1];
 function resize(){const r=stage.getBoundingClientRect();size=[r.width,r.height];renderer.setSize(r.width,r.height,false);cam.aspect=r.width/r.height;cam.setViewOffset(r.width,r.height,0,r.height>460?46:30,r.width,r.height);cam.updateProjectionMatrix();V.baseR=r.width/r.height<.95?14.2:11.4}
 V.baseR=11.4;
 addEventListener('resize',resize);resize();
 const ptrs=new Map();let moved=0,startXY=null;
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,t:e.pointerType});moved=0;startXY=[e.clientX,e.clientY];V.auto=false;V.tgtAz=null});
 canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;
  if(ptrs.size===2){const a=[...ptrs.values()];const d0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);p.x=e.clientX;p.y=e.clientY;const d1=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);V.tgtR=clamp(V.tgtR*d0/Math.max(d1,1),6,26);moved=99;return}
  const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);
  V.az-=dx*.0075;V.tgtAz=null;if(p.t==='mouse')V.po=clamp(V.po-dy*.006,.1,1.65)});
 const up=e=>{const was=ptrs.get(e.pointerId);ptrs.delete(e.pointerId);V.lastTouch=performance.now();
  if(was&&moved<6&&ptrs.size===0)pick(e)};
 canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',e=>ptrs.delete(e.pointerId));
 canvas.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();V.tgtR=clamp(V.tgtR*(1+e.deltaY*.002),6,26)}},{passive:false});
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const ray=new T.Raycaster(),pm=[];
 ORDER.forEach(id=>G[id].traverse(o=>{if(o.isMesh&&!NOPICK.has(o)){o.userData.part=id;pm.push(o)}}));
 function pick(e){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1),cam);
  const h=ray.intersectObjects(pm,false)[0];if(h)select(h.object.userData.part)}

 // toolbar
 const tog=(id,fn)=>{const b=$(id);b.onclick=()=>{const v=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',v);fn(v)}};
 let ledOn=true,flowOn=true,fanOn=true,labOn=false;labelsEl.style.display='none';
 tog('#bExplode',v=>{exTarget=v?1:0});
 tog('#bLed',v=>{ledOn=v});tog('#bFlow',v=>{flowOn=v});tog('#bFan',v=>{fanOn=v});
 tog('#bLabels',v=>{labOn=v;labelsEl.style.display=v?'':'none'});
 tog('#bCam',v=>{camTarget=v?5.1:4.6;$('#bCam').textContent=v?'Camera low':'Camera high'});
 $('#bView').onclick=()=>{vi=(vi+1)%viewNames.length;const k=viewNames[vi];$('#bView').textContent='View: '+k;V.auto=false;V.tgtAz=views[k][0];V.tgtPo=views[k][1]};
 $('#bIn').onclick=()=>{V.tgtR=clamp(V.tgtR*.82,6,26)};$('#bOut').onclick=()=>{V.tgtR=clamp(V.tgtR*1.2,6,26)};
 V.tgtR=V.baseR;V.r=V.baseR;

 let run=true,shown=true,tabOn=true;visible(stage,v=>{shown=v;run=shown&&tabOn});
 const clock=new T.Clock(),v3=new T.Vector3(),bx=new T.Box3();
 function frame(){requestAnimationFrame(frame);if(!run)return;
  const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  exploded+=(exTarget-exploded)*Math.min(1,dt*5);
  ORDER.forEach(id=>{G[id].position.y=(OFF[id]||0)*exploded});
  camY+=(camTarget-camY)*Math.min(1,dt*5);hold.position.y=camY;
  if(!reduce&&V.auto)V.az+=dt*.16;
  if(!V.auto&&performance.now()-V.lastTouch>5000&&ptrs.size===0&&V.tgtAz===null)V.auto=true;
  if(V.tgtAz!==null){let d=V.tgtAz-V.az;d=Math.atan2(Math.sin(d),Math.cos(d));V.az+=d*Math.min(1,dt*5);V.po+=(V.tgtPo-V.po)*Math.min(1,dt*5);if(Math.abs(d)<.005&&Math.abs(V.tgtPo-V.po)<.005)V.tgtAz=null}
  V.r+=(V.tgtR*(1+exploded*.5)-V.r)*Math.min(1,dt*6);
  const ty=2.7+exploded*1.9;
  cam.position.set(Math.sin(V.az)*Math.sin(V.po)*V.r,ty+Math.cos(V.po)*V.r,Math.cos(V.az)*Math.sin(V.po)*V.r);cam.lookAt(0,ty,0);
  ledPanel.material.color.set(ledOn?0xa58bff:0x2a2445);ledLight.intensity=ledOn?2.2:0;beam.visible=ledOn;
  if(!reduce){if(fanOn)blades.rotation.x+=dt*14;
   if(flowOn)drops.forEach(d=>{d.userData.t=(d.userData.t+dt*(d.userData.c===sup?.16:.9))%1;d.position.copy(d.userData.c.getPoint(d.userData.t))})}
  drops.forEach(d=>{d.visible=flowOn;if(reduce&&flowOn&&!d.userData.p){d.userData.p=1;d.position.copy(d.userData.c.getPoint(d.userData.t))}});
  bx.setFromObject(G[o.getSel()]);selBox.box.copy(bx);
  if(labOn)ORDER.forEach(id=>{v3.set(...ANCH[id]);v3.y+=(OFF[id]||0)*exploded;v3.project(cam);const l=PARTS[id].lab,hid=v3.z>1;
   l.style.transform='translate('+((v3.x*.5+.5)*size[0]-l.offsetWidth/2).toFixed(1)+'px,'+((-v3.y*.5+.5)*size[1]-l.offsetHeight/2).toFixed(1)+'px)';l.style.visibility=hid?'hidden':'visible'});
  renderer.render(scene,cam)}
 frame();
      return {
        setTab: function (on) { tabOn = on; run = shown && tabOn; if (on) resize(); },
        resize: resize
      };
    }
  };
})();
