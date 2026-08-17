import React, { useEffect, useState, useRef } from 'react';
import { Lightbulb, AlertTriangle, CheckSquare, Heading1, Heading2, Heading3, Code, Minus, Quote, Table, Sparkles } from 'lucide-react';

export interface SlashCommand {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  insertText: string;
  category: 'Blocks' | 'Headers' | 'Formatting';
}

const COMMANDS: SlashCommand[] = [
  {
    id: 'callout-note',
    title: 'Callout (Tip / Note)',
    description: 'กล่องเน้นข้อความสีเขียวพาสเทล พร้อมไอคอน 💡',
    icon: <Lightbulb size={16} className="text-amber-500" />,
    insertText: '> 💡 **Tip:** เขียนข้อความสำคัญหรือคำแนะนำตรงนี้...\n\n',
    category: 'Blocks'
  },
  {
    id: 'callout-warning',
    title: 'Warning Box',
    description: 'กล่องเตือนความจำสีส้ม พร้อมไอคอน ⚠️',
    icon: <AlertTriangle size={16} className="text-rose-500" />,
    insertText: '> ⚠️ **Warning:** ระบุข้อควรระวังหรือสิ่งที่ต้องตรวจสอบ...\n\n',
    category: 'Blocks'
  },
  {
    id: 'todo',
    title: 'To-do List / Checklist',
    description: 'ช่องติ๊กถูกรายการสิ่งที่ต้องทำ',
    icon: <CheckSquare size={16} className="text-emerald-500" />,
    insertText: '- [ ] รายการสิ่งที่ต้องทำ\n- [ ] รายการที่สอง\n\n',
    category: 'Blocks'
  },
  {
    id: 'h1',
    title: 'Heading 1',
    description: 'หัวข้อขนาดใหญ่สุด (H1)',
    icon: <Heading1 size={16} className="text-indigo-500" />,
    insertText: '# หัวข้อหลัก\n\n',
    category: 'Headers'
  },
  {
    id: 'h2',
    title: 'Heading 2',
    description: 'หัวข้อย่อยขนาดกลาง (H2)',
    icon: <Heading2 size={16} className="text-indigo-400" />,
    insertText: '## หัวข้อย่อย\n\n',
    category: 'Headers'
  },
  {
    id: 'h3',
    title: 'Heading 3',
    description: 'หัวข้อย่อยขนาดเล็ก (H3)',
    icon: <Heading3 size={16} className="text-indigo-300" />,
    insertText: '### หัวข้อย่อยระดับ 3\n\n',
    category: 'Headers'
  },
  {
    id: 'code',
    title: 'Code Block',
    description: 'บล็อกเขียนโค้ด monospace',
    icon: <Code size={16} className="text-sky-500" />,
    insertText: '```typescript\n// เขียนโค้ดหรือสคริปต์ที่นี่\nconsole.log("Hello Notion!");\n```\n\n',
    category: 'Formatting'
  },
  {
    id: 'table',
    title: 'Table Grid',
    description: 'ตาราง Markdown 2x2',
    icon: <Table size={16} className="text-purple-500" />,
    insertText: '| หัวข้อ 1 | หัวข้อ 2 | สถานะ |\n| :--- | :--- | :--- |\n| ข้อมูลแถว 1 | รายละเอียด | ✅ เรียบร้อย |\n| ข้อมูลแถว 2 | รายละเอียด | ⏳ รอดำเนินการ |\n\n',
    category: 'Formatting'
  },
  {
    id: 'quote',
    title: 'Quote Block',
    description: 'ข้อความอ้างอิงหรือคำพูดสำคัญ',
    icon: <Quote size={16} className="text-slate-500" />,
    insertText: '> "ข้อความอ้างอิงหรือคำพูดสำคัญ..."\n\n',
    category: 'Formatting'
  },
  {
    id: 'divider',
    title: 'Divider',
    description: 'เส้นคั่นแนวนอนแบ่งส่วนข้อความ',
    icon: <Minus size={16} className="text-slate-400" />,
    insertText: '---\n\n',
    category: 'Formatting'
  }
];

interface SlashCommandMenuProps {
  query: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  query,
  onSelect,
  onClose,
  position
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  if (filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
      className="absolute z-50 w-72 max-h-80 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 space-y-1 backdrop-blur-md animate-in fade-in zoom-in-95"
    >
      <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-1">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-emerald-500" /> Notion Slash Commands
        </span>
        <span>↑↓ นำทาง | ↵ เลือก</span>
      </div>

      {filteredCommands.map((cmd, idx) => (
        <button
          key={cmd.id}
          type="button"
          onClick={() => onSelect(cmd)}
          onMouseEnter={() => setSelectedIndex(idx)}
          className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors ${
            idx === selectedIndex
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800/80'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
          }`}
        >
          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5">
            {cmd.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">
              {cmd.title}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              {cmd.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
