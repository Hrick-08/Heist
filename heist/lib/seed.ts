import "server-only";

import { hashPassword, verifyPassword } from "./auth";
import { adminsCol, tasksCol, missionsCol, stateCol as stateColRef } from "./collections";
import { DEFAULT_STATE, ensureAdmin } from "./game";
import type { Task, TaskType } from "./types";

type SeedTask = [
  title: string,
  description: string,
  type: TaskType,
  round: number,
  points: number,
  money: number,
  hint: string,
  hintCost: number,
];

const PHYSICAL: SeedTask[] = [
  ["Vault Recon", "Sketch the layout of the event hall from memory and hand it to the control desk.", "physical", 1, 100, 500, "Start from the stage and walk clockwise, marking every exit.", 400],
  ["Crew Roll Call", "Get every member of your crew physically verified by the admin desk.", "physical", 1, 80, 300, "Bring ID for all members and the leader's team badge.", 250],
  ["Getaway Vehicle", "Confirm your getaway vehicle and parking slot with the logistics desk.", "physical", 1, 120, 600, "Slot B7 is always busy — ask for the overflow lot.", 450],
  ["Inside Man", "Get the name badge of an event volunteer. No stealing.", "physical", 1, 150, 900, "Volunteers wear teal lanyards and smell of coffee.", 600],
  ["Laser Grid Bypass", "Solve the laser-grid puzzle at the info desk to clear the corridor.", "physical", 2, 180, 900, "The pattern is mirrored — read it right to left.", 700],
  ["Fence the Loot", "Describe the loot to the fence and collect a valuation slip.", "physical", 2, 200, 1200, "Overvalue the gems; the fence pays for confidence.", 800],
  ["Fake IDs", "Get every member's forged ID stamped at the forge booth.", "physical", 2, 160, 800, "Bring your own blank cards, the booth only stamps.", 600],
  ["Distraction", "Set off the smoke alarm and slip away completely unnoticed.", "physical", 2, 220, 1500, "Nobody looks at the ceiling during the drill.", 900],
  ["Camera Loop", "Loop the CCTV feed for ten full minutes.", "physical", 3, 250, 1500, "The maintenance terminal accepts the default password.", 1000],
  ["The Pickpocket", "Lift the mayor's wallet without being caught on camera.", "physical", 3, 300, 2000, "He always stops at the lemonade stand. Every time.", 1200],
  ["Secret Passage", "Find the service tunnel behind the stage.", "physical", 3, 220, 1200, "Push the third crate from the left and pull.", 850],
  ["Hot Wire", "Hot wire the security van parked at the east gate.", "physical", 3, 280, 1800, "Three brown wires and one red. Never the red.", 1100],
  ["Vault Code", "Memorise the six digit vault code chalked inside the washroom.", "physical", 4, 350, 2500, "It is not a date. It is a price.", 1300],
  ["Getaway Crew Check", "Final crew check before the sprint — every member accounted for.", "physical", 4, 300, 2000, "Count heads twice. Trust nobody.", 1100],
  ["Escape Rehearsal", "Run the escape route in under three minutes and time it.", "physical", 4, 320, 2200, "The fire stairs on level 2 are faster than the lifts.", 1200],
];

const TECHNICAL: SeedTask[] = [
  // Round 1
  ["Crack the Padlock", "Open the padlocked supply crate on the loading bay.", "technical", 1, 140, 700, "Four pins, all raked at once.", 350],
  ["Decode the Ledger", "Rebuild the shredded ledger from the shredded strips.", "technical", 1, 150, 800, "Strip order matches the stack order in the crate.", 400],
  ["Dead Drop", "Locate the dead drop hidden under the courtyard fountain.", "technical", 1, 130, 600, "Count the tiles from the lion statue.", 300],
  ["Bypass the Terminal", "Get past the proxy login on the lobby terminal.", "technical", 1, 170, 900, "The guest account password is on the desk sign.", 450],
  ["Reconstruct the Photo", "Piece together the shredded surveillance photo.", "technical", 1, 140, 700, "The torn edge matches the corner of the frame.", 350],
  ["Morse Distress", "Decode the Morse code distress call playing on the PA.", "technical", 1, 160, 850, "Repeat the pattern: dash dot dot dash.", 400],
  ["Chess Mural", "Find the key hidden in the chess mural in the lounge.", "technical", 1, 120, 550, "Look at the black knight, not the white one.", 300],
  ["FIFO Riddle", "Solve the FIFO stack riddle on the arcade cabinet.", "technical", 1, 180, 950, "It is a queue, not a stack. First in, first out.", 450],
  ["Python Cell", "Escape the python escape room on level 1.", "technical", 1, 190, 1000, "The password is in the shebang line of the script.", 500],
  ["Fake DNS", "Trace the fake DNS entry pointing at the safehouse.", "technical", 1, 200, 1100, "Compare the TTL values — the fake one is shorter.", 500],
  ["Cipher Wheel", "Solve the cipher wheel printed on the crate lid.", "technical", 1, 150, 800, "The outer ring does not move.", 400],
  ["Null Byte", "Find the null byte hiding in the server log.", "technical", 1, 210, 1200, "It is right before the request you care about.", 550],
  ["Biometric Scan", "Bypass the biometric scanner at the staff door.", "technical", 1, 220, 1250, "Play the recorded cough from the lobby speakers.", 600],
  ["Sudoku of Fate", "Solve the sudoku-of-fate on the back of the schedule.", "technical", 1, 130, 600, "Diagonals matter here.", 300],
  ["Microchip", "Find the microchip inside the marble statue.", "technical", 1, 230, 1300, "It is taped under the left hand.", 600],
  ["Base64 Payload", "Decrypt the base64 payload posted on the notice board.", "technical", 1, 160, 850, "Decode twice, not once.", 400],
  ["Bank App Exploit", "Find the exploit in the fake banking app.", "technical", 1, 240, 1400, "The rounding is off by one cent.", 650],
  ["Poisoned Route", "Identify which of the four escape routes is poisoned.", "technical", 1, 170, 900, "One route was repaved last month.", 450],
  ["Cube of the Vault", "Solve the Rubik's cube of the vault dial.", "technical", 1, 250, 1500, "The centre pieces never move.", 700],
  ["IP Trail", "Trace the IP trail back to the safehouse.", "technical", 1, 260, 1600, "Follow the hop with the slowest response.", 700],
  ["Caesar Flyer", "Break the Caesar cipher on the flyer by the stairs.", "technical", 1, 110, 500, "Shift until it says HEIST.", 300],
  ["Null Route", "Find the null route hiding in the router config.", "technical", 1, 270, 1700, "Compare against the other three configs.", 700],
  ["Jigsaw Map", "Assemble the jigsaw map of the vault floor.", "technical", 1, 120, 550, "The corners are colour coded.", 300],
  ["Elevator Firmware", "Reverse the elevator firmware that stops on floor 4.", "technical", 1, 280, 1800, "The checksum is wrong by design.", 750],
  ["Pipe Pressure", "Patch the leaky pipe pressure code on the boiler panel.", "technical", 1, 140, 700, "Pressure must read exactly 4.2.", 350],
  ["Cheat Sheet", "Find the cheat sheet hidden under the registration table.", "technical", 1, 150, 800, "The table leg nearest the power socket.", 400],
  ["GPS Triangulation", "Solve the GPS triangulation riddle on the roof access card.", "technical", 1, 290, 1900, "The three bearings are 90 degrees apart.", 750],
  ["JWT Jar", "Break the JWT token hidden in the jar of tokens.", "technical", 1, 300, 2000, "The signature is base64url, not base64.", 800],
  ["Floor Tiles", "Find the sequence hidden in the floor tiles.", "technical", 1, 130, 600, "Count from the fountain, not the door.", 300],
  ["Tampered Receipt", "Identify the tampered receipt in the stack.", "technical", 1, 160, 850, "One total is a round number.", 400],
  ["Whiteboard Maths", "Solve the maths left on the whiteboard.", "technical", 1, 170, 900, "There is a missing bracket.", 450],
  ["Rogue SSID", "Find the rogue SSID broadcasting from the venue.", "technical", 1, 310, 2100, "It is hidden but not secure.", 800],
  ["Hexagon Poster", "Decode the hexagon poster on the pillar.", "technical", 1, 140, 700, "Read it in a circle, not a line.", 350],
  ["Manifest Mismatch", "Trace the supply manifest mismatch in the ledger.", "technical", 1, 320, 2200, "The weights do not add up on crate 7.", 850],
  ["Tyre Tracks", "Solve the tyre-track riddle in the parking bay.", "technical", 1, 150, 800, "Count the turns, not the tracks.", 400],
  ["Debug Account", "Exploit the forgotten debug account on the portal.", "technical", 1, 330, 2300, "The username is on the login screen footer.", 850],
  ["Vinyl Groove", "Decode the message hidden in the vinyl record groove.", "technical", 1, 160, 850, "Play it from the outside in.", 400],
  ["Ledger Error", "Find the deliberate error in the ledger totals.", "technical", 1, 340, 2400, "Compare the two ledger halves.", 900],
  ["Parking Spiral", "Solve the parking spiral taped on the floor.", "technical", 1, 170, 900, "Every turn is 90 degrees.", 450],
  ["Insider Chat", "Identify the insider in the crew group chat.", "technical", 1, 350, 2500, "One member never replies in the same minute.", 900],
  // Round 2
  ["Second Vault", "Bypass the second vault on the mezzanine.", "technical", 2, 350, 2200, "The second vault shares the first key pattern.", 1000],
  ["Binary Floorplan", "Decode the binary floorplan of the service wing.", "technical", 2, 360, 2300, "1 means wall, 0 means floor. Start bottom-left.", 1000],
  ["Backup Drive", "Crack the encrypted backup drive in the office.", "technical", 2, 370, 2400, "The password is the day of the heist.", 1050],
  ["Config Password", "Find the admin password left in the config file.", "technical", 2, 380, 2500, "It is in a comment.", 1050],
  ["Pressure Alarm", "Defuse the pressure plate alarm in the corridor.", "technical", 2, 390, 2600, "It measures grams, not kilos.", 1100],
  ["Counterfeit Bonds", "Swap the counterfeit bonds in the briefcase.", "technical", 2, 400, 2700, "The real ones are numbered.", 1100],
  ["Onion Route", "Solve the onion-route puzzle in the server room.", "technical", 2, 410, 2800, "Three layers, read the outermost last.", 1150],
  ["Shipment Manifest", "Find the poison listed in the shipment manifest.", "technical", 2, 420, 2900, "One batch code repeats.", 1150],
  ["Biometric Vault", "Bypass the biometric lock on the vault door.", "technical", 2, 430, 3000, "The eye print is stored in plain text.", 1200],
  ["Plate Riddle", "Decode the license plate riddle on the exit ramp.", "technical", 2, 440, 3100, "It describes the make and the year.", 1200],
  ["Traffic Grid", "Hack the traffic grid to clear the escape route.", "technical", 2, 450, 3200, "Cycle the lights early.", 1250],
  ["Ghost Employee", "Find the ghost employee hiding in payroll.", "technical", 2, 460, 3300, "They are paid but never clock in.", 1250],
  ["Multi-Key Cipher", "Solve the multi-key cipher on the safe dial card.", "technical", 2, 470, 3400, "Three keys, one message.", 1300],
  ["Cold Storage", "Crack the cold-storage lock in the basement.", "technical", 2, 480, 3500, "The cold slows the tumbler. Use it.", 1300],
  ["Drone Telemetry", "Spoof the drone telemetry feed over the hall.", "technical", 2, 490, 3600, "Change the aircraft id, not the position.", 1350],
  ["Timeline Trigger", "Find the trigger hidden in the event timeline.", "technical", 2, 500, 3700, "It fires at 22:00 exactly.", 1400],
  ["Homing Beacon", "Solve the homing beacon puzzle on the rooftop.", "technical", 2, 510, 3800, "The signal points at the roof, not the vault.", 1400],
  ["Port Scanner", "Exploit the output of the port scanner in the IT room.", "technical", 2, 520, 3900, "One port should not be open.", 1450],
  ["Radio Intercept", "Decode the police radio intercept on channel 9.", "technical", 2, 530, 4000, "The call sign is a word, not a number.", 1450],
  ["Mole in the Logs", "Find the mole hiding in the chat logs.", "technical", 2, 540, 4100, "They always reply last.", 1500],
  // Round 3
  ["Master Safe Dial", "Crack the master safe dial behind the painting.", "technical", 3, 600, 4500, "The dial stops short at the 7.", 2000],
  ["Anti-Tamper Mesh", "Bypass the anti-tamper mesh on the vault.", "technical", 3, 620, 4600, "Power the sensors down first.", 2000],
  ["Dynamic Key Rotation", "Solve the dynamic key rotation lock.", "technical", 3, 640, 4700, "The key changes every 30 seconds.", 2050],
  ["Keycard Log", "Steal the insider keycard log from the door controller.", "technical", 3, 660, 4800, "The log is in the last 24 entries.", 2100],
  ["Biometric Lock", "Escape the biometric lock puzzle on the vault.", "technical", 3, 680, 4900, "Match the print, not the finger.", 2150],
  ["Neural Handshake", "Solve the neural handshake puzzle.", "technical", 3, 700, 5000, "It is a visual puzzle wearing a fake moustache.", 2200],
  ["Corrupted Sector", "Find the corrupted sector of the drive.", "technical", 3, 720, 5100, "Checksum every block.", 2250],
  ["EMP Tripwire", "Defuse the EMP tripwire across the doorway.", "technical", 3, 740, 5200, "The wire is live for 4 seconds at a time.", 2300],
  ["Quantum Lock", "Crack the quantum-locked case on the desk.", "technical", 3, 760, 5300, "It is not actually quantum.", 2350],
  ["Location Cipher", "Solve the final location cipher on the map fragment.", "technical", 3, 780, 5400, "It is a playfair square.", 2400],
  ["Convoy Route", "Steal the convoy route file from the dispatch box.", "technical", 3, 800, 5500, "The dispatch box opens to the code 1-9-2-4.", 2450],
  ["Founder's Vault", "Crack the founder's vault in the private suite.", "technical", 3, 850, 6000, "It opens to the date the society was founded.", 2500],
  // Round 4
  ["The Last Cipher", "Break the final cipher written in the vault dust.", "technical", 4, 1000, 8000, "Read only the capitals.", 3500],
  ["The Ghost Route", "Find the ghost route that leaves no prints.", "technical", 4, 1050, 8500, "It is on the maintenance map.", 3500],
  ["The Silent Alarm", "Silence the alarm without touching the panel.", "technical", 4, 1100, 9000, "The panel is a decoy.", 3600],
  ["The Vanishing Hour", "Plan the vanishing hour out of the CCTV timeline.", "technical", 4, 1150, 9500, "Both cameras reset at the same minute.", 3600],
  ["The Split Second", "Win the split second between the two guards.", "technical", 4, 1200, 10000, "Count their patrol, not yours.", 3700],
  ["The Dead Man's Switch", "Neutralise the dead man's switch under the table.", "technical", 4, 1250, 10500, "Press the button it wants pressed.", 3800],
  ["The Inside Man", "Turn the inside man before the deal closes.", "technical", 4, 1300, 11000, "He is waiting by the east exit.", 3900],
  ["The Final Score", "Settle the final score without a witness.", "technical", 4, 1400, 12000, "The score is on the back of the ticket.", 4000],
];

const ENDGAME: SeedTask[] = [
  ["The Payday", "Escape with the cash. All of it.", "technical", 4, 2500, 20000, "The bag was swapped an hour ago.", 5000],
  ["The Getaway", "Make the getaway with the crew intact.", "technical", 4, 2500, 20000, "Leave the second car behind.", 5000],
  ["The Double Cross", "Flip the buyer and walk away clean.", "technical", 4, 2500, 20000, "They were planning to double you.", 5000],
  ["The Clean Getaway", "Leave no trail at all.", "technical", 4, 2500, 20000, "Burn the ledger, not the map.", 5000],
];

const MISSIONS: {
  title: string;
  description: string;
  round: number;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  money: number;
}[] = [
  {
    title: "Dexter Spotted: The Informant",
    description:
      "One of your crew spotted an informant talking to a badge. Corner the informant before the info spreads.",
    round: 1,
    difficulty: "easy",
    points: 200,
    money: 1500,
  },
  {
    title: "Dexter Spotted: The Forger",
    description:
      "A master forger is loose in the venue. Track the forged handwriting and make them an offer.",
    round: 1,
    difficulty: "easy",
    points: 250,
    money: 2000,
  },
  {
    title: "Dexter Spotted: The Snitch",
    description:
      "Somebody on the guest list is feeding the police. Find them and they find a car that does not start.",
    round: 2,
    difficulty: "medium",
    points: 300,
    money: 2500,
  },
  {
    title: "Dexter Spotted: The Insider",
    description:
      "There is a leak in the plan. Only one crew member knew the vault code. Make the leak disappear.",
    round: 2,
    difficulty: "medium",
    points: 350,
    money: 3000,
  },
  {
    title: "Dexter Spotted: The Mole",
    description:
      "The mole is closer than you think. Tail them through the service corridors and cut them off.",
    round: 3,
    difficulty: "hard",
    points: 400,
    money: 3500,
  },
  {
    title: "Dexter Spotted: The Ghost",
    description:
      "A ghost from a past job has resurfaced tonight. Settle the old score before it settles yours.",
    round: 4,
    difficulty: "hard",
    points: 500,
    money: 4500,
  },
];

function toTask(seed: SeedTask, isEndgame = false): Task {
  const now = new Date();
  return {
    title: seed[0],
    description: seed[1],
    type: seed[2],
    round: seed[3],
    points: seed[4],
    money: seed[5],
    hint: seed[6],
    hintCost: seed[7],
    isEndgame,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

export async function seedTaskPool(): Promise<{ tasks: number; missions: number }> {
  const tasks = await tasksCol();
  const missions = await missionsCol();

  let taskCount = 0;
  const existing = await tasks.countDocuments({});
  if (existing === 0) {
    const docs: Task[] = [
      ...PHYSICAL.map((t) => toTask(t)),
      ...TECHNICAL.map((t) => toTask(t)),
      ...ENDGAME.map((t) => toTask(t, true)),
    ];
    await tasks.insertMany(docs);
    taskCount = docs.length;
  }

  let missionCount = 0;
  const existingMissions = await missions.countDocuments({});
  if (existingMissions === 0) {
    const now = new Date();
    await missions.insertMany(
      MISSIONS.map((m) => ({
        ...m,
        scope: "all" as const,
        teamIds: [] as string[],
        active: true,
        completions: 0,
        createdAt: now,
        updatedAt: now,
      })),
    );
    missionCount = MISSIONS.length;
  }

  return { tasks: taskCount, missions: missionCount };
}

/**
 * Keeps the control-room account in step with ADMIN_USERNAME / ADMIN_PASSWORD:
 * it is created if missing, and its passcode follows the env value, so changing
 * the variable and redeploying is how the passcode is changed. There is no
 * built-in default login.
 */
export async function bootstrapAdmin(): Promise<void> {
  const col = await adminsCol();
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password.length < 12) {
    if ((await col.estimatedDocumentCount()) > 0) return;
    // No operator exists and none can be created: refuse loudly instead of running open or with a default.
    throw new Error(
      "No control-room account exists. Set ADMIN_USERNAME and ADMIN_PASSWORD (12+ characters) and redeploy.",
    );
  }
  const existing = await col.findOne({ username });
  if (!existing) {
    await ensureAdmin(username, password, "Event Control");
    return;
  }
  if (!(await verifyPassword(password, existing.passwordHash))) {
    await col.updateOne({ username }, { $set: { passwordHash: await hashPassword(password) } });
  }
}

export async function seedEverything(): Promise<{
  tasks: number;
  missions: number;
}> {
  const stateCol = await stateColRef();
  await stateCol.updateOne(
    { _id: "state" },
    { $setOnInsert: { ...DEFAULT_STATE, _id: "state", updatedAt: new Date() } },
    { upsert: true },
  );
  await bootstrapAdmin();
  return seedTaskPool();
}
