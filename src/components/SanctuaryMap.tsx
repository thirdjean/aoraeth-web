import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Wind, Sun, CloudRain, Droplets, Leaf, Anchor, BookOpen, 
  Maximize, Minimize, RefreshCw, Plug, Clock, Hammer, Target, Layers,
  Snowflake, AlertCircle, Archive, Magnet, Plus, Sprout, Search, X, 
  Grid as GridIcon, CheckCircle2, ChevronDown, ChevronUp, Eye, EyeOff,
  Camera, Circle as CircleIcon, Square, Pencil, Moon, Star, Mountain, Tent, 
  Trees, Flag, Compass, Download, Dumbbell, Briefcase, Zap, List, Calendar,
  Focus, Upload, History, CheckSquare, LayoutList
} from 'lucide-react';
import { Node, Edge, LogEntry, NodeType, NodeStatus, Root } from '../types/schema';
import { StorageService } from '../services/storage';
import { calculateFlow } from '../utils/flow';
import { getDockingPoint, getNodeDimensions } from '../utils/geometry';
import { SeedBank } from './SeedBank';

// --- VISUAL CONSTANTS (ELEGANT GREEN) ---
const THEME = {
  active: {
    bg: "bg-[#F2F7F4]", 
    bed: "bg-[#E6F4EA] border-[#A7D7C5]", 
    bedBody: "bg-[#E6F4EA]",
    plant: "text-[#374151]", 
    line: "#10B981", 
    watermark: "text-[#10B981]",
  },
  dormant: {
    bed: "bg-slate-100 border-slate-300",
    plant: "text-slate-500",
    line: "#94A3B8",
    watermark: "text-slate-300",
  },
  roots: {
    bg: "bg-[#78716C]", 
    text: "text-[#F5F5F4]", 
    border: "border-[#78716C]"
  }
};

const ICONS: Record<string, React.ReactNode> = {
  Sun: <Sun size={24} />, Moon: <Moon size={24} />, Star: <Star size={24} />,
  Wind: <Wind size={24} />, CloudRain: <CloudRain size={24} />, Mountain: <Mountain size={24} />,
  Tent: <Tent size={24} />, Trees: <Trees size={24} />, Flag: <Flag size={24} />,
  Compass: <Compass size={24} />, Target: <Target size={24} />, Anchor: <Anchor size={24} />,
  Hammer: <Hammer size={24} />, Briefcase: <Briefcase size={24} />, Dumbbell: <Dumbbell size={24} />
};

const LIBRARY_COURSES = [
  { id: 'lib1', label: "Intro to Machine Learning", type: 'source', category: 'course' },
  { id: 'lib2', label: "React Advanced Patterns", type: 'source', category: 'course' },
  { id: 'lib3', label: "UX Research Fundamentals", type: 'source', category: 'course' },
  { id: 'lib4', label: "Professional Scrum Master", type: 'source', category: 'course' },
];

const LargeIcon: React.FC<{ iconKey?: string, size?: number, colorClass?: string }> = ({ iconKey, size = 80, colorClass = "" }) => {
  if (!iconKey || !ICONS[iconKey]) return <Leaf size={size} className={colorClass} />;
  const IconComponent = (ICONS[iconKey] as React.ReactElement<any>).type as React.FC<any>;
  return <IconComponent size={size} className={colorClass} />;
};

const formatTime = (minutes: number) => {
   if (!minutes || minutes < 1) return "0h";
   return `${(minutes / 60).toFixed(1).replace('.0', '')}h`;
};

// --- SUB-COMPONENTS ---

const RootFooter: React.FC<{ roots: Root[], expanded: boolean, onToggle: () => void, isRound?: boolean }> = ({ roots, expanded, onToggle, isRound }) => {
  const activeRoots = roots.filter(r => r.label.trim() !== "" || (r.hours && r.hours > 0));
  if (activeRoots.length === 0) return null;
  const totalHours = activeRoots.reduce((acc, curr) => acc + (curr.hours || 0), 0);

  if (isRound) {
    return (
      <div className="absolute top-[95%] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center min-w-[140px] transition-all duration-300" onDoubleClick={e => e.stopPropagation()}>
        <div className="w-px h-3 bg-stone-400"></div>
        <div className={`overflow-hidden shadow-lg rounded-lg ${THEME.roots.bg}`}>
          <div onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`w-full h-8 flex items-center justify-between px-3 cursor-pointer ${THEME.roots.text} hover:brightness-110 transition-colors font-sans`}>
             <div className="flex items-center gap-2 pointer-events-none">
                <Sprout size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Roots ({totalHours}h)</span>
             </div>
             {expanded ? <ChevronDown size={12} className="pointer-events-none" /> : <ChevronUp size={12} className="pointer-events-none" />}
          </div>
          {expanded && (
             <div className={`w-full px-2 pb-2 text-[#F5F5F4] animate-in slide-in-from-top-2 duration-200 border-t border-white/10`}>
                <div className="space-y-1 pt-2">
                   {activeRoots.map(root => (
                      <div key={root.id} className="flex items-center gap-2 px-2 py-1 rounded bg-black/20 text-left font-sans">
                         <CheckCircle2 size={10} className="text-yellow-400 shrink-0" />
                         <span className="text-[9px] font-medium truncate flex-1 font-sans">{root.label}</span>
                         <span className="text-[9px] opacity-70 font-mono">{root.hours}h</span>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
     <div className="w-full transition-all duration-300 ease-in-out border-t-0" onDoubleClick={e => e.stopPropagation()}>
        <div onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`w-full h-8 flex items-center justify-between px-3 cursor-pointer ${THEME.roots.bg} ${THEME.roots.text} hover:brightness-110 transition-colors font-sans border-x-2 border-b-2 ${THEME.roots.border} ${expanded ? 'rounded-b-none border-b-0' : 'rounded-b-xl'}`}>
           <div className="flex items-center gap-2 pointer-events-none">
              <Sprout size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Roots ({totalHours}h)</span>
           </div>
           {expanded ? <ChevronDown size={12} className="pointer-events-none" /> : <ChevronUp size={12} className="pointer-events-none" />}
        </div>
        {expanded && (
           <div className={`w-full px-2 pb-2 text-[#F5F5F4] bg-[#78716C] border-x-2 border-b-2 ${THEME.roots.border} rounded-b-xl -mt-[2px]`}>
              <div className="h-px w-full bg-white/20 mb-2"></div>
              <div className="space-y-1">
                 {activeRoots.map(root => (
                    <div key={root.id} className="flex items-center gap-2 px-2 py-1 rounded bg-black/20 text-left font-sans">
                       <CheckCircle2 size={10} className="text-yellow-400 shrink-0" />
                       <span className="text-[9px] font-medium truncate flex-1 font-sans">{root.label}</span>
                       <span className="text-[9px] opacity-70 font-mono">{root.hours}h</span>
                    </div>
                 ))}
              </div>
           </div>
        )}
     </div>
  );
};

const EditNodePopover: React.FC<{ node: Node, onClose: () => void, onUpdate: (id: string, data: Partial<Node>) => void }> = ({ node, onClose, onUpdate }) => {
   const [newRootLabel, setNewRootLabel] = useState("");
   const [newRootHours, setNewRootHours] = useState<number | "">("");
   const handleRootChange = (id: string, data: Partial<Root>) => { const updatedRoots = (node.meta?.roots || []).map(r => r.id === id ? { ...r, ...data } : r); onUpdate(node.id, { meta: { ...node.meta, roots: updatedRoots } }); };
   const handleNewRoot = (label: string, hours: number | "") => { if (label.trim() !== "" && typeof hours === 'number' && hours > 0) { const newRoot = { id: `r-${Date.now()}`, label, hours }; const updatedRoots = [...(node.meta?.roots || []), newRoot]; onUpdate(node.id, { meta: { ...node.meta, roots: updatedRoots } }); setNewRootLabel(""); setNewRootHours(""); } };
   const removeRoot = (id: string) => { const updatedRoots = (node.meta?.roots || []).filter(r => r.id !== id); onUpdate(node.id, { meta: { ...node.meta, roots: updatedRoots } }); };

   return (
      <div className="absolute z-[200] top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 flex flex-col gap-4 animate-in zoom-in-95 cursor-auto text-slate-800 font-sans shadow-2xl" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
         <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest font-sans">Label</label><input type="text" value={node.label} onChange={(e) => onUpdate(node.id, { label: e.target.value })} className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 font-sans" /></div>
         
         <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest font-sans">Debug Hours (Override)</label>
            <div className="grid grid-cols-4 gap-1">
               {['D', 'W', 'M', 'Y'].map(range => (
                  <div key={range} className="flex flex-col gap-0.5">
                     <span className="text-[8px] text-center text-slate-400 font-bold">{range}</span>
                     <input type="number" value={node.meta?.debugHours?.[range as any] || ""} onChange={(e) => onUpdate(node.id, { meta: { ...node.meta, debugHours: { ...node.meta?.debugHours, [range]: Number(e.target.value) } } })} className="w-full text-[10px] p-1 border rounded bg-slate-50 text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-sans" placeholder="0" />
                  </div>
               ))}
            </div>
         </div>

         <div className="space-y-1 font-sans"><label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest font-sans">Definition of Done</label><textarea value={node.meta?.description || ""} onChange={(e) => onUpdate(node.id, { meta: { ...node.meta, description: e.target.value } })} className="w-full text-xs p-2 border border-slate-200 rounded resize-none h-16 bg-white text-slate-800 font-sans" /></div>
         {(node.type === 'hub' || node.type === 'bed') && (
           <div className="space-y-2 border-t pt-2 mt-1 font-sans text-slate-800">
              <label className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1 font-sans"><Sprout size={10} /> Historical Roots</label>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1 font-sans">
                {(node.meta?.roots || []).map(r => (
                  <div key={r.id} className="flex gap-1 font-sans"><input value={r.label} onChange={e => handleRootChange(r.id, { label: e.target.value })} className="flex-1 text-[10px] p-1 border rounded bg-slate-50 text-slate-800 font-sans" /><input type="number" value={r.hours} onChange={e => handleRootChange(r.id, { hours: Number(e.target.value) })} className="w-10 text-[10px] p-1 border rounded bg-slate-50 text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-sans" /><button onClick={() => removeRoot(r.id)} className="p-1 text-red-400 hover:text-red-600 transition-colors font-sans"><X size={10} /></button></div>
                ))}
                <div className="flex gap-1 mt-1 border-t pt-1 font-sans"><input placeholder="New Name..." value={newRootLabel} onChange={e => { setNewRootLabel(e.target.value); handleNewRoot(e.target.value, newRootHours); }} className="flex-1 text-[10px] p-1 border border-dashed rounded bg-emerald-50/30 text-slate-800 font-sans" /><input type="number" placeholder="hrs" value={newRootHours} onChange={e => { const val = e.target.value === "" ? "" : Number(e.target.value); setNewRootHours(val); handleNewRoot(newRootLabel, val); }} className="w-10 text-[10px] p-1 border border-dashed rounded bg-emerald-50/30 text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-sans" /></div>
              </div>
           </div>
         )}
         <div className="space-y-1 border-t pt-2 mt-1 font-sans"><label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest font-sans">Symbol</label><div className="grid grid-cols-6 gap-1 font-sans">{Object.keys(ICONS).map(key => (<button key={key} onClick={() => onUpdate(node.id, { icon_key: key })} className={`p-1 rounded hover:bg-slate-100 flex justify-center ${node.icon_key === key ? 'bg-blue-50 text-blue-500' : 'text-slate-500'} font-sans`}>{React.cloneElement(ICONS[key] as React.ReactElement<any>, { size: 14 })}</button>))}</div></div>
      </div>
   );
};

const DoneLog: React.FC<{ isOpen: boolean, logs: LogEntry[], onToggle: () => void, onDragStart: (e: React.DragEvent, course: string) => void }> = ({ isOpen, logs, onToggle, onDragStart }) => {
   const [search, setSearch] = useState("");
   const [groupBy, setGroupBy] = useState<'course' | 'date'>('course');
   const [showSearch, setShowSearch] = useState(false);
   
   const groupedLogs = useMemo(() => {
      const groups: Record<string, any> = {};
      const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      sorted.forEach(log => {
         if (!log.task_name.toLowerCase().includes(search.toLowerCase()) && !log.course_name?.toLowerCase().includes(search.toLowerCase())) return;
         
         if (groupBy === 'course') {
            const course = log.course_name || "Uncategorized";
            const series = log.series_name || "General";
            if (!groups[course]) groups[course] = {};
            if (!groups[course][series]) groups[course][series] = [];
            groups[course][series].push(log);
         } else {
            const date = new Date(log.timestamp).toLocaleDateString('en-CA');
            if (!groups[date]) groups[date] = [];
            groups[date].push(log);
         }
      });
      return groups;
   }, [logs, search, groupBy]);

   return (
      <div className={`absolute top-0 right-0 h-full w-80 bg-slate-50 border-l border-slate-200 shadow-xl transition-transform duration-300 z-[100] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white/50">
            <div><h2 className="text-lg font-serif italic text-slate-800">Done</h2><p className="text-xs text-slate-400 mt-1">Timeline</p></div>
            <div className="flex gap-1 items-center">
               <button onClick={() => setGroupBy(groupBy === 'course' ? 'date' : 'course')} className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600" title={groupBy === 'course' ? "Group by Date" : "Group by Course"}>{groupBy === 'course' ? <LayoutList size={16} /> : <Calendar size={16} />}</button>
               <button onClick={() => setShowSearch(!showSearch)} className={`p-2 rounded-full transition-colors ${showSearch ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-slate-200 text-slate-400'}`}><Search size={16} /></button>
               <button onClick={onToggle} className="p-2 rounded-full hover:bg-slate-200 transition-colors ml-1"><X size={16} className="text-slate-500" /></button>
            </div>
         </div>
         {showSearch && (
            <div className="px-4 py-2 bg-white border-b border-slate-100 animate-in slide-in-from-top-2 duration-200">
               <input autoFocus type="text" placeholder="Search activities..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-emerald-400 bg-white text-slate-800" />
            </div>
         )}
         <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {groupBy === 'course' ? (
               Object.entries(groupedLogs).map(([course, seriesGroup]) => (
                  <div key={course} className="space-y-2">
                     <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-white p-1.5 rounded-lg group shadow-sm bg-white/30" draggable onDragStart={(e) => onDragStart(e, course)}>
                        <Anchor size={12} className="text-slate-400 group-hover:text-emerald-500" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 group-hover:text-emerald-700">{course}</h3>
                     </div>
                     {Object.entries(seriesGroup as any).map(([series, items]) => (
                        <div key={series} className="pl-2 border-l-2 border-slate-200">
                           {series !== 'General' && <h4 className="text-[10px] font-bold text-slate-500 mb-1 ml-1">{series}</h4>}
                           <div className="space-y-1">
                              {(items as LogEntry[]).map(log => (
                                 <div key={log.id} className="p-2 bg-white rounded border border-slate-100 shadow-sm flex justify-between items-start">
                                    <div><p className="text-[10px] font-medium text-slate-700">{log.task_name}</p><p className="text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</p></div>
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{log.duration_minutes}m</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
               ))
            ) : (
               Object.entries(groupedLogs).map(([date, items]) => (
                  <div key={date} className="space-y-2">
                     <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2"><Calendar size={10} /> {date}</h3>
                     <div className="space-y-1">
                        {(items as LogEntry[]).map(log => (
                           <div key={log.id} className="p-2 bg-white rounded border border-slate-100 shadow-sm flex justify-between items-start">
                              <div>
                                 <p className="text-[10px] font-medium text-slate-700">{log.task_name}</p>
                                 {log.course_name && <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-tighter">{log.course_name}</p>}
                              </div>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{log.duration_minutes}m</span>
                           </div>
                        ))}
                     </div>
                  </div>
               ))
            )}
            {logs.length === 0 && <div className="text-center text-xs text-slate-400 italic mt-10">No logs found.</div>}
         </div>
      </div>
   );
};

const PlugHandle: React.FC<{ onMouseDown: (e: React.MouseEvent) => void, position: string, color?: string, style?: React.CSSProperties }> = ({ onMouseDown, position, color = "bg-slate-800", style }) => (
   <div onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e); }} className={`absolute ${position} w-5 h-5 left-1/2 -translate-x-1/2 rounded-full ${color} text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-125 cursor-crosshair shadow-md z-[100] pointer-events-auto`} style={style}><Plug size={10} /></div>
);

const DeleteButton: React.FC<{ onClick: (e: React.MouseEvent) => void, position: string }> = ({ onClick, position }) => (
  <button onClick={(e) => { e.stopPropagation(); onClick(e); }} className={`absolute ${position} p-1 bg-white text-slate-400 hover:bg-red-500 hover:text-white rounded-full shadow-md border border-slate-100 opacity-0 group-hover:opacity-100 transition-all z-[60] font-sans`}><X size={10} /></button>
);

const QuickAddModal: React.FC<{ position: {x: number, y: number}, onSelect: (type: NodeType, data?: any) => void }> = ({ position, onSelect }) => {
  const [view, setView] = useState<'main' | 'resource'>('main');
  const [search, setSearch] = useState("");
  const filteredResources = LIBRARY_COURSES.filter(c => c.label.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="absolute z-[200] bg-white rounded-xl shadow-2xl border border-slate-200 p-2 flex flex-col gap-1 w-48 animate-in zoom-in-95 text-slate-800 font-sans" style={{ left: position.x, top: position.y }} onMouseDown={(e) => e.stopPropagation()}>
      {view === 'main' ? (
        <><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 font-sans">Add...</p><button onClick={() => onSelect('bed')} className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg text-xs font-bold text-blue-700 flex items-center gap-2 font-sans"><Square size={14} /> Goal</button><button onClick={() => setView('resource')} className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700 flex items-center justify-between font-sans"><div className="flex items-center gap-2 font-sans"><Anchor size={14} /> Resource</div><ChevronDown size={12} /></button></>
      ) : (
        <><div className="flex items-center gap-2 px-2 py-1 font-sans"><button onClick={() => setView('main')} className="p-1 hover:bg-slate-100 rounded font-sans"><X size={12} /></button><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Select Resource</p></div><input autoFocus type="text" placeholder="Search courses..." className="mx-2 my-1 text-[10px] p-1.5 border border-slate-100 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans text-slate-800" value={search} onChange={(e) => setSearch(e.target.value)} /><div className="max-h-40 overflow-y-auto font-sans">{filteredResources.map(r => (<button key={r.id} onClick={() => onSelect('source', r)} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-[10px] font-medium border-b border-slate-50 last:border-0 truncate font-sans">{r.label}</button>))}<button onClick={() => onSelect('source', { label: search || "New Passive", category: 'spring', capacity: 10 })} className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-[10px] font-bold text-emerald-600 italic font-sans">+ Create Passive "{search}"</button></div></>
      )}
    </div>
  );
};

export const SanctuaryMap: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
  const [seedItems, setSeedItems] = useState([
    { id: 'h1', label: "Learn Rust", type: 'plant', days: 45, tag: "Skill" },
    { id: 'h2', label: "Marathon Training", type: 'bed', days: 60, tag: "Goal" },
  ]);
  const [showSeedBank, setShowSeedBank] = useState(false);
  const [showDoneLog, setShowDoneLog] = useState(false);
  const [visibilityMode, setVisibilityMode] = useState<0 | 1 | 2>(() => {
    const stored = localStorage.getItem('lt_visibilityMode');
    return stored ? Number(stored) as 0|1|2 : 0; 
  });
  const [viewState, setViewState] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null); 
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedRoots, setExpandedRoots] = useState<Record<string, boolean>>({});
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [timeRange, setTimeRange] = useState<'D' | 'W' | 'M' | 'Y' | 'Custom'>('M');
  const [customDateRange, setCustomDateRange] = useState<{start: string, end: string}>({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
  const [magnetMode, setMagnetMode] = useState(false);
  const [snapshotMode, setSnapshotMode] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [linking, setLinking] = useState<{ sourceId: string, startX: number, startY: number, currentX: number, currentY: number, socket: 'top'|'bottom' } | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState<{x: number, y: number, sourceId?: string} | null>(null);
  const [flashingNode, setFlashingNode] = useState<string | null>(null);

  const saveHistory = useCallback(() => { setHistory(prev => { const newHistory = [...prev, { nodes, edges }]; if (newHistory.length > 20) return newHistory.slice(1); return newHistory; }); }, [nodes, edges]);
  const undo = useCallback(() => { setHistory(prev => { if (prev.length === 0) return prev; const lastState = prev[prev.length - 1]; setNodes(lastState.nodes); setEdges(lastState.edges); return prev.slice(0, -1); }); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode && !editingNode) { if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { saveHistory(); deleteNode(selectedNode); } }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Control') setIsCtrlPressed(false); };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [selectedNode, editingNode, undo, saveHistory]);

  const INITIAL_NODES: Node[] = useMemo(() => [
    { id: 'g1', type: 'hub', x: 600, y: 100, label: "Life Lived Well", status: 'active', icon_key: 'Sun', meta: { description: "Overall life satisfaction", roots: [{id: 'r1', label: '2025 Retrospective', hours: 40}] } },
    { id: 's1', type: 'bed', x: 200, y: 350, label: "One Day Work Week", status: 'active', icon_key: 'Mountain', meta: { description: "Freedom and efficiency" } },
    { id: 's2', type: 'bed', x: 600, y: 350, label: "Arts & Creation", status: 'active', icon_key: 'Trees', meta: { description: "Self expression" } },
    { id: 's3', type: 'bed', x: 1000, y: 350, label: "Good Times & Memories", status: 'dormant', icon_key: 'Tent' },
    { id: 's1-1', type: 'bed', x: 100, y: 650, label: "Financial Freedom", status: 'active', icon_key: 'Target' },
    { id: 's1-2', type: 'bed', x: 300, y: 650, label: "Location Independence", status: 'active', icon_key: 'Compass' },
    { id: 'm1', type: 'plant', x: 600, y: 650, label: "Create Illustration Book", status: 'active' },
    { id: 'r1', type: 'source', x: 100, y: 900, label: "My Day Job", status: 'active', meta: { category: 'spring', capacity: 40 }, icon_key: 'Briefcase' },
    { id: 'r2', type: 'source', x: 300, y: 900, label: "Passive Income Stream", status: 'active', meta: { category: 'spring', capacity: 5 } },
    { id: 'r3', type: 'source', x: 600, y: 900, label: "Domestika: Illustration", status: 'active', meta: { category: 'course', capacity: 10 } },
  ], []);

  const INITIAL_EDGES: Edge[] = useMemo(() => [
    { source_id: 'r1', target_id: 's1-1', weight: 3, type: 'active_stream' }, { source_id: 'r2', target_id: 's1-1', weight: 1, type: 'active_stream' }, { source_id: 'r3', target_id: 'm1', weight: 2, type: 'active_stream' }, { source_id: 's1-1', target_id: 's1', weight: 3, type: 'active_stream' }, { source_id: 's1-2', target_id: 's1', weight: 2, type: 'active_stream' }, { source_id: 'm1', target_id: 's2', weight: 3, type: 'active_stream' }, { source_id: 's1', target_id: 'g1', weight: 3, type: 'active_stream' }, { source_id: 's2', target_id: 'g1', weight: 2, type: 'active_stream' }, { source_id: 's3', target_id: 'g1', weight: 1, type: 'active_stream' },
  ], []);

  const INITIAL_LOGS: LogEntry[] = useMemo(() => {
     const now = Date.now();
     const day = 86400000;
     return [
        { id: '1', node_id: 'r1', node_type: 'item', task_name: 'Chapter 1.1: Computing', course_name: 'CS50', series_name: 'Week 1', duration_minutes: 60, elapsed_minutes: 60, status: 'completed', platform: 'Other', type: 'project', timestamp: new Date(now).toISOString() }, 
        { id: '2', node_id: 'r1', node_type: 'item', task_name: 'Chapter 1.2: Variables', course_name: 'CS50', series_name: 'Week 1', duration_minutes: 120, elapsed_minutes: 120, status: 'completed', platform: 'Other', type: 'project', timestamp: new Date(now - day * 2).toISOString() }, 
        { id: '3', node_id: 'r1', node_type: 'item', task_name: 'Problem Set 1', course_name: 'CS50', series_name: 'Week 1', duration_minutes: 180, elapsed_minutes: 180, status: 'completed', platform: 'Other', type: 'project', timestamp: new Date(now - day * 10).toISOString() }, 
        { id: '4', node_id: 'r1', node_type: 'item', task_name: 'Lecture 2', course_name: 'CS50', series_name: 'Week 2', duration_minutes: 120, elapsed_minutes: 120, status: 'completed', platform: 'Other', type: 'project', timestamp: new Date(now - day * 40).toISOString() }, 
        { id: '5', node_id: 'r2', node_type: 'item', task_name: 'Monthly Salary Input', course_name: 'Finance', series_name: 'Q1', duration_minutes: 2400, elapsed_minutes: 2400, status: 'completed', platform: 'Other', type: 'project', timestamp: new Date(now - day * 2).toISOString() }, 
        { id: '6', node_id: 'r3', node_type: 'item', task_name: 'Pottery Basics', course_name: 'Domestika', series_name: 'Intro', duration_minutes: 45, elapsed_minutes: 45, status: 'completed', platform: 'Other', type: 'project', timestamp: new Date(now - day * 10).toISOString() }, 
        { id: '7', node_id: 'm1', node_type: 'item', task_name: 'Built Scraper V1', course_name: 'Side Project', series_name: 'MVP', duration_minutes: 120, elapsed_minutes: 120, status: 'completed', platform: 'Other', type: 'project', timestamp: new Date(now).toISOString() },
     ];
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const storedNodes = await StorageService.loadNodes(); const storedEdges = await StorageService.loadEdges();
      const finalNodes = storedNodes.length > 0 ? storedNodes : INITIAL_NODES;
      setNodes(finalNodes); setEdges(storedEdges.length > 0 ? storedEdges : INITIAL_EDGES); setLogs(INITIAL_LOGS);
      setTimeout(() => centerOnGraph(finalNodes), 100);
    };
    loadData();
  }, [INITIAL_NODES, INITIAL_EDGES, INITIAL_LOGS]);

  const centerOnGraph = useCallback((nodesToCenter: Node[]) => {
    if (nodesToCenter.length === 0) return;
    const padding = 150;
    const minX = Math.min(...nodesToCenter.map(n => n.x)) - padding; const maxX = Math.max(...nodesToCenter.map(n => n.x)) + padding;
    const minY = Math.min(...nodesToCenter.map(n => n.y)) - padding; const maxY = Math.max(...nodesToCenter.map(n => n.y)) + padding;
    
    let availableWidth = window.innerWidth;
    if (showSeedBank) availableWidth -= 256; 
    if (showDoneLog) availableWidth -= 320; 
    
    const zoom = Math.min(Math.min(availableWidth / (maxX - minX), window.innerHeight / (maxY - minY)), 1);
    let shiftX = 0;
    if (showSeedBank) shiftX -= 128;
    if (showDoneLog) shiftX -= 160;

    setViewState({ zoom, x: (window.innerWidth / 2) + shiftX - ((minX + maxX) / 2) * zoom, y: window.innerHeight / 2 - ((minY + maxY) / 2) * zoom });
  }, [showSeedBank, showDoneLog]);

  const { nodeInflows, edgeFlows } = useMemo(() => { 
     return calculateFlow(nodes, edges, logs, timeRange as any, customDateRange); 
  }, [nodes, edges, logs, timeRange, customDateRange]);

  useEffect(() => { if (nodes.length > 0) StorageService.saveNodes(nodes); }, [nodes]);
  useEffect(() => { if (edges.length > 0) StorageService.saveEdges(edges); }, [edges]);
  useEffect(() => { localStorage.setItem('lt_visibilityMode', String(visibilityMode)); }, [visibilityMode]);

  useEffect(() => {
    if (editingNode) {
      const node = nodes.find(n => n.id === editingNode);
      if (node) {
        const popoverHeight = 450; const nodeBottomScreen = node.y * viewState.zoom + viewState.y + 100;
        if (nodeBottomScreen + popoverHeight > window.innerHeight - 50) { setViewState(prev => ({ ...prev, y: prev.y - ((nodeBottomScreen + popoverHeight) - (window.innerHeight - 50)) })); }
      }
    }
  }, [editingNode, viewState.zoom, viewState.y, nodes]);

  const getPassiveAncestors = useCallback((nodeId: string) => {
    const ancestors = new Set<string>();
    const stack = [nodeId];
    while(stack.length > 0) {
      const current = stack.pop()!;
      edges.filter(e => e.target_id === current).forEach(e => {
        const sourceNode = nodes.find(n => n.id === e.source_id);
        if (sourceNode?.meta?.category === 'spring') { ancestors.add(sourceNode.id); }
        stack.push(e.source_id);
      });
    }
    return ancestors;
  }, [edges, nodes]);

  const getNodeLastActivity = useCallback((nodeId: string, label: string) => {
    const nodeLogs = logs.filter(l => l.node_id === nodeId || l.course_name?.toLowerCase() === label.toLowerCase() || l.task_name?.toLowerCase() === label.toLowerCase());
    if (nodeLogs.length === 0) return null;
    const sorted = nodeLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return new Date(sorted[0].timestamp);
  }, [logs]);

  const deleteNode = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (node) { const tag = (node.type === 'hub' || node.type === 'bed') ? 'Goal' : 'Resource'; setSeedItems(prev => [...prev, { id: node.id, label: node.label, type: node.type, days: 30, tag }]); }
    setNodes(prev => prev.filter(n => n.id !== id)); setEdges(prev => prev.filter(e => e.source_id !== id && e.target_id !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  const deleteEdge = (sourceId: string, targetId: string) => { saveHistory(); setEdges(prev => prev.filter(e => !(e.source_id === sourceId && e.target_id === targetId))); };

  const cycleEdgeWeight = (sourceId: string, targetId: string) => {
    const outgoingCount = edges.filter(e => e.source_id === sourceId).length;
    if (outgoingCount <= 1) return;
    saveHistory(); setEdges(prev => prev.map(e => (e.source_id === sourceId && e.target_id === targetId) ? { ...e, weight: ((e.weight % 3) + 1) as any } : e));
  };

  const startLink = (sourceId: string, x: number, y: number, socket: 'top'|'bottom') => { setLinking({ sourceId, startX: x, startY: y, currentX: x, currentY: y, socket }); };

  const finishLink = (targetId: string, droppedSocket: 'top'|'bottom'|'auto') => {
    if (!linking || linking.sourceId === targetId) return;
    const exists = edges.some(e => (e.source_id === linking.sourceId && e.target_id === targetId) || (e.source_id === targetId && e.target_id === linking.sourceId));
    if (exists) { setLinking(null); return; }
    saveHistory();
    let source = linking.sourceId; let target = targetId;
    if (linking.socket === 'top' && droppedSocket === 'bottom') { source = targetId; target = linking.sourceId; } 
    else if (linking.socket === 'bottom' && droppedSocket === 'top') { source = linking.sourceId; target = targetId; }
    setEdges(prev => [...prev, { source_id: source, target_id: target, weight: 2, type: 'active_stream' }]);
    setLinking(null);
  };

  const updateNode = (id: string, data: Partial<Node>) => { setNodes(prev => prev.map(n => n.id === id ? { ...n, ...data } : n)); };

  const handleMouseDown = (e: React.MouseEvent) => { if (editingNode) setEditingNode(null); if (quickAdd) setQuickAdd(null); setSelectedNode(null); setIsDraggingCanvas(true); setLastPos({ x: e.clientX, y: e.clientY }); };
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => { e.stopPropagation(); setSelectedNode(nodeId); setIsDraggingNode(nodeId); setLastPos({ x: e.clientX, y: e.clientY }); };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (linking) { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setLinking({ ...linking, currentX: (e.clientX - rect.left - viewState.x) / viewState.zoom, currentY: (e.clientY - rect.top - viewState.y) / viewState.zoom }); return; }
    if (isDraggingNode) {
      const dx = (e.clientX - lastPos.x) / viewState.zoom; const dy = (e.clientY - lastPos.y) / viewState.zoom;
      setNodes(prev => prev.map(n => n.id === isDraggingNode ? { ...n, x: n.x + dx, y: n.y + dy } : n));
      setLastPos({ x: e.clientX, y: e.clientY });
      return;
    }
    if (isDraggingCanvas) { const dx = e.clientX - lastPos.x; const dy = e.clientY - lastPos.y; setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy })); setLastPos({ x: e.clientX, y: e.clientY }); }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (linking) {
      const isBg = (e.target as HTMLElement).classList.contains('canvas-bg');
      if (isBg) { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setQuickAdd({ x: (e.clientX - rect.left - viewState.x) / viewState.zoom, y: (e.clientY - rect.top - viewState.y) / viewState.zoom, sourceId: linking.sourceId }); }
    }
    if (isDraggingNode) saveHistory();
    setIsDraggingCanvas(false); setIsDraggingNode(null); setLinking(null);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => { if (!(e.target as HTMLElement).classList.contains('canvas-bg')) return; const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setQuickAdd({ x: (e.clientX - rect.left - viewState.x) / viewState.zoom, y: (e.clientY - rect.top - viewState.y) / viewState.zoom }); };

  const handleNodeDoubleClick = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation(); if (editingNode === node.id) { setEditingNode(null); return; }
    if ((e.target as HTMLElement).classList.contains('hit-central') || node.type === 'source' || node.type === 'plant') { setEditingNode(node.id); } 
    else if (node.type === 'hub' || node.type === 'bed') { saveHistory(); updateNode(node.id, { type: node.type === 'hub' ? 'bed' : 'hub' }); }
  };

  const handleCreateNode = (type: NodeType, extraData?: any) => { if (!quickAdd) return; saveHistory(); const newNodeId = `n-${Date.now()}`; setNodes(prev => [...prev, { id: newNodeId, type, x: quickAdd.x, y: quickAdd.y, label: extraData?.label || `New ${type}`, status: 'active', meta: extraData ? { category: extraData.category, capacity: extraData.capacity } : undefined }]); if (quickAdd.sourceId) { setEdges(prev => [...prev, { source_id: quickAdd.sourceId!, target_id: newNodeId, weight: 2, type: 'active_stream' }]); } setQuickAdd(null); };

  const handleSeedDragStart = (e: React.DragEvent, item: any) => { e.dataTransfer.setData("seedItem", JSON.stringify(item)); };
  
  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const seedData = e.dataTransfer.getData("seedItem");
    const doneCourse = e.dataTransfer.getData("doneCourse");
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left - viewState.x) / viewState.zoom;
    const y = (e.clientY - rect.top - viewState.y) / viewState.zoom;

    if (seedData) {
      saveHistory();
      const item = JSON.parse(seedData);
      setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: item.type === 'bed' ? 'bed' : 'plant', x, y, label: item.label, status: 'active' }]);
      setSeedItems(prev => prev.filter(i => i.id !== item.id));
    } else if (doneCourse) {
      const existing = nodes.find(n => n.label.toLowerCase() === doneCourse.toLowerCase());
      if (existing) {
        setFlashingNode(existing.id);
        centerOnGraph(nodes); 
        setTimeout(() => setFlashingNode(null), 3000); 
      } else {
        saveHistory();
        setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'source', x, y, label: doneCourse, status: 'active', meta: { category: 'spring', capacity: 0 } }]);
      }
    }
  };

  const handleDropOnSeedBank = (e: React.DragEvent) => { if (isDraggingNode) { deleteNode(isDraggingNode); setIsDraggingNode(null); } };

  const handleReset = async () => { if (window.confirm("Reset map to defaults?")) { await StorageService.clearAll(); window.location.reload(); } };

  const handleExportCSV = () => {
    try {
      let csv = "type,id,label,x,y,status,meta\n";
      nodes.forEach(n => csv += `node,${n.id},"${n.label}",${n.x},${n.y},${n.status},"${JSON.stringify(n.meta).replace(/"/g, '""')}"\n`);
      edges.forEach(e => csv += `edge,,${e.source_id}->${e.target_id},,,active_stream,${e.weight}\n`);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement('a'));
      link.href = url;
      link.download = `life-map-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    } catch (err) { console.error("Export failed", err); }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newNodes: Node[] = []; const newEdges: Edge[] = [];
      lines.slice(1).forEach(line => {
        if (!line.trim()) return;
        const [type, id, label, x, y, status, metaRaw] = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (type === 'node') {
           newNodes.push({ id, label: label.replace(/"/g, ''), x: Number(x), y: Number(y), status: status as any, type: id.startsWith('g') ? 'hub' : id.startsWith('s') ? 'bed' : id.startsWith('m') ? 'plant' : 'source', meta: JSON.parse(metaRaw.replace(/"/g, '')) });
        } else if (type === 'edge') {
           const [sid, tid] = label.split('->');
           newEdges.push({ source_id: sid, target_id: tid, weight: Number(metaRaw) as any, type: 'active_stream' });
        }
      });
      if (newNodes.length) { setNodes(newNodes); setEdges(newEdges); saveHistory(); }
    };
    reader.readAsText(file);
  };

  const handleDoneDragStart = (e: React.DragEvent, course: string) => {
    e.dataTransfer.setData("doneCourse", course);
  };

  const today = new Date().toLocaleDateString('en-CA');

  return (
    <div className={`w-full h-full relative overflow-hidden select-none ${THEME.active.bg} text-slate-800 font-sans`}>
      <style>{`
        @keyframes border-chase {
          0% { border-color: #f97316; box-shadow: 0 0 10px #fb923c; }
          25% { border-color: #fbbf24; box-shadow: 5px -5px 10px #fcd34d; }
          50% { border-color: #f97316; box-shadow: 0 0 10px #fb923c; }
          75% { border-color: #fbbf24; box-shadow: -5px 5px 10px #fcd34d; }
          100% { border-color: #f97316; box-shadow: 0 0 10px #fb923c; }
        }
        .flash-active {
          animation: border-chase 1s linear infinite;
          border-width: 4px !important;
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none opacity-5 canvas-bg" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '24px 24px', backgroundPosition: `${viewState.x}px ${viewState.y}px` }} />
      <div className={`absolute bottom-4 right-4 pointer-events-none font-serif italic text-4xl opacity-50 z-0 ${snapshotMode ? 'text-slate-600 opacity-80' : 'text-slate-300'}`}>{today}</div>
      
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-50 font-sans">
         <div>
            <h1 className="text-3xl font-serif italic text-slate-800 font-sans">Life Map</h1>
            {!snapshotMode && (
               <div className="flex items-center gap-2 mt-2 pointer-events-auto font-sans">
                  <div className="h-px w-8 bg-slate-300"></div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">Ecosystem</p>
                  <button onClick={() => setMagnetMode(!magnetMode)} className={`ml-4 p-1.5 rounded-md border transition-all ${magnetMode || isCtrlPressed ? 'bg-blue-500 border-blue-600 text-white shadow-md' : 'bg-white/50 border-transparent text-slate-400 hover:text-slate-600'}`} title="Magnet Mode"><Magnet size={14} /></button>
                  <button onClick={() => setNodes(prev => prev.map(n => ({ ...n, x: Math.round(n.x/50)*50, y: Math.round(n.y/50)*50 })))} className="ml-2 p-1.5 rounded-md border bg-white/50 border-transparent text-slate-400 hover:text-slate-600 font-sans" title="Align Grid"><GridIcon size={14} /></button>
                  <button onClick={() => centerOnGraph(nodes)} className="ml-2 p-1.5 rounded-md border bg-white/50 border-transparent text-slate-400 hover:text-slate-600 font-sans" title="Center View"><Focus size={14} /></button>
               </div>
            )}
            {snapshotMode && <p className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans mt-1">Ecosystem</p>}
         </div>
      </div>

      <div className="w-full h-full cursor-grab active:cursor-grabbing canvas-bg relative font-sans" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onDoubleClick={handleCanvasDoubleClick} onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnCanvas}>
        <div style={{ transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.zoom})`, transformOrigin: '0 0' }} className="absolute inset-0 pointer-events-none font-sans">
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible font-sans">
             {edges.map((edge, i) => {
                const startNode = nodes.find(n => n.id === edge.source_id); const endNode = nodes.find(n => n.id === edge.target_id);
                if (!startNode || !endNode) return null;
                const isExpanded = !!expandedRoots[startNode.id];
                const startPoint = getDockingPoint(startNode, endNode, isExpanded); const endPoint = getDockingPoint(endNode, startNode, !!expandedRoots[endNode.id]);
                const flow = edgeFlows[`${edge.source_id}-${edge.target_id}`] || 0;
                const dx = Math.abs(endPoint.x - startPoint.x); const path = `M ${startPoint.x} ${startPoint.y} C ${startPoint.x} ${startPoint.y - dx * 0.5}, ${endPoint.x} ${endPoint.y + dx * 0.5}, ${endPoint.x} ${endPoint.y}`;
                const midX = (startPoint.x + endPoint.x) / 2; const midY = (startPoint.y + endPoint.y) / 2;
                return (
                  <g key={`${edge.source_id}-${edge.target_id}`} className="group/edge pointer-events-auto">
                    <path d={path} stroke="transparent" strokeWidth="20" fill="none" className="cursor-pointer" onClick={() => cycleEdgeWeight(edge.source_id, edge.target_id)} />
                    <path d={path} stroke={flow > 0 ? THEME.active.line : "#D4D4D8"} strokeWidth={edge.weight * 2} fill="none" strokeDasharray={flow > 0 ? "none" : "4, 4"} opacity={flow > 0 ? 1 : 0.4} className="pointer-events-none transition-all duration-75 font-sans" />
                    {visibilityMode > 0 && flow > 0 && (<g transform={`translate(${midX}, ${midY + 12})`} className="pointer-events-none font-sans"><rect x="-14" y="-8" width="28" height="16" rx="4" fill="white" stroke={THEME.active.line} strokeWidth="1" className="shadow-sm" /><text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#475569" className="font-sans">{formatTime(flow)}</text></g>)}
                    {!snapshotMode && (<foreignObject x={midX - 10} y={midY - 10} width={20} height={20}><div className="flex items-center justify-center w-full h-full font-sans"><button onClick={() => deleteEdge(edge.source_id, edge.target_id)} className="w-5 h-5 bg-white text-slate-400 hover:bg-red-500 hover:text-white rounded-full shadow-md border border-slate-100 flex items-center justify-center opacity-0 group-hover/edge:opacity-100 transition-all transform scale-75 hover:scale-100 font-sans font-sans"><X size={10} /></button></div></foreignObject>)}
                  </g>
                );
             })}
             {linking && <line x1={linking.startX} y1={linking.startY} x2={linking.currentX} y2={linking.currentY} stroke={THEME.active.line} strokeWidth="2" strokeDasharray="4,4" className="font-sans" />}
          </svg>
          {nodes.map(node => {
            const isSource = node.type === 'source'; const isPlant = node.type === 'plant'; const isDormant = node.status === 'dormant'; const isSelected = selectedNode === node.id; const isExpanded = !!expandedRoots[node.id];
            const activeRoots = (node.meta?.roots || []).filter(r => r.label.trim() !== "" || (r.hours && r.hours > 0));
            const hasRoots = activeRoots.length > 0;
            const dim = getNodeDimensions(node.type, isExpanded);
            const totalRootsHeight = isExpanded ? activeRoots.length * 20 + 32 : 32;
            const isBeingEdited = editingNode === node.id;
            const currentTheme = isDormant ? THEME.dormant : THEME.active;
            const showHours = visibilityMode >= 1; 
            const isFlashing = flashingNode === node.id;
            
            // --- STATE-BASED STYLING ---
            const flow = nodeInflows[node.id] || 0;
            const passiveAncestors = getPassiveAncestors(node.id);
            const isActuallyActive = flow > 0 || passiveAncestors.size > 0;
            const lastActivity = getNodeLastActivity(node.id, node.label);
            const daysSinceActivity = lastActivity ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 999;
            const isGoingDormant = !isActuallyActive && daysSinceActivity > 14;
            const isQuiet = !isActuallyActive && daysSinceActivity <= 14;

            const visualStateClasses = isActuallyActive ? '' : isQuiet ? 'saturate-[0.4] brightness-[1.05] opacity-80' : 'saturate-0 brightness-[1.1] opacity-60';
            
            return (
              <div key={node.id} style={{ left: node.x, top: node.y, width: dim.w + 40, height: dim.h + 40 }} className={`absolute group -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-75 ${isBeingEdited ? 'z-[200]' : isSelected ? 'z-50' : 'z-10'}`} onMouseDown={(e) => handleNodeMouseDown(e, node.id)} onDoubleClick={(e) => handleNodeDoubleClick(e, node)} onMouseUp={() => finishLink(node.id, 'auto')}>
                <div className="absolute inset-0 cursor-grab active:cursor-grabbing" onMouseDown={(e) => handleNodeMouseDown(e, node.id)} />
                <div className={`absolute inset-[20px] flex flex-col items-center overflow-visible pointer-events-none font-sans text-slate-800 transition-all ${visualStateClasses} ${isFlashing ? 'flash-active' : ''}`}>
                  
                  {isGoingDormant && (
                     <div className="absolute -top-4 -left-4 z-50 bg-white border border-slate-200 rounded-full px-2 py-1 shadow-md flex items-center gap-1 animate-bounce">
                        <Clock size={10} className="text-orange-500" />
                        <span className="text-[9px] font-bold text-slate-600">{30 - daysSinceActivity}d</span>
                     </div>
                  )}

                  {node.type === 'hub' && (
                    <div className={`w-40 h-40 rounded-full bg-white border-4 flex flex-col items-center justify-center text-center p-4 shadow-xl relative overflow-hidden shrink-0 transition-all duration-75 ${isSelected ? 'border-emerald-500 scale-105' : 'border-emerald-100'}`}>
                      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none font-sans"><div className="absolute -right-4 -top-4 opacity-10 transform rotate-12">{node.icon_key && <LargeIcon iconKey={node.icon_key} size={80} colorClass={isDormant ? 'text-slate-300' : currentTheme.watermark} />}</div></div>
                      <div className="flex flex-col items-center justify-center pointer-events-none w-full h-full relative z-10 font-sans"><div className={`mb-1 hit-central transition-colors pointer-events-none ${isDormant ? 'text-slate-300' : 'text-emerald-400'}`}>{node.icon_key && ICONS[node.icon_key]}</div><div className="hit-central px-2 py-1 rounded-md pointer-events-auto font-sans"><span className="font-serif italic text-lg font-bold leading-tight relative hit-central pointer-events-none text-slate-800">{node.label}</span></div>{node.meta?.description && <div className="hit-central px-1 pointer-events-auto font-sans"><span className="text-[9px] italic opacity-70 max-w-[120px] truncate relative hit-central font-sans pointer-events-none text-slate-800">{node.meta.description}</span></div>}{showHours && flow > 0 && <div className="hit-central mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1 font-sans hit-central pointer-events-auto"><Leaf size={8} fill="currentColor" /> {formatTime(flow)}</div>}</div>
                      {!snapshotMode && <button onClick={(e) => { e.stopPropagation(); setEditingNode(node.id); }} className="absolute top-2 right-6 p-1.5 bg-white/80 rounded-full shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 hover:text-emerald-600 transition-all z-20 pointer-events-auto font-sans"><Pencil size={12} /></button>}
                    </div>
                  )}
                  {node.type === 'bed' && (
                    <div className={`w-full h-[100px] border-2 shadow-sm rounded-t-2xl flex flex-col items-center justify-center p-4 transition-all duration-700 relative overflow-visible shrink-0 ${currentTheme.bed} ${isSelected ? 'border-emerald-500 scale-105 ring-2 ring-emerald-500 ring-opacity-20' : ''} ${hasRoots ? 'rounded-b-none border-b-0' : 'rounded-b-2xl'}`}>
                      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${hasRoots ? 'rounded-t-2xl' : 'rounded-2xl'}`}>{node.icon_key && <div className="absolute -right-4 -top-4 opacity-10 transform rotate-12 font-sans"><LargeIcon iconKey={node.icon_key} size={80} colorClass={isDormant ? THEME.dormant.watermark : currentTheme.watermark} /></div>}</div>
                      <div className="flex flex-col items-center justify-center pointer-events-none w-full h-full relative z-10 font-sans"><div className="hit-central px-2 py-1 rounded-md pointer-events-auto font-sans"><span className={`font-bold text-sm text-center relative hit-central pointer-events-none text-slate-800 ${isDormant ? 'text-slate-500' : currentTheme.plant}`}>{node.label}</span></div>{node.meta?.description && <div className="hit-central px-1 pointer-events-auto font-sans"><span className="text-[9px] italic opacity-70 relative text-center hit-central font-sans text-slate-800">{node.meta.description}</span></div>}{showHours && flow > 0 && <div className="hit-central mt-1 px-2 py-0.5 bg-white/60 rounded-full text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1 relative hit-central font-sans pointer-events-auto"><Leaf size={8} fill="currentColor" className="text-emerald-600 font-sans"/> {formatTime(flow)}</div>}</div>
                      {!snapshotMode && <button onClick={(e) => { e.stopPropagation(); setEditingNode(node.id); }} className="absolute top-2 right-2 p-1.5 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white hover:text-emerald-600 transition-all z-20 pointer-events-auto font-sans"><Pencil size={12} /></button>}
                    </div>
                  )}
                  {(isSource || isPlant) && (
                    <div className={`w-full h-full px-3 py-2 rounded-lg border bg-white flex items-center gap-3 shadow-sm transition-all group-hover:shadow-md relative shrink-0 font-sans text-slate-800 ${isSelected ? 'border-emerald-500 ring-1 ring-emerald-500 ring-opacity-50' : 'border-slate-200'}`}>{isSource && <div className={`p-1.5 rounded-md font-sans ${node.meta?.category === 'spring' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-500'}`}>{node.icon_key ? ICONS[node.icon_key] : <Anchor size={14} />}</div>}<div className="flex flex-col text-left font-sans pointer-events-none font-sans"><span className="text-xs font-bold text-slate-700 whitespace-nowrap font-sans pointer-events-none">{node.label}</span>{isSource && <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 font-sans pointer-events-none">{node.meta?.category || 'Resource'}</span>}{isPlant && showHours && flow > 0 && <span className="text-[9px] text-emerald-600 font-bold font-sans pointer-events-none">{formatTime(flow)}</span>}</div></div>
                  )}
                  {(node.type === 'hub' || node.type === 'bed') && (<div className="pointer-events-auto w-full font-sans"><RootFooter roots={node.meta?.roots || []} expanded={isExpanded} onToggle={() => setExpandedRoots(prev => ({...prev, [node.id]: !prev[node.id]}))} isRound={node.type === 'hub'} /></div>)}
                  {!snapshotMode && (<><DeleteButton onClick={() => deleteNode(node.id)} position="top-0 right-0 transform translate-x-1/2 -translate-y-1/2 pointer-events-auto font-sans" /><PlugHandle onMouseDown={(e) => { e.stopPropagation(); startLink(node.id, node.x, node.y - dim.h/2, 'top'); }} position="top-0 transform -translate-y-1/2 pointer-events-auto font-sans" /><PlugHandle onMouseDown={(e) => { e.stopPropagation(); startLink(node.id, node.x, node.y + (hasRoots ? (dim.h/2 + (isExpanded ? totalRootsHeight : 32)) : dim.h/2), 'bottom'); }} position="bottom-0 transform translate-y-1/2 pointer-events-auto font-sans" style={{ top: hasRoots ? (dim.h/2 + (isExpanded ? totalRootsHeight : 32)) : undefined }} /></>)}
                </div>
                {isBeingEdited && (<div className="absolute top-full left-1/2 transform -translate-x-1/2 z-[100] pointer-events-auto font-sans font-sans"><EditNodePopover node={node} onClose={() => setEditingNode(null)} onUpdate={updateNode} /></div>)}
              </div>
            );
          })}
        </div>
      </div>
      {quickAdd && <QuickAddModal position={{ x: quickAdd.x * viewState.zoom + viewState.x, y: quickAdd.y * viewState.zoom + viewState.y }} onSelect={handleCreateNode} />}
      {!snapshotMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 font-sans">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-1.5 rounded-full shadow-lg flex items-center gap-2 px-4 font-sans relative">
            {timeRange === 'Custom' && (
               <div className="absolute bottom-full left-0 mb-4 flex gap-1 animate-in slide-in-from-bottom-2 bg-white p-2 rounded-lg shadow-2xl border border-slate-200">
                  <input type="date" value={customDateRange.start} onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))} className="w-24 text-[10px] border rounded bg-slate-50 px-1 py-1 font-sans text-slate-800" />
                  <span className="text-slate-300 self-center">-</span>
                  <input type="date" value={customDateRange.end} onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))} className="w-24 text-[10px] border rounded bg-slate-50 px-1 py-1 font-sans text-slate-800" />
               </div>
            )}
            <div className="flex bg-slate-100 rounded-md p-0.5 font-sans font-sans">
               {['D', 'W', 'M', 'Y'].map(range => <button key={range} onClick={() => setTimeRange(range as any)} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${timeRange === range ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'} font-sans`}>{range}</button>)}
               <button onClick={() => setTimeRange('Custom')} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center ${timeRange === 'Custom' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'} font-sans`} title="Custom Range"><Calendar size={12} /></button>
            </div>
            
            <div className="h-4 w-px bg-slate-200 mx-1 font-sans"></div>
            <button onClick={() => setVisibilityMode(prev => (prev + 1) % 3 as 0|1|2)} className={`p-2 rounded-full transition-colors ${visibilityMode > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`} title="Toggle Visibility (Hide -> All -> Nodes)">{visibilityMode === 0 ? <EyeOff size={16} /> : visibilityMode === 1 ? <Eye size={16} /> : <CircleIcon size={16} />}</button>
            <button onClick={handleReset} className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors font-sans" title="Reset"><RefreshCw size={16} /></button>
            <button onClick={handleExportCSV} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 font-sans" title="Export CSV"><Download size={16} /></button>
            <label className="p-2 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer font-sans" title="Import CSV">
               <Upload size={16} /><input type="file" className="hidden" accept=".csv" onChange={handleImportCSV} />
            </label>
            <button onClick={() => setSnapshotMode(!snapshotMode)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 font-sans"><Camera size={16} /></button>
          </div>
        </div>
      )}
      <div onDragOver={e => e.preventDefault()} onDrop={handleDropOnSeedBank} className="font-sans">
        <SeedBank isOpen={showSeedBank} items={seedItems} onDragStart={handleSeedDragStart} onToggle={() => setShowSeedBank(!showSeedBank)} />
      </div>
      <div className="font-sans">
         <DoneLog isOpen={showDoneLog} logs={logs} onToggle={() => setShowDoneLog(!showDoneLog)} onDragStart={handleDoneDragStart} />
      </div>
      <div className={`absolute top-8 right-8 z-50 flex gap-2 transition-transform duration-300 font-sans ${showSeedBank ? '-translate-x-64' : showDoneLog ? '-translate-x-80' : ''}`}>
         {!snapshotMode && (<>
            <button onClick={() => setShowDoneLog(!showDoneLog)} className={`p-3 rounded-full shadow-lg transition-transform hover:scale-105 border border-slate-200 ${showDoneLog ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-500'} font-sans`}><CheckSquare size={20} /></button>
            <button onClick={() => setShowSeedBank(!showSeedBank)} className={`p-3 rounded-full shadow-lg transition-transform hover:scale-105 border border-slate-200 ${showSeedBank ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-500'} font-sans`}><Archive size={20} /></button>
            <button onClick={() => setNodes([...nodes, { id: `n-${Date.now()}`, type: 'bed', x: (400 - viewState.x) / viewState.zoom, y: (400 - viewState.y) / viewState.zoom, label: "New Goal", status: 'active' }])} className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg transition-transform hover:scale-110 font-sans"><Plus size={24} /></button>
         </>)}
         {snapshotMode && <button onClick={() => setSnapshotMode(false)} className="px-4 py-2 bg-slate-800 text-white rounded-full shadow-lg font-bold text-xs uppercase text-white font-sans">Exit</button>}
      </div>
    </div>
  );
};
