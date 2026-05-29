import { Lock, Check, Pickaxe } from 'lucide-react';

export function LayerMap({ layers, challenges, currentChallengeIdx, completedIds, onSelectChallenge, onResetProgress }) {
  return (
    <aside className="w-64 shrink-0 border-r border-stone-800 bg-stone-950/60 p-4 overflow-y-auto flex flex-col">
      <div className="text-xs uppercase tracking-widest text-stone-500 mb-3">The Mine</div>
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
                          onClick={() => onSelectChallenge(idx)}
                          className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${
                            active
                              ? "bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/30"
                              : "text-stone-400 hover:bg-stone-900 hover:text-stone-200"
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${
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
      {onResetProgress && (
        <button
          onClick={onResetProgress}
          className="mt-4 text-[11px] text-stone-500 hover:text-rose-300 border border-stone-800 hover:border-rose-500/40 rounded px-2 py-1.5 transition-colors"
          title="Wipe all gems, completed challenges, and persisted progress."
        >
          Reset progress
        </button>
      )}
    </aside>
  );
}
