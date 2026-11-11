import { useEffect, useMemo, useState } from "react"
import { ArrowRight, BookOpen, Check, CircleHelp, Clock3, LoaderCircle, Moon, RotateCcw, Sparkles, Sun } from "lucide-react"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader } from "./components/ui/card"
import { Textarea } from "./components/ui/textarea"
import { AnnotatedEssay, type Annotation } from "./AnnotatedEssay"

type Task = "Task 1" | "Task 2"
type Criterion = { name: string; band: number; reason: string }
type Feedback = {
  overallBand: number
  rawAverage: number
  summary: string
  criteria: Criterion[]
  strengths: string[]
  improvements: string[]
  nextStep: string
  annotations: Annotation[]
}
type Draft = { task: Task; prompt: string; essay: string }
const storageKey = "ielts-essay-draft-v1"

function parseFeedback(value: unknown): Feedback {
  if (!value || typeof value !== "object") throw new Error("Codex returned an empty result. Please try again.")
  const result = value as Partial<Feedback>
  if (!Array.isArray(result.criteria) || result.criteria.length !== 4 ||
    result.criteria.some(item => !item || typeof item.name !== "string" || typeof item.reason !== "string" ||
      typeof item.band !== "number" || !Number.isFinite(item.band) || item.band < 0 || item.band > 9 || item.band * 2 !== Math.round(item.band * 2)) ||
    typeof result.summary !== "string" || !Array.isArray(result.strengths) ||
    result.strengths.some(item => typeof item !== "string") ||
    !Array.isArray(result.improvements) || result.improvements.some(item => typeof item !== "string") ||
    typeof result.nextStep !== "string") {
    throw new Error("Codex returned incomplete feedback. Please try marking again.")
  }
  const rawAverage = result.criteria.reduce((sum, item) => sum + item.band, 0) / 4
  return {
    summary: result.summary,
    criteria: result.criteria,
    strengths: result.strengths,
    improvements: result.improvements,
    nextStep: result.nextStep,
    annotations: Array.isArray(result.annotations) ? result.annotations.filter((item): item is Annotation =>
      !!item && typeof item.quote === "string" && typeof item.category === "string" &&
      typeof item.replacement === "string" && typeof item.explanation === "string") : [],
    rawAverage,
    overallBand: Math.round(rawAverage * 2) / 2,
  }
}
const officialSamples: Record<Task, string> = {
  "Task 1": "You live in a room in college which you share with another student. However, there are many problems with this arrangement and you find it very difficult to work. Write a letter to the accommodation officer at the college. In the letter: describe the situation; explain your problems and why it is difficult to work; say what kind of accommodation you would prefer. Begin: Dear Sir or Madam,",
  "Task 2": "Shopping is becoming more and more popular as a leisure activity. However, some people feel that this has both positive and negative effects. Why is shopping so popular? What effects does its increase in popularity have on individuals and on society? Give reasons and relevant examples.",
}

function readDraft(): Draft {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as Partial<Draft> | null
    if (saved && (saved.task === "Task 1" || saved.task === "Task 2")) {
      return { task: saved.task, prompt: saved.prompt || "", essay: saved.essay || "" }
    }
  } catch { /* Ignore an invalid saved draft. */ }
  return { task: "Task 2", prompt: "", essay: "" }
}

export default function App() {
  const [draft, setDraft] = useState<Draft>(readDraft)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [markedEssay, setMarkedEssay] = useState("")
  const [status, setStatus] = useState<"idle" | "marking">("idle")
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(true)
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking")
  const [theme, setTheme] = useState<"light" | "dark">(() => localStorage.getItem("ielts-theme") === "dark" ? "dark" : "light")
  const wordCount = useMemo(() => draft.essay.trim().split(/\s+/).filter(Boolean).length, [draft.essay])
  const target = draft.task === "Task 2" ? 250 : 150

  useEffect(() => {
    setSaved(false)
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(draft))
      setSaved(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [draft])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("ielts-theme", theme)
  }, [theme])

  useEffect(() => {
    let active = true
    async function checkApi() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" })
        if (active) setApiStatus(response.ok ? "online" : "offline")
      } catch {
        if (active) setApiStatus("offline")
      }
    }
    void checkApi()
    const timer = setInterval(checkApi, 10_000)
    return () => { active = false; clearInterval(timer) }
  }, [])

  async function markEssay() {
    if (!draft.prompt.trim() || !draft.essay.trim()) {
      setError("Add the question and your essay before marking.")
      return
    }
    setError("")
    setStatus("marking")
    setFeedback(null)
    try {
      const response = await fetch("/api/mark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      })
      const body = await response.text()
      let result: unknown
      try { result = JSON.parse(body) } catch { throw new Error("The marking server returned an invalid response. Restart npm run dev.") }
      if (!response.ok) {
        const message = result && typeof result === "object" && "message" in result ? (result as { message: unknown }).message : "Unable to mark the essay."
        throw new Error(Array.isArray(message) ? message.join(" ") : String(message))
      }
      setFeedback(parseFeedback(result))
      setMarkedEssay(draft.essay)
    } catch (cause) {
      setError(cause instanceof TypeError ? "Cannot reach NestJS. Run npm run dev and keep the terminal open." : cause instanceof Error ? cause.message : "Unable to mark the essay.")
    } finally {
      setStatus("idle")
    }
  }

  function clearDraft() {
    setDraft({ task: "Task 2", prompt: "", essay: "" })
    setFeedback(null)
    setMarkedEssay("")
    setError("")
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><BookOpen size={19} strokeWidth={2.3} /></div><span>IELTS<span className="brand-light"> Studio</span></span></div>
      <div className="topbar-right"><span className="topbar-pill"><span className={apiStatus === "offline" ? "status-dot offline" : "status-dot"} /> {apiStatus === "offline" ? "Marker offline" : apiStatus === "checking" ? "Checking marker" : "Local Codex marker"}</span><button className="theme-toggle" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Light mode" : "Dark mode"}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button><div className="avatar">IW</div></div>
    </header>

    <main className="page">
      <div className="heading-row">
        <div><div className="eyebrow"><span className="eyebrow-line" /> WRITING PRACTICE</div><h1>Your writing desk<span className="heading-dot">.</span></h1><p className="subtitle">Write with focus. Get clear, criterion based feedback when you’re ready.</p></div>
        <div className="step-indicator"><span className="step-circle active">1</span><span>Write</span><span className="step-line" /><span className={feedback ? "step-circle active" : "step-circle"}>2</span><span>Review</span></div>
      </div>

      <div className="workspace">
        <section className="editor-column" aria-label="Essay editor">
          <Card className="editor-card">
            <CardHeader className="editor-header">
              <div><div className="section-kicker">YOUR SESSION</div><h2>Essay editor</h2></div>
              <div className="draft-state"><Check size={14} /> {saved ? "Draft saved" : "Saving..."}</div>
            </CardHeader>
            <CardContent>
              <div className="field-label">Writing task</div>
              <div className="task-switch" role="group" aria-label="Writing task">
                {(["Task 1", "Task 2"] as Task[]).map(task => <button key={task} type="button" className={draft.task === task ? "task-option selected" : "task-option"} onClick={() => { setDraft({ ...draft, task }); setFeedback(null) }}>{task}<span>{task === "Task 1" ? "Report / letter" : "Essay"}</span></button>)}
              </div>
              {!draft.essay.trim() && <div className="sample-row"><button className="sample-button" type="button" onClick={() => { setDraft({ ...draft, prompt: officialSamples[draft.task] }); setFeedback(null) }}>Use an official General Training sample task <ArrowRight size={13} /></button><a href="https://ielts.org/cdn/Sample-tests/ielts-general-training-writing-sample-tasks-2023.pdf" target="_blank" rel="noreferrer">View source PDF</a></div>}
              <label className="field-label" htmlFor="question">The question or prompt <span className="required">*</span></label>
              <Textarea id="question" className="prompt-input" placeholder={draft.task === "Task 2" ? "Paste your IELTS Writing Task 2 question here..." : "Paste your Task 1 instructions and describe the visual or letter situation..."} value={draft.prompt} onChange={event => setDraft({ ...draft, prompt: event.target.value })} />
              <div className="essay-label-row"><label className="field-label" htmlFor="essay">Your response <span className="required">*</span></label><span className="word-guide">Suggested minimum: {target} words</span></div>
              <Textarea id="essay" className="essay-input" placeholder="Start writing here. Your work is saved automatically in this browser..." value={draft.essay} onChange={event => setDraft({ ...draft, essay: event.target.value })} />
              <div className="editor-footer"><span className={wordCount >= target ? "word-count reached" : "word-count"}>{wordCount} words <span className="count-divider">/</span> {target} target</span><span className="autosave-note">Only stored in this browser until you mark it</span></div>
            </CardContent>
          </Card>
          <div className="action-row"><Button variant="ghost" onClick={clearDraft} disabled={status === "marking"}><RotateCcw size={16} /> Clear draft</Button><Button onClick={markEssay} disabled={status === "marking"}>{status === "marking" ? <><LoaderCircle className="spin" size={17} /> Marking essay...</> : <><Sparkles size={17} /> Mark with Codex <ArrowRight size={16} /></>}</Button></div>
          {error && <div className="error-banner" role="alert">{error}</div>}
        </section>

        <aside className="feedback-column" aria-label="Marking feedback">
          {feedback ? <div className="feedback-stack">
            <Card className="score-card"><CardContent><div className="score-heading"><div><div className="section-kicker">YOUR ESTIMATED TASK BAND</div><h2>Marking overview</h2></div><span className="estimate-tag">AI estimate</span></div><div className="big-score">{feedback.overallBand.toFixed(1)}<span>/ 9</span></div><p className="score-math">({feedback.criteria.map(item => item.band.toFixed(1)).join(" + ")}) ÷ 4 = {feedback.rawAverage.toFixed(2)} · shown to nearest 0.5</p><p className="score-summary">{feedback.summary}</p></CardContent></Card>
            <Card><CardHeader><div className="section-kicker">BAND BREAKDOWN</div><h2>Assessment criteria</h2></CardHeader><CardContent><div className="criteria-list">{feedback.criteria.map(item => <div className="criterion" key={item.name}><div className="criterion-top"><strong>{item.name}</strong><span>{item.band.toFixed(1)}</span></div><p>{item.reason}</p></div>)}</div></CardContent></Card>
            {feedback.annotations.length > 0 && <Card><CardHeader><div className="section-kicker">INLINE CORRECTIONS</div><h2>Marked response</h2></CardHeader><CardContent><p className="annotation-help">Hover over or tap a highlighted phrase to see the issue and a suggested correction.</p><AnnotatedEssay essay={markedEssay} annotations={feedback.annotations} /></CardContent></Card>}
            <Card><CardHeader><div className="section-kicker">WHAT TO WORK ON</div><h2>Feedback</h2></CardHeader><CardContent><h3 className="list-title">What you did well</h3><ul className="feedback-list good">{feedback.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul><h3 className="list-title space-top">Improve next</h3><ul className="feedback-list improve">{feedback.improvements.map((item, index) => <li key={index}>{item}</li>)}</ul><div className="next-step"><strong>Next step</strong><p>{feedback.nextStep}</p></div></CardContent></Card>
          </div> : <Card className="empty-feedback"><CardContent><div className={status === "marking" ? "empty-icon loading" : "empty-icon"}>{status === "marking" ? <LoaderCircle className="spin" size={26} /> : <Sparkles size={26} />}</div><h2>{status === "marking" ? "Codex is reading your essay" : "Your feedback will appear here"}</h2><p>{status === "marking" ? "This can take a minute or two. Keep this page open while your writing is assessed." : "Add your question and response, then select “Mark with Codex” for a band estimate and practical revision notes."}</p><div className="empty-divider" /><div className="empty-points"><span><Check size={15} /> Four IELTS criteria</span><span><Check size={15} /> Specific improvements</span><span><Check size={15} /> A clear next step</span></div></CardContent></Card>}
          <div className="help-note"><CircleHelp size={17} /><span>Scores are practice estimates. Official IELTS scores are given by certified examiners.</span></div>
        </aside>
      </div>
      <footer className="page-footer"><span>Built for focused IELTS writing practice</span><span><Clock3 size={14} /> Take your time. Good writing takes revision.</span></footer>
    </main>
  </div>
}
