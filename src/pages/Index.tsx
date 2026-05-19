import { useState } from "react";
import { Loader2, Sparkles, Download, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { parseNotes } from "@/lib/parseNotes";
import {
  type LessonPlan,
  emptyLesson,
  generateLessonDocx,
} from "@/lib/lessonDocx";

const SAMPLE = `Week 7, Oct 14-18 — AP English Language
Homework: read Ch 4 (Mon), annotate essay (Wed)
Assessment: argument draft due Session 5

This week we're working on rhetorical appeals (ethos, pathos, logos).
Vocabulary: ethos, pathos, logos, exigence, kairos.
Essential question: How do writers use the appeals to persuade?

Session 1: introduce the appeals using "Letter from Birmingham Jail" excerpt.
Mindful minute: free-write about a time they tried to convince someone.
Class time: read the excerpt and annotate in pairs.
Check: exit ticket naming one example of each appeal.
HA can also analyze counter-arguments.

Session 2: rank the appeals by effectiveness — carousel activity with 4 short texts.
Session 3: brainstorm own essay topics, draft thesis + outline.`;

export default function Index() {
  const [notes, setNotes] = useState("");
  const [parsing, setParsing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [plan, setPlan] = useState<LessonPlan | null>(null);

  async function handleParse() {
    if (!notes.trim()) {
      toast({ title: "Add some notes first", variant: "destructive" });
      return;
    }
    setParsing(true);
    try {
      const result = parseNotes(notes);
      setPlan(result);
      toast({ title: "Lesson plan organized", description: "Review and edit before downloading." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Couldn't organize notes", description: msg, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  }

  async function handleDownload() {
    if (!plan) return;
    setDownloading(true);
    try {
      const blob = await generateLessonDocx(plan);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeWeek = (plan.week || "lesson-plan").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
      a.download = `${safeWeek || "lesson-plan"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({
        title: "Download failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  }

  function update<K extends keyof LessonPlan>(key: K, value: LessonPlan[K]) {
    if (!plan) return;
    setPlan({ ...plan, [key]: value });
  }

  function updateSession(idx: number, key: keyof LessonPlan["sessions"][number], value: string) {
    if (!plan) return;
    const sessions = plan.sessions.map((s, i) => (i === idx ? { ...s, [key]: value } : s));
    setPlan({ ...plan, sessions });
  }

  function updateAccommodation(idx: number, value: string) {
    if (!plan) return;
    const accommodations = plan.accommodations.map((a, i) => (i === idx ? value : a));
    setPlan({ ...plan, accommodations });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center gap-3">
            <FileText className="h-7 w-7" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Lesson Plan Builder
              </h1>
              <p className="text-sm sm:text-base text-primary-foreground/90 mt-1">
                Paste your notes — we format them into the school template.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <Card className="p-5 sm:p-6">
          <label className="block text-sm font-semibold mb-3">
            Your lesson notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={SAMPLE}
            rows={10}
            className="font-mono text-sm resize-y min-h-[220px]"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleParse} disabled={parsing} size="lg">
              {parsing ? (
                <>
                  <Loader2 className="animate-spin" />
                  Organizing…
                </>
              ) : (
                <>
                  <Sparkles />
                  Organize into template
                </>
              )}
            </Button>
            {!notes && (
              <Button variant="outline" onClick={() => setNotes(SAMPLE)} size="lg">
                Use sample notes
              </Button>
            )}
            {plan && (
              <Button
                variant="ghost"
                onClick={() => setPlan(null)}
                size="lg"
                className="ml-auto"
              >
                <RotateCcw />
                Start over
              </Button>
            )}
          </div>
        </Card>

        {plan && (
          <Card className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Review & edit</h2>
              <Button
                onClick={handleDownload}
                disabled={downloading}
                size="lg"
                className="bg-primary"
              >
                {downloading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Building…
                  </>
                ) : (
                  <>
                    <Download />
                    Download .docx
                  </>
                )}
              </Button>
            </div>

            <section className="space-y-3">
              <SectionTitle>Class information</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Week">
                  <Input value={plan.week} onChange={(e) => update("week", e.target.value)} />
                </Field>
                <Field label="Course / Class title">
                  <Input value={plan.courseTitle} onChange={(e) => update("courseTitle", e.target.value)} />
                </Field>
                <Field label="Homework">
                  <Textarea value={plan.homework} onChange={(e) => update("homework", e.target.value)} rows={2} />
                </Field>
                <Field label="Labs / Projects">
                  <Textarea value={plan.labsProjects} onChange={(e) => update("labsProjects", e.target.value)} rows={2} />
                </Field>
                <Field label="Assessment(s)" className="sm:col-span-2">
                  <Textarea value={plan.assessments} onChange={(e) => update("assessments", e.target.value)} rows={2} />
                </Field>
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle>Objectives</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Content objective(s) — Power Standards">
                  <Textarea value={plan.contentObjective} onChange={(e) => update("contentObjective", e.target.value)} rows={3} />
                </Field>
                <Field label="Language objective(s) — Overall learning intention">
                  <Textarea value={plan.languageObjective} onChange={(e) => update("languageObjective", e.target.value)} rows={3} />
                </Field>
                <Field label="Essential question(s)">
                  <Textarea value={plan.essentialQuestion} onChange={(e) => update("essentialQuestion", e.target.value)} rows={2} />
                </Field>
                <Field label="Academic vocabulary">
                  <Textarea value={plan.academicVocabulary} onChange={(e) => update("academicVocabulary", e.target.value)} rows={2} />
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Sessions</SectionTitle>
              {plan.sessions.map((s, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="hl-session">Session {i + 1}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Learning intention (We are learning…)">
                      <Textarea value={s.learningIntention} onChange={(e) => updateSession(i, "learningIntention", e.target.value)} rows={2} />
                    </Field>
                    <Field label="Success criteria (I/We can…)">
                      <Textarea value={s.successCriteria} onChange={(e) => updateSession(i, "successCriteria", e.target.value)} rows={2} />
                    </Field>
                    <Field label={<span><span className="hl-mindful">Mindful Minute</span></span>}>
                      <Textarea value={s.mindfulMinute} onChange={(e) => updateSession(i, "mindfulMinute", e.target.value)} rows={2} />
                    </Field>
                    <Field label={<span><span className="hl-class">Class Time</span></span>}>
                      <Textarea value={s.classTime} onChange={(e) => updateSession(i, "classTime", e.target.value)} rows={2} />
                    </Field>
                    <Field label={<span><span className="hl-check">Check for Understanding</span></span>}>
                      <Textarea value={s.checkUnderstanding} onChange={(e) => updateSession(i, "checkUnderstanding", e.target.value)} rows={2} />
                    </Field>
                    <Field label={<span className="font-semibold">HA</span>}>
                      <Textarea value={s.highAchievers} onChange={(e) => updateSession(i, "highAchievers", e.target.value)} rows={2} />
                    </Field>
                    <Field label={<span className="font-semibold">MA</span>}>
                      <Textarea value={s.middleAchievers} onChange={(e) => updateSession(i, "middleAchievers", e.target.value)} rows={2} />
                    </Field>
                    <Field label={<span className="font-semibold">LA</span>}>
                      <Textarea value={s.lowAchievers} onChange={(e) => updateSession(i, "lowAchievers", e.target.value)} rows={2} />
                    </Field>
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <SectionTitle>SOD / GAT / ESL accommodations</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                {plan.accommodations.map((a, i) => (
                  <Field key={i} label={`Session ${i + 1}`}>
                    <Textarea value={a} onChange={(e) => updateAccommodation(i, e.target.value)} rows={2} />
                  </Field>
                ))}
                <Field label="Resources used for the week" className="sm:col-span-2">
                  <Textarea value={plan.resources} onChange={(e) => update("resources", e.target.value)} rows={3} />
                </Field>
              </div>
            </section>

            <div className="pt-2 flex justify-end">
              <Button onClick={handleDownload} disabled={downloading} size="lg">
                {downloading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Building…
                  </>
                ) : (
                  <>
                    <Download />
                    Download .docx
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {!plan && (
          <p className="text-center text-sm text-muted-foreground">
            Tip: write naturally — week info, objectives, and what each session covers. The AI will fit it into the school's exact template.
          </p>
        )}
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-medium text-foreground/80">{label}</label>
      {children}
    </div>
  );
  void emptyLesson;
}
