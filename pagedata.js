/* ===========================================================================
   What each project page says. Every claim here comes from the resume, the
   project's own site or repository, or the row text in projects.js. Where the
   material stops, the page says so rather than fill the gap.
   Block types are rendered by page.js.
   =========================================================================== */
window.PAGES = {

fpga: {
  theme:'fpga', art:'traces',
  title:['A CPU','built for','the <a>accelerator</a>'],
  lede:'The ALU and datapath of a CPU in SystemVerilog, written first so a quantized neural-network accelerator can grow out of it.',
  stats:[{v:3,l:'ALU operations first: add, subtract, multiply'},{v:'Aug 2026',l:'started in the Smart Systems Lab'},{v:'SV',l:'SystemVerilog, in Vivado and Vitis'}],
  status:'In progress',
  blocks:[
    {t:'story', n:'01', h:'What it is',
      lead:'A CPU written in Verilog and SystemVerilog that executes the core ALU operations: addition, subtraction, multiplication.',
      p:['It is part of an FPGA/SoC design project in the Smart Systems Lab at UF, under PhD student Peter Forcha, built in the Vivado and Vitis toolchain.',
         'The ALU and the datapath around it are being written first on purpose. They are the RTL foundation the lab’s next step needs: extending the CPU into a quantized neural-network inference accelerator, following the lab’s published approach to accelerating hybrid quantized neural networks on multi-tenant FPGAs.'],
      aside:{h:'What I own',items:['RTL for the ALU: add, subtract, multiply','The datapath and register file around it','Getting it through the Vivado and Vitis flow']}},
    {t:'fpga', n:'02', h:'The part, and what goes in it',
      lede:'Turn the package to see what the design targets. Then look inside: the CPU block by block, coloured by where the work stands. Choosing a milestone lights its blocks.'},
    {t:'diagram', n:'03', h:'Why the compute moves', id:'nearSensor',
      lede:'The next phase is low-latency, near-sensor inference, building on the lab’s FPGA image-processing accelerator research: move the compute to the data instead of the data to the compute.',
      note:'Illustrative. Distances and speeds are not measurements.'},
    {t:'timeline', n:'04', h:'Where the work stands', cols:4, items:[
      {d:'Milestone 1',h:'ALU',p:'Add, subtract, multiply in SystemVerilog.',s:'now'},
      {d:'Milestone 2',h:'Datapath and register file',p:'Around the ALU, to make it a CPU.',s:''},
      {d:'Next phase',h:'Quantized NN accelerator',p:'Extend the CPU toward inference.',s:''},
      {d:'Target',h:'Near-sensor inference',p:'Low latency, compute beside the data.',s:''}]},
    {t:'facts', n:'05', h:'Details', items:[['Role','Undergraduate Research Assistant'],['Lab','Smart Systems Lab, Dept. of ECE, UF'],['Advisor','PhD student Peter Forcha'],['Since','August 2026'],['Toolchain','Vivado, Vitis'],['Languages','Verilog, SystemVerilog']],
      note:'No simulation or synthesis results are published yet, so none are shown. This page shows the plan and where it stands.'}
  ]
},

pcb: {
  theme:'pcb', art:'routing',
  title:['One board,','every <a>system</a>'],
  lede:'The single custom board that controls every electrical system on the team’s autonomous robot for IEEE SoutheastCon’s Hardware Competition.',
  stats:[{v:1,l:'board for all of the robot’s electrical systems'},{v:10,l:'people on the team; I am the sole electrical designer'},{v:'KiCad',l:'the tool, after breadboard prototyping'}],
  status:'In progress',
  blocks:[
    {t:'story', n:'01', h:'The job',
      lead:'One custom board runs everything electrical on an autonomous competition robot, and I am the only person designing it.',
      p:['The competition requires autonomous navigation, computer vision, and movement speed-optimisation. The board’s power distribution and signal architecture have to support all three.',
         'I own the hardware design and its validation from start to finish, and I coordinate with the software subteam so the board and the code meet cleanly at integration.'],
      aside:{h:'What I own',items:['Power distribution','Signal architecture','Breadboard prototyping, then the KiCad board','Validation, end to end','Integration with the software subteam']}},
    {t:'diagram', n:'02', h:'The system, as the board sees it', id:'robotBoard',
      lede:'Power flows out from one distribution stage to the three subsystems; signals run between the compute the software team owns and everything that senses or moves.',
      note:'Block level, from the design brief. Component values are being settled during breadboarding, so none are shown.'},
    {t:'timeline', n:'03', h:'From breadboard to board', cols:5, items:[
      {d:'Now',h:'Breadboard prototype',p:'Prove the power and signal design before committing to a board.',s:'now'},
      {d:'Next',h:'Schematic and layout',p:'In KiCad, from what the prototype proved.',s:''},
      {d:'Then',h:'Fabrication',p:'The single custom PCB.',s:''},
      {d:'Then',h:'Bring-up and validation',p:'Owned end to end.',s:''},
      {d:'Then',h:'Integration',p:'With the software subteam’s stack.',s:''}],
      note:'The prototype-then-fabricate order is the plan; only the breadboard stage is under way.'},
    {t:'facts', n:'04', h:'Details', items:[['Role','Hardware Team Member; sole electrical and PCB designer'],['Team','IEEE Student Branch, University of Florida, ten people'],['Since','September 2026'],['Competition','IEEE SoutheastCon Hardware Competition'],['Tools','KiCad, breadboard prototyping']]}
  ]
},

envpcb: {
  theme:'env', art:'waves',
  title:['A board that','watches the <a>air</a>'],
  lede:'A custom PCB that logs CO₂, VOCs, temperature and humidity around the clock, and became the foundation the hydroponic chamber was built on.',
  stats:[{v:4,l:'channels logged: temperature, humidity, eCO₂, VOC'},{v:'3.3 V',l:'one shared I²C bus, verified by hand'},{v:'2 yr',l:'April 2024 to May 2026'}],
  status:'Shipped',
  blocks:[
    {t:'story', n:'01', h:'What it does',
      lead:'A Teensy 4 and a BME680 sensor share one I²C bus at 3.3 V, and the board turns that into continuous real-time monitoring.',
      p:['I designed and fabricated the board in KiCad as Head Researcher in the Bio-Organic Electronics Lab at USF, working under Dr. Arash Takshi. I checked signal integrity on the shared bus by hand with a multimeter.',
         'This board is the hardware foundation the hydroponic growth chamber was built on top of.'],
      aside:{h:'What I owned',items:['The schematic and layout, in KiCad','Fabrication','The I²C sensor architecture on a shared 3.3 V bus','Signal debugging']}},
    {t:'explorer', n:'02', h:'The board, wire by wire', mount:'envMount'},
    {t:'facts', n:'03', h:'Details', items:[['Role','Head Researcher'],['Lab','Bio-Organic Electronics Lab, Dept. of EE, USF'],['Advisor','Dr. Arash Takshi'],['When','April 2024 to May 2026'],['Parts','Teensy 4, BME680'],['Bus','I²C, 3.3 V, SDA pin 18, SCL pin 19']],
      note:'The 72-hour curves are drawn to the recorded ranges; they are not a raw export.',
      link:{label:'See what was built on this board',href:'hydroponic-chamber.html',pa:'#8EE36B',dest:'06 · Hydroponic growth chamber'}}
  ]
},

robotics: {
  theme:'robotics', art:'gears',
  title:['From 20 members','to the <a>World</a> Championship'],
  lede:'I took Middleton Robotics from a quiet program of about 20 to 100+ members and nine teams across three competitions, and led it to the World Championship.',
  stats:[{v:'100+',l:'members, up from 20 when I started'},{v:9,l:'teams I led: four FTC, four VEX and one FRC'},{v:'Worlds',l:'where we won the Rising All-Star Award'}],
  status:'Leadership',
  blocks:[
    {t:'story', n:'01', h:'Leading it back',
      lead:'I took a quiet program and led it to the World Championship. The growth was the real work: more people, more teams, and a program that held together as it scaled.',
      p:['We went to the World Championship while I was president-elect. When I became president I took the team to three regionals and grew membership from about 20 to more than 100.',
         'We competed at nationals, and at the World Championship we won the Rising All-Star Award. That award is what put the team on the map.',
         'Over four seasons I led the building of robots for nine teams at once: four FTC, four VEX and one FRC, the team we took to Worlds.'],
      chips:['President','Nine teams','FRC, FTC and VEX','Regionals and nationals','World Championship'],
      aside:{h:'What I led',items:['Nine teams across three competitions','Growth from 20 members to 100+','Regional and national competition','The trip to the World Championship']}},
    {t:'diagram', n:'02', h:'Nine teams, three competitions', id:'teams',
      lede:'Four FTC teams, four VEX teams and one FRC team. The FRC team is the one we took to the World Championship.',
      note:'Team counts are from the program. One square is one team.'},
    {t:'numbers', n:'03', h:'The scale of it', cols:4, items:[{v:20,l:'members when I started'},{v:100,s:'+',l:'members at the end'},{v:9,l:'teams across FTC, VEX and FRC'},{v:3,l:'regionals while I was president'}]},
    {t:'timeline', n:'04', h:'How it grew', cols:4, items:[
      {d:'The start',h:'A quiet program',p:'About 20 members and no momentum.',s:''},
      {d:'President-elect',h:'The World Championship',p:'The FRC team went to Worlds.',s:''},
      {d:'President',h:'Three regionals, 100+ members',p:'Nine teams across FTC, VEX and FRC.',s:''},
      {d:'Nationals and Worlds',h:'Rising All-Star Award',p:'Won at the World Championship, and it put the team on the map.',s:'done'}]},
    {t:'diagram', n:'05', h:'Keeping nine teams shipping', id:'deploy',
      lede:'With that many teams, everyone had to work the same way: Java on the RoboRIO, C++ on VEX controllers, Git, and a wireless push that could be rolled back between matches.',
      note:'The workflow as designed and used by the team; a schematic, not a screenshot of the tools.'},
    {t:'facts', n:'06', h:'Details', items:[['Role','President (after serving as president-elect)'],['Where','Middleton, Tampa, FL'],['When','May 2024 to May 2026'],['Teams','Four FTC, four VEX, one FRC'],['Seasons','Four'],['Award','Rising All-Star Award, World Championship']],
      links:[{label:'middletonrobotics.com',href:'https://www.middletonrobotics.com/',ext:true}]}
  ]
},

flsam: {
  theme:'flsam', art:'math',
  title:['The site, and','the road to <a>the</a>','hardest contests'],
  lede:'I built and ran the Florida Student Association of Mathematics’ website and the regional pipeline behind it, as Region 4a Coordinator and Webmaster.',
  stats:[{v:'60%',l:'less manual communication overhead'},{v:80,l:'Tampa Bay students given pathways into elite contests'},{v:'50%',l:'higher regional engagement'}],
  status:'Live',
  blocks:[
    {t:'story', n:'01', h:'What I built',
      lead:'A website that took the manual work out of running a region, and a way for Tampa Bay students to reach contests they would not have found.',
      p:['I developed and maintained the site in HTML, CSS and JavaScript, on Linux-based hosting with Git, and that cut manual communication overhead by 60%.',
         'I created pathways for 80 Tampa Bay students into HMMT, PUMaC, ARML and CMIMC, which raised regional engagement by 50%.'],
      aside:{h:'The stack',items:['HTML, CSS, JavaScript','Git','Linux-based hosting']}},
    {t:'diagram', n:'02', h:'From the region to the contests', id:'pathway',
      lede:'One site and one regional coordinator in the middle, and 80 students on their way to four contests.',
      note:'A schematic of the pathway. It does not show how many students went to each contest.'},
    {t:'numbers', n:'03', h:'The numbers', cols:3, items:[{v:60,s:'%',l:'less manual communication overhead'},{v:80,l:'students given pathways'},{v:50,s:'%',l:'boost in regional engagement'}]},
    {t:'facts', n:'04', h:'Details', items:[['Role','Region 4a Coordinator and Webmaster'],['Organisation','Florida Student Association of Mathematics'],['When','June 2023 to May 2026'],['Where','Tampa, FL'],['Contests','HMMT, PUMaC, ARML, CMIMC']],
      links:[{label:'flsam.org',href:'https://flsam.org/',ext:true},{label:'Site code (flsamnewsite)',href:'https://github.com/shividoge/flsamnewsite',ext:true}]}
  ]
},

hydro: {
  theme:'hydro', art:'growth',
  title:['A piece of','space that','<a>weighs</a> its plant'],
  lede:'A closed-loop hydroponic chamber built to test whether a crop cycle could survive conditions relevant to spaceflight, with a camera that estimates the plant’s mass without touching it.',
  stats:[{v:'6.9%',l:'mean error estimating fresh biomass from video'},{v:6,l:'independent growth trials'},{v:'NASA',l:'Kennedy Space Center Award, Southeastern Science and Engineering Fair'}],
  status:'Shipped',
  blocks:[
    {t:'story', n:'01', h:'The idea',
      lead:'A chamber that senses its own climate, circulates its own nutrients, and weighs its plant by looking at it.',
      p:['I built the closed loop: nutrient circulation, relay-switched LED control, and the structural housing. It cut the manual harvests needed to zero. The embedded platform was chosen by a weighted decision matrix across a Teensy, an ESP32 and an Arduino Uno.',
         'On top of the chamber’s custom I²C sensor PCB, an OpenCV pipeline in Python (HSV conversion, Excess Green Index segmentation, morphological refinement) extracted canopy area across six independent growth trials. A linear regression calibrated against destructive-harvest ground truth turned canopy area into fresh biomass at 6.9% MAPE.',
         'Systematic error analysis isolated leaf overlap and edge-segmentation accuracy as the main sources of variance. I presented it at the Southeastern Science and Engineering Fair and earned a NASA Kennedy Space Center Award for its spaceflight-viability implications.'],
      aside:{h:'What I built',items:['The chamber: nutrients, lighting, housing','The controller and its decision matrix','The sensor PCB it runs on','The vision pipeline and the regression']}},
    {t:'diagram', n:'02', h:'Two loops, one chamber', id:'loops',
      lede:'One loop keeps the climate: sensors, controller, relays. The other measures growth: camera, vision pipeline, regression.',
      note:'A schematic of the design described above.'},
    {t:'explorer', n:'03', h:'The full system, four ways', mount:'hydroMount', wide:true,
      lede:'The chamber in 3D, the vision pipeline running live in your browser, the results against the targets, and the decisions behind the parts. This is the project’s own site, brought into the page.'},
    {t:'facts', n:'04', h:'Details', items:[['Where','Independent research, USF'],['Recognition','NASA Kennedy Space Center Award'],['Fair','Southeastern Science and Engineering Fair'],['Stack','Embedded C, Teensy, BME680, Python, OpenCV, regression'],['Board','The environmental monitoring PCB']],
      links:[{label:'Interactive project site',href:'https://shividoge.github.io/hydroponics-growth-system/',ext:true},{label:'Biomass web app (code)',href:'https://github.com/shividoge/plant_growth_webapp_v2',ext:true},{label:'Research paper — pending',href:null}],
      link:{label:'The sensor board it runs on',href:'environmental-pcb.html',pa:'#5FD6D0',dest:'03 · Environmental monitoring PCB'}}
  ]
},
glasses: {
  theme:'glasses', art:'optics',
  title:['AR glasses','for under <a>$150</a>'],
  lede:'A 3D-printed, AI-capable pair of smart glasses: 87 g, an answer on the lens in about 1.3 seconds, and about $83 in parts.',
  stats:[{v:'87 g',l:'on your face, 42% under our own 150 g cap'},{v:'$83',l:'in parts per pair, against a $149 shelf price'},{v:'1.3 s',l:'from a spoken question to an answer on the lens'}],
  status:'Prototype',
  blocks:[
    {t:'story', n:'01', h:'What we built',
      lead:'We replaced the waveguide, the part that pushes most AR glasses past $500, with a small OLED and a mirror.',
      p:['S\u00b3 is a 3D-printed, AI-capable smart-glasses prototype. It hears a spoken question, turns it into text on its own chip, and passes it to a companion phone app over a hotspot. The phone asks Gemini, and the answer comes back and is drawn on the OLED in front of your eye.',
         'I was the business lead on a team of three. The design, the build and the testing are the whole team\u2019s, and the page below has all of it: the 3D model, the commercial, the price case, the build story, the bill of materials, the test results and the limits.'],
      chips:['Team of three','ESP32','OLED + mirror','3D-printed PETG','Gemini via phone'],
      aside:{h:'The team',items:['Shivin Anand: business','Siddharth Mohan: engineering','Srijan Kumbam: software']}},
    {t:'diagram', n:'02', h:'From a question to the lens', id:'glassesFlow',
      lede:'The glasses do the listening and the drawing. The phone does the thinking, over a hotspot.',
      note:'The path as the team designed it. The round trip averaged 1,315 ms over five measured trials.'},
    {t:'facts', n:'10', h:'Details', late:true, items:[
      ['Role','Business lead, on a team of three'],
      ['Team','Shivin Anand (business), Siddharth Mohan (engineering), Srijan Kumbam (software)'],
      ['Built with','ESP32, a small OLED, a 3D-printed PETG frame, and Gemini through a companion phone app'],
      ['The price trick','An OLED and a mirror in place of a waveguide'],
      ['Result','Four clean passes, one partial and one miss against requirements we set before testing']],
      note:'The numbers, the 3D model and the simulated demo come from the team\u2019s design presentation. The demo answers are canned examples and are labelled simulated.',
      links:[{label:'Watch the commercial',href:'https://www.youtube.com/watch?v=080NjfXfDpc',ext:true}]}
  ]
}
};
