import { type LessonPlan, type SessionPlan } from "./lessonDocx";

function emptySession(): SessionPlan {
  return {
    learningIntention: "",
    successCriteria: "",
    mindfulMinute: "",
    classTime: "",
    checkUnderstanding: "",
    highAchievers: "",
    middleAchievers: "",
    lowAchievers: "",
  };
}

function match(line: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = line.match(p);
    if (m) return (m[1] ?? "").trim();
  }
  return null;
}


const SESSION_HEADER =
  /^session\s*(\d+)\s*[:.\-—]?\s*(.*)/i;

const WEEK_PATTERNS = [
  /^week\s*[:.\-—]?\s*(.+)/i,
  /^(week\s+\d+.*)/i,
];

const COURSE_PATTERNS = [
  /(?:course|class(?:\s+title)?|subject)\s*[:.\-—]\s*(.+)/i,
  /^week\s+\d+.*?[—]+\s*(.+)/i,
];

const HOMEWORK_PATTERNS = [
  /^homework\s*[:.\-—]\s*(.+)/i,
  /^hw\s*[:.\-—]\s*(.+)/i,
];

const LABS_PATTERNS = [
  /^(?:labs?|projects?)\s*[:.\-—]\s*(.+)/i,
  /^labs?\s*\/\s*projects?\s*[:.\-—]\s*(.+)/i,
];

const ASSESS_PATTERNS = [
  /^assessments?\s*[:.\-—]\s*(.+)/i,
  /^(?:test|quiz|exam)\s*[:.\-—]\s*(.+)/i,
];

const VOCAB_PATTERNS = [
  /^(?:academic\s+)?vocab(?:ulary)?\s*[:.\-—]\s*(.+)/i,
];

const EQ_PATTERNS = [
  /^essential\s+question\s*[:.\-—]\s*(.+)/i,
  /^eq\s*[:.\-—]\s*(.+)/i,
];

const OBJECTIVE_PATTERNS = [
  /^(?:content\s+)?objectives?\s*[:.\-—]\s*(.+)/i,
  /^(?:power\s+standards?)\s*[:.\-—]\s*(.+)/i,
];

const LANG_OBJ_PATTERNS = [
  /^language\s+objectives?\s*[:.\-—]\s*(.+)/i,
  /^overall\s+learning\s+intention\s*[:.\-—]\s*(.+)/i,
];

const MINDFUL_PATTERNS = [
  /^mindful\s+minute\s*[:.\-—]\s*(.*)/i,
  /^mm\s*[:.\-—]\s*(.*)/i,
];

const CLASS_TIME_PATTERNS = [
  /^class\s*(?:time|work)\s*[:.\-—]\s*(.*)/i,
  /^during\s+class\s*[:.\-—]\s*(.*)/i,
];

const CHECK_PATTERNS = [
  /^check(?:ing)?\s*(?:for\s+understanding)?\s*[:.\-—]\s*(.*)/i,
  /^cfu\s*[:.\-—]\s*(.*)/i,
];

const HA_PATTERNS = [/^ha\s*[:.\-—]\s*(.*)/i, /^high\s*(?:achievers?)?\s*[:.\-—]\s*(.*)/i, /^ha\s+(?:can\s+)?(?:also\s+)?(.+)/i];
const MA_PATTERNS = [/^ma\s*[:.\-—]\s*(.*)/i, /^middle?\s*(?:achievers?)?\s*[:.\-—]\s*(.*)/i];
const LA_PATTERNS = [/^la\s*[:.\-—]\s*(.*)/i, /^low\s*(?:achievers?)?\s*[:.\-—]\s*(.*)/i];

const LEARNING_INT_PATTERNS = [
  /^learning\s+intentions?\s*[:.\-—]\s*(.*)/i,
  /^we\s+are\s+learning\s*[:.\-—]?\s*(.*)/i,
  /^li\s*[:.\-—]\s*(.*)/i,
  /^learning\s+goals?\s*[:.\-—]\s*(.*)/i,
  /^objectives?\s+for\s+(?:this|the)\s+session\s*[:.\-—]\s*(.*)/i,
  /^students?\s+will\s+(?:learn|be\s+able)\s*(.*)/i,
];

const SUCCESS_PATTERNS = [
  /^success\s+criteria\s*[:.\-—]\s*(.*)/i,
  /^i\s*\/?\s*we\s+can\s*[:.\-—]?\s*(.*)/i,
  /^sc\s*[:.\-—]\s*(.*)/i,
  /^students?\s+can\s*[:.\-—]\s*(.*)/i,
];

const RESOURCE_PATTERNS = [
  /^resources?\s*[:.\-—]\s*(.+)/i,
];

export function parseNotes(raw: string): LessonPlan {
  const lines = raw.split("\n").map((l) => l.trim());

  let week = "";
  let courseTitle = "";
  let homework = "";
  let labsProjects = "";
  let assessments = "";
  let contentObjective = "";
  let languageObjective = "";
  let essentialQuestion = "";
  let academicVocabulary = "";
  let resources = "";

  const sessionMap = new Map<number, SessionPlan>();
  let currentSession: SessionPlan | null = null;
  let currentSessionNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const sessionMatch = line.match(SESSION_HEADER);
    if (sessionMatch) {
      const num = parseInt(sessionMatch[1], 10);
      currentSessionNum = num;
      currentSession = sessionMap.get(num) ?? emptySession();
      sessionMap.set(num, currentSession);

      const rest = (sessionMatch[2] ?? "").trim();
      if (rest) {
        currentSession.learningIntention = rest;
      }
      continue;
    }

    let v: string | null;

    if (!week && (v = match(line, WEEK_PATTERNS))) {
      const courseFromWeek = match(line, COURSE_PATTERNS);
      if (courseFromWeek && !courseTitle) {
        courseTitle = courseFromWeek;
        week = v.replace(/\s*[—]\s*.+$/, "").trim();
      } else {
        week = v;
      }
      continue;
    }

    if (!courseTitle && (v = match(line, COURSE_PATTERNS))) {
      courseTitle = v;
      continue;
    }

    if (!homework && (v = match(line, HOMEWORK_PATTERNS))) {
      homework = v;
      continue;
    }

    if (!labsProjects && (v = match(line, LABS_PATTERNS))) {
      labsProjects = v;
      continue;
    }

    if (!assessments && (v = match(line, ASSESS_PATTERNS))) {
      assessments = v;
      continue;
    }

    // Session-level fields checked FIRST when inside a session
    if (currentSession) {
      if ((v = match(line, LEARNING_INT_PATTERNS)) !== null) {
        currentSession.learningIntention = v || collectFollowing(lines, i);
        continue;
      }
      if ((v = match(line, SUCCESS_PATTERNS)) !== null) {
        currentSession.successCriteria = v || collectFollowing(lines, i);
        continue;
      }
      if ((v = match(line, MINDFUL_PATTERNS)) !== null) {
        currentSession.mindfulMinute = v || collectFollowing(lines, i);
        continue;
      }
      if ((v = match(line, CLASS_TIME_PATTERNS)) !== null) {
        currentSession.classTime = v || collectFollowing(lines, i);
        continue;
      }
      if ((v = match(line, CHECK_PATTERNS)) !== null) {
        currentSession.checkUnderstanding = v || collectFollowing(lines, i);
        continue;
      }
      if ((v = match(line, HA_PATTERNS)) !== null) {
        currentSession.highAchievers = v || collectFollowing(lines, i);
        continue;
      }
      if ((v = match(line, MA_PATTERNS)) !== null) {
        currentSession.middleAchievers = v || collectFollowing(lines, i);
        continue;
      }
      if ((v = match(line, LA_PATTERNS)) !== null) {
        currentSession.lowAchievers = v || collectFollowing(lines, i);
        continue;
      }
    }

    // Top-level fields (only reached if no session pattern matched above)
    if (!academicVocabulary && (v = match(line, VOCAB_PATTERNS))) {
      academicVocabulary = v;
      continue;
    }

    if (!essentialQuestion && (v = match(line, EQ_PATTERNS))) {
      essentialQuestion = v;
      continue;
    }

    if (!contentObjective && (v = match(line, OBJECTIVE_PATTERNS))) {
      contentObjective = v;
      continue;
    }

    if (!languageObjective && (v = match(line, LANG_OBJ_PATTERNS))) {
      languageObjective = v;
      continue;
    }

    if (!resources && (v = match(line, RESOURCE_PATTERNS))) {
      resources = v;
      continue;
    }

    // Fallback: unrecognized line inside a session goes to classTime
    if (currentSession) {
      if (
        !currentSession.classTime &&
        !line.match(/^(session|week|homework|assessment|vocab|essential|objective|resource|learning|success|we\s+are|i\s*\/?\s*we\s+can)/i)
      ) {
        currentSession.classTime = line;
        continue;
      }
    }
  }

  const sessions: SessionPlan[] = [];
  for (let n = 1; n <= 5; n++) {
    sessions.push(sessionMap.get(n) ?? emptySession());
  }

  const accommodations = sessions.map(() => "");

  return {
    week,
    courseTitle,
    homework,
    labsProjects,
    assessments,
    contentObjective,
    languageObjective,
    essentialQuestion,
    academicVocabulary,
    sessions,
    accommodations,
    resources,
  };
}

function collectFollowing(lines: string[], currentIndex: number): string {
  const next = currentIndex + 1;
  if (
    next < lines.length &&
    lines[next].trim() &&
    !SESSION_HEADER.test(lines[next]) &&
    !lines[next].match(
      /^(mindful|class\s*time|class\s*work|check|ha\b|ma\b|la\b|learning|success|homework|assessment|vocab|essential|objective|resource|week|session)/i
    )
  ) {
    return lines[next].trim();
  }
  return "";
}
