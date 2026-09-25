/* ===========================================================================
   Single source of truth for every project on this site.
   The detail cards render from here, so a fact is written once. `link:null`
   means genuinely nothing to link yet — it renders as a disabled "pending"
   state rather than a fabricated URL.
   Order follows the resume exactly: the two live hardware roles, then USF,
   Middleton Robotics and FSAM, then the biomass research, which the resume
   lists under Projects rather than Experience.
   =========================================================================== */
window.PROJECTS = [
  {
    id:'fpga', n:'01', scene:'fpga',
    title:'FPGA CPU &amp; Quantized NN Accelerator',
    tag:'Undergraduate Research Assistant · UF Smart Systems Lab',
    meta:'Dept. of ECE, under PhD student Peter Forcha · August 2026 – present',
    lede:'Designing a CPU in Verilog and SystemVerilog as the RTL foundation for a quantized neural-network inference accelerator.',
    body:'Building the ALU — addition, subtraction, multiplication — and datapath first, using the Vivado and Vitis toolchain, as the base for extending into a quantized neural-network inference accelerator. The target is low-latency, near-sensor inference: moving the compute closer to the data source rather than the data to the compute.',
    tags:['Verilog','SystemVerilog','RTL design','Vivado','Vitis','FPGA/SoC'],
    links:[{label:'Smart Systems Lab', href:'https://faculty.eng.ufl.edu/smartsystems/'},{label:'Related research', href:null}],
    status:'Current'
  },
  {
    id:'pcb', n:'02', scene:'pcbTop',
    title:'SoutheastCon Competition Robot PCB',
    tag:'IEEE Hardware Team · sole electrical/PCB designer',
    meta:'IEEE Student Branch, UF · September 2026 – present',
    lede:'The single custom board that runs every electrical system on an autonomous competition robot.',
    body:'Designing and prototyping on breadboard ahead of PCB fabrication in KiCad — the board’s power distribution and signal architecture supporting the competition’s autonomous navigation, computer vision and movement speed-optimisation subsystems. Sole electrical designer on a ten-person team, owning hardware design and validation end to end while coordinating with the software subteam on integration.',
    tags:['KiCad','PCB design','Power distribution','Signal architecture','Breadboard prototyping'],
    links:[{label:'SoutheastCon', href:'https://ieeesoutheastcon.org/student-competitions/'},{label:'Team repo', href:null}],
    status:'Current'
  },
  {
    id:'envpcb', n:'03', scene:'i2c',
    title:'Autonomous Environmental Monitoring PCB',
    tag:'Head Researcher · USF Bio-Organic Electronics Lab',
    meta:'Dept. of EE, under Dr. Arash Takshi · April 2024 – May 2026',
    lede:'A custom board for continuous real-time monitoring of CO₂, VOCs, temperature and humidity.',
    body:'Designed and fabricated in KiCad with an I²C sensor architecture, unifying communication across a shared 3.3V bus between a BME680 sensor and a Teensy microcontroller, with signal integrity verified by hand. This board is the hardware foundation the hydroponic growth chamber was built on top of.',
    tags:['KiCad','PCB design','I²C','Circuit design','Sensor integration','Signal debugging'],
    links:[{label:'Lab page', href:null}],
    status:'Shipped'
  },
  {
    id:'robotics', n:'04', scene:'robot',
    title:'Middleton Robotics — FRC &amp; VEX',
    tag:'President · 100+ students',
    meta:'Tampa, FL · May 2024 – May 2026',
    lede:'Revived a dormant competitive robotics program, then rebuilt its entire deployment pipeline.',
    body:'Returned the FRC program to competition after years of inactivity, rebuilding the mechanical and electrical pipeline from scratch — Java on RoboRIO, C++ on VEX controllers, Git for version control. The harder problem was never the robot: it was getting a hundred-person team onto real version control and a wireless over-the-air workflow, so a change could be pushed and rolled back between matches without bricking a machine on the field. Two national awards, one World Championship award, and participation expanded 30% across nine teams and 15+ regional competitions.',
    tags:['Java','RoboRIO','C++','VEX','Git','OTA deployment'],
    links:[{label:'middletonrobotics.com', href:'https://www.middletonrobotics.com/'}],
    status:'Leadership'
  },
  {
    id:'fsam', n:'05', scene:'net',
    title:'FSAM — Site &amp; Regional Coordination',
    tag:'Region 4a Coordinator &amp; Webmaster',
    meta:'Tampa, FL · June 2023 – May 2026',
    lede:'Built and ran the organisation’s website and the regional pipeline behind it.',
    body:'Developed and maintained the site on HTML, CSS, JavaScript and Linux-based hosting, cutting manual communication overhead by 60%. Created pathways for 80 Tampa Bay students into HMMT, PUMaC, ARML and CMIMC, raising regional engagement by 50%.',
    tags:['HTML/CSS','JavaScript','Git','Linux hosting'],
    links:[{label:'flsam.org', href:'https://flsam.org/'}],
    status:'Live'
  },
  {
    id:'hydro', n:'06', scene:'hydro',
    title:'Autonomous Hydroponic Growth Chamber',
    tag:'NASA Kennedy Space Center Award',
    meta:'Southeastern Science &amp; Engineering Fair · Independent research',
    lede:'A closed-loop plant growth system built to test whether a crop cycle could survive conditions relevant to spaceflight.',
    body:'Nutrient circulation, relay-switched LED control and structural housing, with the embedded platform chosen by weighted decision matrix. On top of the chamber’s custom I²C sensor PCB, an OpenCV pipeline in Python — HSV conversion, Excess Green Index segmentation, morphological refinement — extracted canopy area across six independent growth trials. A linear regression calibrated against destructive-harvest ground truth turned canopy area into fresh biomass estimates at 6.9% MAPE and R² 0.91, with systematic error analysis isolating leaf overlap and edge-segmentation accuracy as the main sources of variance.',
    tags:['Embedded C','Custom PCB','I²C','Teensy','BME680','Python','OpenCV','Regression'],
    links:[{label:'Writeup', href:null},{label:'Research paper', href:null}],
    status:'Writeup pending'
  }
];
