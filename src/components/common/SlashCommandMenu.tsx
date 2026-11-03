import React, { useEffect, useState, useRef } from 'react';
import {
  Lightbulb,
  AlertTriangle,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Minus,
  Quote,
  Table,
  Sparkles,
  Info,
  CheckCircle2,
  Pin,
  Target,
  List,
  ListOrdered
} from 'lucide-react';

export interface SlashCommand {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  insertText: string;
  category: 'Callouts' | 'Tasks' | 'Headers' | 'Blocks' | 'Formatting';
  badge?: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  // --- Callouts ---
  {
    id: 'callout-note',
    title: 'Tip / คำแนะนำ',
    description: 'กล่องไฮไลต์สีทอง พร้อมไอคอน 💡',
    icon: <Lightbulb size={16} className="text-amber-500" />,
    insertText: '> 💡 **Tip:** เขียนข้อความสำคัญหรือคำแนะนำตรงนี้...\n\n',
    category: 'Callouts',
    badge: 'Popular'
  },
  {
    id: 'callout-warning',
    title: 'Warning Box / คำเตือน',
    description: 'กล่องเตือนความจำสีแดงส้ม พร้อมไอคอน ⚠️',
    icon: <AlertTriangle size={16} className="text-rose-500" />,
    insertText: '> ⚠️ **Warning:** ระบุข้อควรระวังหรือสิ่งที่ต้องตรวจสอบก่อนดำเนินการ...\n\n',
    category: 'Callouts'
  },
  {
    id: 'callout-info',
    title: 'Info Box / บันทึกข้อมูล',
    description: 'กล่องสีฟ้าสดใสสำหรับบันทึกข้อมูลประกอบ ℹ️',
    icon: <Info size={16} className="text-sky-500" />,
    insertText: '> ℹ️ **Note:** รายละเอียดประกอบหรือข้อมูลอ้างอิง...\n\n',
    category: 'Callouts'
  },
  {
    id: 'callout-success',
    title: 'Success / เงื่อนไขความสำเร็จ',
    description: 'กล่องสีเขียวมรกตระบุเงื่อนไขปิดงาน ✅',
    icon: <CheckCircle2 size={16} className="text-emerald-500" />,
    insertText: '> ✅ **Success:** ผลลัพธ์ที่คาดหวังหรือเงื่อนไขปิดงาน...\n\n',
    category: 'Callouts'
  },
  {
    id: 'callout-pin',
    title: 'Notice / สิ่งสำคัญที่ต้องจำ',
    description: 'กล่องปักหมุดสีม่วง พร้อมไอคอน 📌',
    icon: <Pin size={16} className="text-purple-500" />,
    insertText: '> 📌 **Notice:** ข้อตกลงสำคัญที่ต้องปฏิบัติตาม...\n\n',
    category: 'Callouts'
  },
  {
    id: 'callout-goal',
    title: 'Goal / เป้าหมายงาน',
    description: 'กล่องสีน้ำเงินสำหรับระบุเป้าหมาย 🎯',
    icon: <Target size={16} className="text-blue-500" />,
    insertText: '> 🎯 **Goal:** เป้าหมายสำคัญและ KPI ของงานนี้...\n\n',
    category: 'Callouts'
  },

  // --- Tasks & Lists ---
  {
    id: 'todo',
    title: 'To-do Checklist (Interactive)',
    description: 'รายการติ๊กถูกที่สามารถคลิกทำเครื่องหมายได้ในโหมดแสดงผล',
    icon: <CheckSquare size={16} className="text-emerald-500" />,
    insertText: '- [ ] รายการสิ่งที่ต้องทำข้อที่ 1\n- [ ] รายการสิ่งที่ต้องทำข้อที่ 2\n- [ ] รายการสิ่งที่ต้องทำข้อที่ 3\n\n',
    category: 'Tasks',
    badge: 'Interactive'
  },
  {
    id: 'bullet-list',
    title: 'Bullet List / รายการจุด',
    description: 'รายการข้อความแบบจุดกลม',
    icon: <List size={16} className="text-neutral-500" />,
    insertText: '- ประเด็นที่ 1\n- ประเด็นที่ 2\n- ประเด็นที่ 3\n\n',
    category: 'Tasks'
  },
  {
    id: 'number-list',
    title: 'Numbered List / รายการตัวเลข',
    description: 'รายการข้อความเรียงลำดับขั้นตอน 1, 2, 3',
    icon: <ListOrdered size={16} className="text-neutral-500" />,
    insertText: '1. ขั้นตอนแรก\n2. ขั้นตอนถัดไป\n3. สรุปผลงาน\n\n',
    category: 'Tasks'
  },

  // --- Headers ---
  {
    id: 'h1',
    title: 'Heading 1 / หัวข้อใหญ่',
    description: 'หัวข้อหลักขนาดใหญ่ พร้อมเส้นคั่นด้านล่าง',
    icon: <Heading1 size={16} className="text-indigo-500" />,
    insertText: '# หัวข้อหลัก\n\n',
    category: 'Headers'
  },
  {
    id: 'h2',
    title: 'Heading 2 / หัวข้อย่อย',
    description: 'หัวข้อย่อยขนาดกลางพร้อมแถบสีเขียว',
    icon: <Heading2 size={16} className="text-indigo-400" />,
    insertText: '## หัวข้อย่อย\n\n',
    category: 'Headers'
  },
  {
    id: 'h3',
    title: 'Heading 3 / หัวข้อย่อยระดับ 3',
    description: 'หัวข้อย่อยขนาดกะทัดรัด',
    icon: <Heading3 size={16} className="text-indigo-300" />,
    insertText: '### หัวข้อย่อยระดับ 3\n\n',
    category: 'Headers'
  },

  // --- Blocks & Formatting ---
  {
    id: 'table',
    title: 'Table Grid / ตารางข้อมูล',
    description: 'ตาราง Markdown แสดงข้อมูลสลับแถวสีสวยงาม',
    icon: <Table size={16} className="text-purple-500" />,
    insertText: '| หัวข้อ 1 | หัวข้อ 2 | สถานะ |\n| :--- | :--- | :--- |\n| ข้อมูลแถว 1 | รายละเอียด | ✅ เรียบร้อย |\n| ข้อมูลแถว 2 | รายละเอียด | ⏳ รอดำเนินการ |\n\n',
    category: 'Blocks',
    badge: 'Sleek'
  },
  {
    id: 'code',
    title: 'Code Block / บล็อกโค้ด',
    description: 'บล็อกเขียนโค้ดพร้อมปุ่ม Copy และแถบระบุภาษา',
    icon: <Code size={16} className="text-sky-500" />,
    insertText: '```typescript\n// เขียนโค้ดหรือสคริปต์ที่นี่\nconsole.log("EFL Workflow System");\n```\n\n',
    category: 'Blocks'
  },
  {
    id: 'quote',
    title: 'Quote Block / คำพูดอ้างอิง',
    description: 'บล็อกคำคมหรือข้อความอ้างอิงแถบสีน้ำเงิน',
    icon: <Quote size={16} className="text-slate-500" />,
    insertText: '> "ข้อความอ้างอิงหรือคำพูดสำคัญ..."\n\n',
    category: 'Formatting'
  },
  {
    id: 'divider',
    title: 'Divider / เส้นแบ่งส่วน',
    description: 'เส้นคั่นแนวนอนไล่ระดับสีอ่อนนุ่ม',
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

  const cleanQuery = query.toLowerCase().trim();
  const filteredCommands = SLASH_COMMANDS.filter((cmd) => {
    if (!cleanQuery) return true;
    return (
      cmd.title.toLowerCase().includes(cleanQuery) ||
      cmd.description.toLowerCase().includes(cleanQuery) ||
      cmd.category.toLowerCase().includes(cleanQuery) ||
      cmd.id.toLowerCase().includes(cleanQuery)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
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

  // Auto-scroll selected item into view
  useEffect(() => {
    const selectedEl = menuRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
      className="absolute z-50 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-2 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/10"
    >
      {/* Header bar */}
      <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 mb-1.5">
        <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
          <Sparkles size={12} className="text-emerald-500 animate-pulse" />
          <span>Notion Slash Commands</span>
        </span>
        <span className="text-[9px] font-mono opacity-80">↑↓ เลือก | ↵ ใส่ข้อมูล</span>
      </div>

      {/* Commands List */}
      {filteredCommands.map((cmd, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <button
            key={cmd.id}
            data-index={idx}
            type="button"
            onClick={() => onSelect(cmd)}
            onMouseEnter={() => setSelectedIndex(idx)}
            className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
              isSelected
                ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 border border-emerald-500/30 shadow-xs'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border border-transparent'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 mt-0.5 transition-colors shadow-xs ${
                isSelected
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60'
              }`}
            >
              {cmd.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold truncate text-neutral-900 dark:text-neutral-100">
                  {cmd.title}
                </span>
                {cmd.badge && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                    {cmd.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 leading-snug">
                {cmd.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
