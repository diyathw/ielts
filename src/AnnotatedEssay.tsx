export type Annotation = {
  quote: string
  category: string
  replacement: string
  explanation: string
}

type Props = { essay: string; annotations: Annotation[] }

export function AnnotatedEssay({ essay, annotations }: Props) {
  const matches: { start: number; end: number; annotation: Annotation }[] = []
  for (const annotation of annotations) {
    if (!annotation.quote) continue
    let start = essay.indexOf(annotation.quote)
    while (start >= 0 && matches.some(match => start < match.end && start + annotation.quote.length > match.start)) {
      start = essay.indexOf(annotation.quote, start + 1)
    }
    if (start >= 0) matches.push({ start, end: start + annotation.quote.length, annotation })
  }
  matches.sort((a, b) => a.start - b.start)

  let cursor = 0
  const parts = matches.flatMap((match, index) => {
    const before = essay.slice(cursor, match.start)
    cursor = match.end
    return [
      <span key={`text-${index}`}>{before}</span>,
      <span
        key={`mark-${index}`}
        className="essay-mark"
        tabIndex={0}
        role="button"
        aria-label={`${match.annotation.category}: ${match.annotation.quote}. Suggestion: ${match.annotation.replacement}. ${match.annotation.explanation}`}
      >
        {essay.slice(match.start, match.end)}
        <span className="mark-tooltip" role="tooltip"><strong>{match.annotation.category}</strong><span>{match.annotation.explanation}</span><em>Try: {match.annotation.replacement}</em></span>
      </span>,
    ]
  })
  parts.push(<span key="tail">{essay.slice(cursor)}</span>)

  return <div className="annotated-essay">{parts}</div>
}
