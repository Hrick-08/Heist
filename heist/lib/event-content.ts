/**
 * Everything the public site says about the event lives here, so a change of
 * plan is a one-file edit. It comes from the GDG planning brief. Anything the
 * brief marks as undecided is written as such (see `TBA`).
 */
export const TBA = "To be announced";

export const EVENT = {
  name: "Cash, Chaos & Code",
  tagline: "The Ultimate Heist",
  host: "GDG Chitkara",
  /** Fill these in when they are fixed. Until then the page says "To be announced". */
  date: "25-Nov-2026 (9:00 AM)",
  venue: "Einstein Hall, Galileo Block",
  crews: 40,
  crewSize: "4–5",
  endsBy: "4:00 PM",
  topFinalists: 5,
  lede:
    "Campus turns into a GTA-style game world for one day. Form a crew of 4–5, run missions across campus, " +
    "earn points and cash, dodge the Police, and fight your way into the Big Heist.",
};

export const FACTS: { label: string; value: string; note: string }[] = [
  { label: "Date", value: EVENT.date ?? TBA, note: "We will announce it here and by email" },
  { label: "Venue", value: EVENT.venue ?? TBA, note: "On campus, in approved event zones" },
  { label: "Crew size", value: `${EVENT.crewSize} people`, note: "One crew ID all day" },
  { label: "Crews", value: String(EVENT.crews), note: "Selected from the sign-ups" },
  { label: "Format", value: "Short missions", note: "Puzzles, tech, creative and physical" },
  { label: "Wraps up", value: EVENT.endsBy, note: "Prizes and photos included" },
];

/** Before the day. */
export const GETTING_IN: { title: string; body: string }[] = [
  {
    title: "Register your crew",
    body: "The leader fills one form: leader plus three crew mates (a fourth is optional), college emails and one team photo.",
  },
  {
    title: "We pick the crews",
    body: `Only ${EVENT.crews} crews get in. Selected leaders get an email with a Team ID like TLH-07 and a passcode.`,
  },
  {
    title: "Show up and play",
    body: "On the day the leader signs in with that Team ID and passcode to follow tasks, scores and wanted status.",
  },
];

/** The event's workflow, in order. */
export const STAGES: { title: string; body: string }[] = [
  {
    title: "Registration & briefing",
    body: "Crews check in, get their crew ID and hear the story, the schedule and the rules.",
  },
  {
    title: "Mission rounds",
    body: "Every crew attempts the same set of missions at different stations around campus.",
  },
  {
    title: "Police & Dexter",
    body: "Police mark the top crews as wanted. Dexter, the mission broker, offers special missions and a way to clear your name.",
  },
  {
    title: "Score updates",
    body: "Scores and wanted status refresh after every round, so the leaderboard always tells the story.",
  },
  {
    title: "The Big Heist",
    body: `The top ${EVENT.topFinalists} crews take on the final challenge. Everyone else watches.`,
  },
  {
    title: "Awards & closing",
    body: `Scores are confirmed, winners are announced and the day wraps up by ${EVENT.endsBy}.`,
  },
];

export const TIMELINE: { time: string; what: string; kind?: "round" | "break" | "heist" }[] = [
  { time: "9:00 – 9:30 AM", what: "Registration, crew IDs and team check-in" },
  { time: "9:30 – 10:00 AM", what: "Opening story, briefing and rules" },
  { time: "10:00 – 11:30 AM", what: "Mission Round 1: starter missions", kind: "round" },
  { time: "11:30 – 11:45 AM", what: "Score update, Police targets announced, reset" },
  { time: "11:45 AM – 12:45 PM", what: "Mission Round 2: main missions", kind: "round" },
  { time: "12:45 – 1:15 PM", what: "Lunch break", kind: "break" },
  { time: "1:15 – 2:15 PM", what: "Mission Round 3: final regular missions and bonus tasks", kind: "round" },
  { time: "2:15 – 2:30 PM", what: "Leaderboard check and the top 5 announced" },
  { time: "2:30 – 3:00 PM", what: "The Big Heist: the final challenge", kind: "heist" },
  { time: "3:00 – 3:30 PM", what: "Final score check, prizes, photos and goodbyes" },
];

/**
 * The categories are decided. The missions inside them are not, so each card
 * says what it could look like and the page says the real list is secret until the day.
 */
export const CHALLENGES: { name: string; blurb: string; styles: string[] }[] = [
  {
    name: "Tech & logic",
    blurb: "Quick brain work, no laptop wizardry needed.",
    styles: ["Decode a message", "Simple cybersecurity puzzle", "Spot the bug", "AI or logic challenge"],
  },
  {
    name: "Physical team games",
    blurb: "Supervised, safe and a little silly.",
    styles: ["Blindfold navigation", "Cup-stack challenge", "Memory relay", "Obstacle-style task"],
  },
  {
    name: "Creative",
    blurb: "Make something your crew is proud of.",
    styles: ["Crew poster", "Wanted-style video", "Team slogan", "Quick roleplay scene"],
  },
  {
    name: "Clue hunt & observation",
    blurb: "Eyes open. Campus is full of answers.",
    styles: ["Hidden clues", "Spot the campus location", "Riddles", "Audio clue"],
  },
  {
    name: "Strategy",
    blurb: "Spend wisely, the cash is limited.",
    styles: ["Budget decisions", "Risk versus reward", "Negotiation task"],
  },
];

export const SCORING: { label: string; value: string; tone: "gold" | "blue" | "green" | "plain" | "red" }[] = [
  { label: "Mission completion", value: "Up to 60", tone: "gold" },
  { label: "Accuracy / quality", value: "Up to 25", tone: "blue" },
  { label: "Speed bonus", value: "Up to 15", tone: "green" },
  { label: "Optional bonus task", value: "+10", tone: "plain" },
  { label: "Using a hint", value: "−5", tone: "red" },
];

export const SCORING_EXAMPLE =
  "Crew A completes a mission for 60, scores 25 for quality and 5 for speed: 90. Crew B does the same mission faster and gets 60 + 25 + 15 = 100. " +
  "Same station sheet for everyone, and the scoring criteria are published before the event.";

export const POLICE_STEPS: string[] = [
  "After every round, the top 3 crews on the leaderboard become the Police targets for the next round.",
  "Police volunteers find a listed crew in an approved zone, ask them to pause, and photograph the team leader.",
  "The photo goes on the website and turns into that crew's wanted poster. Only listed crews can be marked.",
];

export const WANTED_CHOICES: string[] = [
  "Pay Dexter the clearance fee (100 in-game cash suggested) before the mission. Wanted status is removed and you earn the full score.",
  "Or play the mission while wanted. 20% comes off the points you earn in that mission.",
];

export const FINAL_BONUS: { place: string; bonus: string }[] = [
  { place: "1st crew to complete", bonus: "+150" },
  { place: "2nd crew to complete", bonus: "+120" },
  { place: "3rd crew to complete", bonus: "+100" },
  { place: "Other finalists that complete", bonus: "+75" },
];

export const RULES: string[] = [
  "Each crew has 4–5 registered members and one crew ID for the whole event.",
  "Every crew gets the same missions and the same time limits.",
  "Follow the station coordinators. Disputed scores are reviewed by event control.",
  "No sharing answers, sabotage, tampering with props or disturbing other crews.",
  "No running, pushing, grabbing, chasing or blocking pathways. Police are game operators, not law enforcement.",
  "Stay inside approved event zones and respect normal campus activity.",
  "Late submissions are not accepted once a mission's time window closes.",
  "Organisers can deduct points or disqualify crews for cheating, unsafe behaviour or repeated disruption.",
];

export const PHOTO_NOTICE =
  "Wanted-poster photos are used only for the event's internal wanted board, can be seen only by event operators and are deleted after the event. " +
  "You can opt out of photo use and be verified by crew ID instead.";
