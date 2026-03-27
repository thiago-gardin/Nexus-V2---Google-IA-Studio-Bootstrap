import React, { useState, useEffect, useRef } from 'react';
import { ENTITY_STYLES } from '../config/cockpit.config';

export function SearchPanel() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    if (!open) { setQuery(''); setResults(null); }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/search?q=' + encodeURIComponent(query));
        setResults(await r.json());
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-start
      justify-center pt-24" onClick={() => setOpen(false)}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl
        w-full max-w-xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center gap-3 px-4 py-3
          border-b border-zinc-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#52525b" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input ref={inputRef}
            className="flex-1 bg-transparent text-zinc-100 text-sm
              outline-none placeholder-zinc-600"
            placeholder="Search entities, relations, events..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {loading && <div className="w-3 h-3 border border-zinc-600
            border-t-zinc-300 rounded-full animate-spin"/>}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {results && results.total === 0 && query.length >= 2 && (
            <div className="px-4 py-6 text-center text-zinc-600 text-sm">
              No results for "{query}"
            </div>
          )}

          {results?.entities?.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-[10px] font-bold
                text-zinc-600 uppercase tracking-widest">
                Entities · {results.entities.length}
              </div>
              {results.entities.map((e: any) => (
                <div key={e.id} onClick={() => setOpen(false)}
                  className="px-4 py-2 hover:bg-zinc-900 cursor-pointer
                    flex items-center gap-3">
                  <span className="text-[10px] px-1.5 py-0.5 rounded
                    font-bold uppercase"
                    style={{
                      background: (ENTITY_STYLES[e.entity_type]?.bg || '#3f3f46') + '20',
                      color: ENTITY_STYLES[e.entity_type]?.text || '#a1a1aa'
                    }}>
                    {e.entity_type}
                  </span>
                  <span className="text-sm text-zinc-200 flex-1">
                    {e.label}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {e.domain_name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {results?.relations?.length > 0 && (
            <div className="py-2 border-t border-zinc-900">
              <div className="px-4 py-1 text-[10px] font-bold
                text-zinc-600 uppercase tracking-widest">
                Relations · {results.relations.length}
              </div>
              {results.relations.map((r: any) => (
                <div key={r.id} onClick={() => setOpen(false)}
                  className="px-4 py-2 hover:bg-zinc-900 cursor-pointer
                    flex items-center gap-3">
                  <span className="text-[10px] font-mono text-indigo-400
                    bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    {r.relation_type}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {r.domain_name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {results?.events?.length > 0 && (
            <div className="py-2 border-t border-zinc-900">
              <div className="px-4 py-1 text-[10px] font-bold
                text-zinc-600 uppercase tracking-widest">
                Events · {results.events.length}
              </div>
              {results.events.map((e: any) => (
                <div key={e.id} onClick={() => setOpen(false)}
                  className="px-4 py-2 hover:bg-zinc-900 cursor-pointer
                    flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase
                    text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {e.event_type}
                  </span>
                  <span className="text-xs text-zinc-400 truncate">
                    {e.reason}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-zinc-900
          flex gap-4 text-[10px] text-zinc-700 font-mono">
          <span>↵ select</span>
          <span>esc close</span>
          <span>⌘K toggle</span>
        </div>
      </div>
    </div>
  );
}
