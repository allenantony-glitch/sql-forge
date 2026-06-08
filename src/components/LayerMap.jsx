import { Lock, Check, Pickaxe, X, Calendar, Download, Upload } from 'lucide-react';

export function LayerMap({
  layers,
  challenges,
  currentChallengeIdx,
  completedIds,
  onSelectChallenge,
  onResetProgress,
  isOpen,
  onClose,
  onStartDaily,
  dailyChallengeId,
  dailyAlreadyDone,
  onExport,
  onImport,
}) {
  const handleSelect = (idx) => {
    onSelectChallenge(idx);
    if (onClose) onClose();
  };

  // The same drawer body is rendered twice in the JSX below — once for the
  // persistent desktop sidebar (md+) and once as the off-canvas drawer (sm).
  // Hoisting the body keeps them in sync.
  const body = (
    <>
      <div className="text-xs uppercase tracking-widest text-stone-500 mb-3 flex items-center justify-between">
        <span>The Mine</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1 -mr-1 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
            aria-label="Close layer map"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {onStartDaily && (
        <button
          onClick={() => {
            onStartDaily();
            if (onClose) onClose();
          }}
          className={`mb-3 w-full text-left rounded-md border px-3 py-2 transition-colors ${
            dailyAlreadyDone
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200 hover:bg-emerald-500/10"
              : "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
          }`}
          title={dailyChallengeId ? `Today's daily: ${dailyChallengeId}` : "Daily Forge"}
        >
          <div className="text-[11px] uppercase tracking-widest opacity-80 flex items-center gap-1.5">
            <Calendar size={11} />
            Daily Forge
            {dailyAlreadyDone && <Check size={11} className="text-emerald-300" />}
          </div>
          <div className="text-xs mt-0.5 opacity-90">
            {dailyAlreadyDone ? "Done — come back tomorrow" : "One challenge a day"}
          </div>
        </button>
      )}

      <ol className="space-y-3 flex-1">
        {layers.map((layer) => {
          const isCurrent = layer.num === challenges[currentChallengeIdx].layer;
          const layerChallenges = challenges.filter((c) => c.layer === layer.num);
          return (
            <li key={layer.num} className={`rounded-md border ${layer.unlocked ? "border-stone-800 bg-stone-900/40" : "border-stone-900 bg-stone-950/40"}`}>
              <div className="px-3 py-2 flex items-center gap-2">
                {layer.unlocked ? (
                  <Pickaxe size={14} className={isCurrent ? "text-amber-400" : "text-stone-500"} />
                ) : (
                  <Lock size={14} className="text-stone-600" />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${layer.unlocked ? "text-stone-200" : "text-stone-600"}`}>
                    Layer {layer.num}: {layer.name}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate">{layer.subtitle}</div>
                </div>
              </div>
              {layer.unlocked && (
                <ul className="px-2 pb-2 space-y-1">
                  {layerChallenges.map((ch) => {
                    const idx = challenges.indexOf(ch);
                    const done = completedIds.includes(ch.id);
                    const active = idx === currentChallengeIdx;
                    return (
                      <li key={ch.id}>
                        <button
                          onClick={() => handleSelect(idx)}
                          className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${
                            active
                              ? "bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/30"
                              : "text-stone-400 hover:bg-stone-900 hover:text-stone-200"
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] shrink-0 ${
                            done ? "bg-emerald-500/20 text-emerald-300" : active ? "bg-amber-500/20 text-amber-300" : "bg-stone-800 text-stone-500"
                          }`}>
                            {done ? <Check size={10} /> : ch.id.split(".")[1]}
                          </span>
                          <span className="truncate">{ch.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!layer.unlocked && (
                <div className="px-3 pb-3 text-[11px] text-stone-600 italic">This vein runs deeper — keep mining.</div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 space-y-1.5">
        {onExport && (
          <button
            onClick={onExport}
            className="w-full text-[11px] text-stone-400 hover:text-stone-100 border border-stone-800 hover:border-stone-600 rounded px-2 py-1.5 transition-colors inline-flex items-center justify-center gap-1.5"
            title="Copy a JSON snapshot of your progress."
          >
            <Download size={11} /> Export progress
          </button>
        )}
        {onImport && (
          <button
            onClick={onImport}
            className="w-full text-[11px] text-stone-400 hover:text-stone-100 border border-stone-800 hover:border-stone-600 rounded px-2 py-1.5 transition-colors inline-flex items-center justify-center gap-1.5"
            title="Paste a progress snapshot to restore."
          >
            <Upload size={11} /> Import progress
          </button>
        )}
        {onResetProgress && (
          <button
            onClick={onResetProgress}
            className="w-full text-[11px] text-stone-500 hover:text-rose-300 border border-stone-800 hover:border-rose-500/40 rounded px-2 py-1.5 transition-colors"
            title="Wipe all gems, completed challenges, and persisted progress."
          >
            Reset progress
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — persistent flex column. Hidden below md. */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-stone-800 bg-stone-950/60 p-4 overflow-y-auto flex-col">
        {body}
      </aside>

      {/* Mobile drawer — overlay + slide-in panel. Rendered only when open so
          the off-screen DOM doesn't intercept taps on the main view. */}
      {isOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside
            className="md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-stone-950 border-r border-stone-800 p-4 overflow-y-auto flex flex-col shadow-2xl"
            role="dialog"
            aria-label="Layer map"
          >
            {body}
          </aside>
        </>
      )}
    </>
  );
}
