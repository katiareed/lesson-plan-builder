import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
} from "docx";

export interface SessionPlan {
  learningIntention: string;
  successCriteria: string;
  mindfulMinute: string;
  classTime: string;
  checkUnderstanding: string;
  highAchievers: string;
  middleAchievers: string;
  lowAchievers: string;
}

export interface LessonPlan {
  week: string;
  courseTitle: string;
  homework: string;
  labsProjects: string;
  assessments: string;
  contentObjective: string;
  languageObjective: string;
  essentialQuestion: string;
  academicVocabulary: string;
  sessions: SessionPlan[];
  accommodations: string[];
  resources: string;
}

export const emptySession: SessionPlan = {
  learningIntention: "",
  successCriteria: "",
  mindfulMinute: "",
  classTime: "",
  checkUnderstanding: "",
  highAchievers: "",
  middleAchievers: "",
  lowAchievers: "",
};

export const emptyLesson: LessonPlan = {
  week: "",
  courseTitle: "",
  homework: "",
  labsProjects: "",
  assessments: "",
  contentObjective: "",
  languageObjective: "",
  essentialQuestion: "",
  academicVocabulary: "",
  sessions: [
    { ...emptySession },
    { ...emptySession },
    { ...emptySession },
    { ...emptySession },
    { ...emptySession },
  ],
  accommodations: ["", "", "", "", ""],
  resources: "",
};

const FONT = "Calibri";
const TABLE_WIDTH = 10800;
const TITLE_FILL = "83CAEB";
const RED_FILL = "FF0000";
const COL_HEADER_FILL = "C1E4F5";
const SESSION_FILL = "FF9FA4";
const BLUE_FILL = "00B0F0";

const border = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "999999",
};
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function shadedCell(
  text: string,
  width: number,
  fill: string,
  opts?: { colSpan?: number; textColor?: string; bold?: boolean; align?: typeof AlignmentType.CENTER }
): TableCell {
  const lines = text.split("\n");
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    margins: cellMargins,
    shading: { fill, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opts?.colSpan,
    children: lines.map(
      (line) =>
        new Paragraph({
          alignment: opts?.align,
          children: [
            new TextRun({
              text: line,
              bold: opts?.bold ?? true,
              color: opts?.textColor ?? "000000",
              font: FONT,
              size: 18,
            }),
          ],
        })
    ),
  });
}

function valueCell(text: string, width: number, opts?: { colSpan?: number }): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    margins: cellMargins,
    verticalAlign: VerticalAlign.TOP,
    columnSpan: opts?.colSpan,
    children: text
      .split("\n")
      .filter((l) => l.trim())
      .map(
        (line) =>
          new Paragraph({
            children: [new TextRun({ text: line, font: FONT, size: 18 })],
          })
      )
      .concat(
        text.trim() === ""
          ? [new Paragraph({ children: [new TextRun({ text: "", font: FONT, size: 18 })] })]
          : []
      ),
  });
}

function sessionRows(plan: LessonPlan, idx: number): TableRow[] {
  const s = plan.sessions[idx];
  if (!s) return [];

  const taskContent = [
    s.mindfulMinute ? `Mindful Minute - ${s.mindfulMinute}` : "",
    s.classTime ? `Class Time - ${s.classTime}` : "",
    s.checkUnderstanding
      ? `Check for Understanding - ${s.checkUnderstanding}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const diffContent = [
    s.highAchievers ? `HA - ${s.highAchievers}` : "",
    s.middleAchievers ? `MA - ${s.middleAchievers}` : "",
    s.lowAchievers ? `LA - ${s.lowAchievers}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    new TableRow({
      children: [
        shadedCell(`Session  ${idx + 1}`, 1200, SESSION_FILL, { align: AlignmentType.CENTER }),
        valueCell(s.learningIntention, 2400),
        valueCell(s.successCriteria, 2400),
        valueCell(taskContent, 2700),
        valueCell(diffContent, 2100),
      ],
    }),
  ];
}

export async function generateLessonDocx(plan: LessonPlan): Promise<Blob> {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: 20 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 15840, height: 12240, orientation: "landscape" as never },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          // Title row as a table (sky blue background like the template)
          new Table({
            width: { size: TABLE_WIDTH, type: WidthType.DXA },
            columnWidths: [TABLE_WIDTH],
            rows: [
              new TableRow({
                children: [
                  shadedCell("North American International School\nLesson Plan", TABLE_WIDTH, TITLE_FILL, {
                    align: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),

          // Class Information table
          new Table({
            width: { size: TABLE_WIDTH, type: WidthType.DXA },
            columnWidths: [2700, 2700, 2700, 2700],
            rows: [
              new TableRow({
                children: [
                  shadedCell("Class Information", TABLE_WIDTH, RED_FILL, {
                    colSpan: 4,
                    textColor: "FFFFFF",
                    align: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableRow({
                children: [
                  shadedCell("Week:\nNumber and date", 2700, "FFFFFF"),
                  valueCell(plan.week, 2700),
                  shadedCell("Course / Class Title:", 2700, "FFFFFF"),
                  valueCell(plan.courseTitle, 2700),
                ],
              }),
              new TableRow({
                children: [
                  shadedCell("Homework\n(At Least Twice/Week):", 2700, "FFFFFF"),
                  valueCell(plan.homework, 2700),
                  shadedCell("Labs/Projects\n(Include the session):", 2700, "FFFFFF"),
                  valueCell(plan.labsProjects, 2700),
                ],
              }),
              new TableRow({
                children: [
                  shadedCell("Assessment(s)\n(Include the session):", 2700, "FFFFFF"),
                  valueCell(plan.assessments, 8100, { colSpan: 3 }),
                ],
              }),
              new TableRow({
                children: [
                  shadedCell("Content Objective(s):\nPower Standards", 2700, "FFFFFF"),
                  valueCell(plan.contentObjective, 2700),
                  shadedCell("Language Objective(s):\nOverall Learning Intention for the week", 2700, "FFFFFF"),
                  valueCell(plan.languageObjective, 2700),
                ],
              }),
              new TableRow({
                children: [
                  shadedCell("Essential Question(s) for the Unit:", 2700, "FFFFFF"),
                  valueCell(plan.essentialQuestion, 2700),
                  shadedCell("Academic Vocabulary:", 2700, "FFFFFF"),
                  valueCell(plan.academicVocabulary, 2700),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),

          // Weekly Lesson Plan table
          new Table({
            width: { size: TABLE_WIDTH, type: WidthType.DXA },
            columnWidths: [1200, 2400, 2400, 2700, 2100],
            rows: [
              new TableRow({
                children: [
                  shadedCell("WEEKLY LESSON PLAN", TABLE_WIDTH, TITLE_FILL, {
                    colSpan: 5,
                    align: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableRow({
                children: [
                  shadedCell("", 1200, COL_HEADER_FILL),
                  shadedCell("Learning Intention(s)\nWe are learning…", 2400, COL_HEADER_FILL, { align: AlignmentType.CENTER }),
                  shadedCell("Success Criteria:\nI/We Can…", 2400, COL_HEADER_FILL, { align: AlignmentType.CENTER }),
                  shadedCell("Summary of Tasks/Actions\nMindful Minute, Class Time, Check for Understanding", 2700, COL_HEADER_FILL, { align: AlignmentType.CENTER }),
                  shadedCell("Differentiation/\nExtension\nHA - MA - LA", 2100, COL_HEADER_FILL, { align: AlignmentType.CENTER }),
                ],
              }),
              ...plan.sessions.flatMap((_, i) => sessionRows(plan, i)),
            ],
          }),

          new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),

          // Accommodations table
          new Table({
            width: { size: TABLE_WIDTH, type: WidthType.DXA },
            columnWidths: [2700, 8100],
            rows: [
              new TableRow({
                children: [
                  shadedCell("SOD/GAT/ESL\nAccommodations/Modifications", 2700, BLUE_FILL, { textColor: "FFFFFF" }),
                  shadedCell("Accommodations/Modifications", 8100, RED_FILL, { textColor: "FFFFFF" }),
                ],
              }),
              ...plan.accommodations.map(
                (a, i) =>
                  new TableRow({
                    children: [
                      shadedCell(`Session ${i + 1}:`, 2700, "FFFFFF"),
                      valueCell(a, 8100),
                    ],
                  })
              ),
              new TableRow({
                children: [
                  shadedCell("Resources used for the week:", 2700, BLUE_FILL, { textColor: "FFFFFF" }),
                  valueCell(plan.resources, 8100),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
