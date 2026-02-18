import React, { useState } from 'react';
import { Search, Archive, Target, Sprout } from 'lucide-react';

interface SeedItem {
  id: string;
  label: string;
  type: string;
  days: number;
  tag: string;
}

interface SeedBankProps {
  isOpen: boolean;
  items: SeedItem[];
  onDragStart: (e: React.DragEvent, item: SeedItem) => void;
  onToggle: () => void;
}

export const SeedBank: React.FC<SeedBankProps> = ({ isOpen, items, onDragStart, onToggle }) => {
   const [search, setSearch] = useState("");
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   
   const filteredItems = items.filter(i => 
      i.label.toLowerCase().includes(search.toLowerCase()) || 
      i.tag.toLowerCase().includes(search.toLowerCase())
   );

   const goals = filteredItems.filter(i => i.tag === 'Goal' || i.tag === 'Project');
   const resources = filteredItems.filter(i => i.tag !== 'Goal' && i.tag !== 'Project');

   return (
      <div className={`absolute top-0 right-0 h-full w-64 bg-slate-50 border-l border-slate-200 shadow-xl transition-transform duration-300 z-[100] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
               <h2 className="text-lg font-serif italic text-slate-800">Seed Bank</h2>
               <p className="text-xs text-slate-400 mt-1">Dormant Ideas.</p>
            </div>
            <button 
               onClick={() => setIsSearchOpen(!isSearchOpen)}
               className={`p-2 rounded-full hover:bg-slate-200 transition-colors ${isSearchOpen ? 'bg-slate-200' : ''}`}
            >
               <Search size={16} className="text-slate-500" />
            </button>
         </div>
         
         {isSearchOpen && (
            <div className="px-4 py-2 bg-white border-b border-slate-100 animate-in slide-in-from-top-2">
               <input 
                  type="text" 
                  placeholder="Search seeds..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-2 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-emerald-400"
                  autoFocus
               />
            </div>
         )}
         
         <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 pl-1">Dreaming</h3>
               <div className="space-y-2">
                  {goals.map(item => (
                     <DraggableSeed key={item.id} item={item} onDragStart={onDragStart} />
                  ))}
                  {goals.length === 0 && <div className="text-[10px] text-slate-300 italic pl-1">No goals stored.</div>}
               </div>
            </div>

            <div>
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 pl-1">Gathering</h3>
               <div className="space-y-2">
                  {resources.map(item => (
                     <DraggableSeed key={item.id} item={item} onDragStart={onDragStart} />
                  ))}
                  {resources.length === 0 && <div className="text-[10px] text-slate-300 italic pl-1">No resources stored.</div>}
               </div>
            </div>
         </div>
         <div className="p-4 bg-slate-100 border-t border-slate-200 text-center">
            <p className="text-[10px] text-slate-400 italic">Drag to canvas to plant</p>
         </div>
      </div>
   );
};

const DraggableSeed: React.FC<{ item: SeedItem, onDragStart: (e: React.DragEvent, item: SeedItem) => void }> = ({ item, onDragStart }) => (
   <div 
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 opacity-80 hover:opacity-100 cursor-grab active:cursor-grabbing transition-all hover:border-emerald-200 hover:shadow-md"
   >
      <div className={`p-2 rounded text-slate-500 ${item.tag === 'Goal' ? 'bg-orange-50 text-orange-500' : 'bg-slate-100'}`}>
         {item.tag === 'Goal' ? <Target size={14} /> : <Sprout size={14} />}
      </div>
      <div>
         <h4 className="text-xs font-bold text-slate-700">{item.label}</h4>
         <div className="flex gap-2 text-[9px] text-slate-400 mt-0.5">
            <span className="uppercase font-bold tracking-wider">{item.tag}</span>
            <span>•</span>
            <span>{item.days}d</span>
         </div>
      </div>
   </div>
);
