export default function MarginRail({ sources = [] }) {
  return (
    <aside className="w-72 border-l border-white/5 bg-ink-soft/30 px-4 py-5 overflow-y-auto">
      <p className="font-mono text-[11px] uppercase tracking-wide text-text-muted mb-3">
        Sourced from
      </p>

      {sources.length === 0 ? (
        <p className="text-sm text-text-muted italic">
          Ask a question in the chat — the passages it's grounded in
          will show up here.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {sources.map((s) => (
            <div
              key={s.id}
              className="rounded-md bg-paper text-text-primary px-3 py-2.5 shadow-sm border-l-2 border-amber"
            >
              <p className="text-sm leading-snug">{s.snippet}</p>
              <p className="font-mono text-[10px] text-text-muted mt-2">
                {s.docName} · p.{s.page}
              </p>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}