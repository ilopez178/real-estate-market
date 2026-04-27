import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { STATES } from '../utils/stateData';

interface Props {
  selectedCode: string;
  onSelect: (code: string) => void;
  onGeolocate: () => void;
  geolocating: boolean;
}

export default function StateSelector({ selectedCode, onSelect, onGeolocate, geolocating }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = STATES.find(s => s.code === selectedCode);
  const filtered = STATES.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.code.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(code: string) {
    onSelect(code);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 bg-[#111111] border border-[#333333] rounded-md px-4 py-2 text-sm font-medium text-[#c8c8c8] hover:border-[#0ea5e9] transition-colors min-w-[200px]"
        >
          <span className="flex-1 text-left">{selected?.name ?? 'Select a state'}</span>
          <ChevronDown className={`w-4 h-4 text-[#6b7280] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-[#111111] border border-[#333333] rounded-lg shadow-md overflow-hidden">
            <div className="p-2 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2 bg-[#1a1a1a] rounded px-2 py-1">
                <Search className="w-3.5 h-3.5 text-[#6b7280] flex-shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search state…"
                  className="flex-1 bg-transparent text-sm outline-none text-[#c8c8c8] placeholder-[#4b5563]"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[#6b7280]">No results</div>
              ) : (
                filtered.map(s => (
                  <button
                    key={s.code}
                    onClick={() => handleSelect(s.code)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${s.code === selectedCode ? 'bg-[#0ea5e9] text-white' : 'text-[#c8c8c8] hover:bg-[#1a1a1a]'}`}
                  >
                    <span className="font-mono text-xs w-6 opacity-60">{s.code}</span>
                    {s.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onGeolocate}
        disabled={geolocating}
        className="flex items-center gap-1.5 text-sm text-[#0ea5e9] hover:text-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <MapPin className="w-4 h-4" />
        {geolocating ? 'Detecting…' : 'Use my location'}
      </button>
    </div>
  );
}
