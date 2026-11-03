import React, { useState } from 'react';
import {
  Check,
  Copy,
  CheckSquare,
  Square,
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle2,
  Pin,
  Quote as QuoteIcon,
  Table as TableIcon,
  Terminal,
  ExternalLink,
  Target
} from 'lucide-react';
import { RichLinkBadge } from '../../utils/linkMeta';

interface RichMarkdownRendererProps {
  content: string;
  onUpdateContent?: (newContent: string) => void;
  className?: string;
}

export const RichMarkdownRenderer: React.FC<RichMarkdownRendererProps> = ({
  content,
  onUpdateContent,
  className = ''
}) => {
  if (!content || !content.trim()) return null;

  // Handler for toggling checkbox items in markdown
  const handleToggleChecklist = (taskLineIndex: number) => {
    if (!onUpdateContent) return;

    const lines = content.split('\n');
    let currentChecklistIndex = 0;

    const newLines = lines.map((line) => {
      const match = line.match(/^(\s*[-*]\s*)\[([ xX])\](\s+.*)$/);
      if (match) {
        if (currentChecklistIndex === taskLineIndex) {
          const isCurrentlyChecked = match[2].toLowerCase() === 'x';
          const newStatus = isCurrentlyChecked ? ' ' : 'x';
          currentChecklistIndex++;
          return `${match[1]}[${newStatus}]${match[3]}`;
        }
        currentChecklistIndex++;
      }
      return line;
    });

    onUpdateContent(newLines.join('\n'));
  };

  const blocks = parseMarkdownBlocks(content);

  let checklistCounter = 0;

  return (
    <div className={`space-y-2.5 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans ${className}`}>
      {blocks.map((block, blockIdx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1
                key={blockIdx}
                className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 pt-2 pb-1 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5"
              >
                <RenderInline text={block.content} />
              </h1>
            );

          case 'h2':
            return (
              <h2
                key={blockIdx}
                className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 pt-2 pb-0.5 border-l-2 border-emerald-500 pl-2.5 my-1"
              >
                <RenderInline text={block.content} />
              </h2>
            );

          case 'h3':
            return (
              <h3
                key={blockIdx}
                className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 pt-1 text-emerald-600 dark:text-emerald-400"
              >
                <RenderInline text={block.content} />
              </h3>
            );

          case 'code':
            return (
              <CodeBlockCard
                key={blockIdx}
                language={block.language || 'code'}
                code={block.content}
              />
            );

          case 'table':
            return (
              <TableBlockCard
                key={blockIdx}
                headers={block.headers || []}
                alignments={block.alignments || []}
                rows={block.rows || []}
              />
            );

          case 'callout':
            return (
              <CalloutBlockCard
                key={blockIdx}
                variant={block.variant || 'tip'}
                title={block.title}
                content={block.content}
              />
            );

          case 'quote':
            return (
              <blockquote
                key={blockIdx}
                className="relative pl-3.5 pr-3 py-2.5 my-1.5 border-l-3 border-indigo-500 bg-neutral-100/70 dark:bg-neutral-900/60 rounded-r-xl italic text-neutral-700 dark:text-neutral-300"
              >
                <QuoteIcon size={14} className="text-indigo-400 mb-1 opacity-70" />
                <RenderInline text={block.content} />
              </blockquote>
            );

          case 'checklist': {
            const thisIndex = checklistCounter;
            checklistCounter += block.items?.length || 0;
            return (
              <div key={blockIdx} className="space-y-1.5 my-1 pl-0.5">
                {block.items?.map((item, itemIdx) => {
                  const globalIdx = thisIndex + itemIdx;
                  return (
                    <div
                      key={itemIdx}
                      onClick={(e) => {
                        if (onUpdateContent) {
                          e.stopPropagation();
                          handleToggleChecklist(globalIdx);
                        }
                      }}
                      className={`flex items-start gap-2.5 p-1.5 rounded-lg transition-all ${
                        onUpdateContent
                          ? 'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 cursor-pointer group'
                          : ''
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 shrink-0 focus:outline-none"
                        title={onUpdateContent ? 'คลิกเพื่อเปลี่ยนสถานะ' : undefined}
                      >
                        {item.checked ? (
                          <div className="w-4 h-4 rounded-md bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-md border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 group-hover:border-emerald-500 transition-colors" />
                        )}
                      </button>
                      <span
                        className={`text-xs leading-tight select-none transition-all ${
                          item.checked
                            ? 'line-through text-neutral-400 dark:text-neutral-500'
                            : 'text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        <RenderInline text={item.text} />
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          }

          case 'bullet-list':
            return (
              <ul key={blockIdx} className="list-disc list-inside space-y-1 my-1 pl-1 text-neutral-800 dark:text-neutral-200">
                {block.items?.map((item, idx) => (
                  <li key={idx} className="text-xs">
                    <RenderInline text={item.text} />
                  </li>
                ))}
              </ul>
            );

          case 'number-list':
            return (
              <ol key={blockIdx} className="list-decimal list-inside space-y-1 my-1 pl-1 text-neutral-800 dark:text-neutral-200 font-medium">
                {block.items?.map((item, idx) => (
                  <li key={idx} className="text-xs">
                    <span className="font-normal">
                      <RenderInline text={item.text} />
                    </span>
                  </li>
                ))}
              </ol>
            );

          case 'divider':
            return (
              <div
                key={blockIdx}
                className="h-px my-3 bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent"
              />
            );

          case 'paragraph':
          default:
            return (
              <p key={blockIdx} className="whitespace-pre-wrap break-words leading-relaxed">
                <RenderInline text={block.content} />
              </p>
            );
        }
      })}
    </div>
  );
};

/* ========================================================================= */
/*                              BLOCK COMPONENTS                             */
/* ========================================================================= */

interface CodeBlockCardProps {
  language: string;
  code: string;
}

const CodeBlockCard: React.FC<CodeBlockCardProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-neutral-700/60 bg-neutral-950 text-neutral-100 my-2 shadow-md">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900/90 border-b border-neutral-800 text-[11px]">
        <div className="flex items-center gap-1.5 text-neutral-400 font-mono">
          <Terminal size={12} className="text-emerald-400" />
          <span className="uppercase font-semibold tracking-wider text-[10px]">
            {language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-[10px] font-medium cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-3 text-[11.5px] font-mono leading-relaxed overflow-x-auto text-emerald-300/90 bg-neutral-950 selection:bg-emerald-900">
        <code>{code}</code>
      </pre>
    </div>
  );
};

interface TableBlockCardProps {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

const TableBlockCard: React.FC<TableBlockCardProps> = ({ headers, alignments, rows }) => {
  return (
    <div className="my-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto shadow-xs bg-white dark:bg-neutral-900">
      <table className="w-full text-left text-xs border-collapse">
        {headers.length > 0 && (
          <thead>
            <tr className="bg-neutral-100/90 dark:bg-neutral-800/90 border-b border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-3 py-2 text-${alignments[i] || 'left'} border-r last:border-r-0 border-neutral-200 dark:border-neutral-800`}
                >
                  <RenderInline text={h} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors even:bg-neutral-50/40 dark:even:bg-neutral-900/40"
            >
              {row.map((cell, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-3 py-1.5 text-${alignments[colIdx] || 'left'} border-r last:border-r-0 border-neutral-200/60 dark:border-neutral-800/60`}
                >
                  <RenderInline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface CalloutBlockCardProps {
  variant: 'tip' | 'warning' | 'info' | 'success' | 'pin' | 'goal';
  title?: string;
  content: string;
}

const CalloutBlockCard: React.FC<CalloutBlockCardProps> = ({ variant, title, content }) => {
  const configs = {
    tip: {
      bg: 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/30 dark:border-amber-500/40',
      badgeBg: 'bg-amber-500 text-white shadow-amber-500/20',
      icon: <Lightbulb size={13} />,
      defaultTitle: 'Tip / แนะนำ',
      titleColor: 'text-amber-800 dark:text-amber-300'
    },
    warning: {
      bg: 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/30 dark:border-rose-500/40',
      badgeBg: 'bg-rose-500 text-white shadow-rose-500/20',
      icon: <AlertTriangle size={13} />,
      defaultTitle: 'Warning / ข้อควรระวัง',
      titleColor: 'text-rose-800 dark:text-rose-300'
    },
    info: {
      bg: 'bg-sky-500/10 dark:bg-sky-950/30 border-sky-500/30 dark:border-sky-500/40',
      badgeBg: 'bg-sky-500 text-white shadow-sky-500/20',
      icon: <Info size={13} />,
      defaultTitle: 'Note / บันทึก',
      titleColor: 'text-sky-800 dark:text-sky-300'
    },
    success: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30 dark:border-emerald-500/40',
      badgeBg: 'bg-emerald-500 text-white shadow-emerald-500/20',
      icon: <CheckCircle2 size={13} />,
      defaultTitle: 'Success / ความสำเร็จ',
      titleColor: 'text-emerald-800 dark:text-emerald-300'
    },
    pin: {
      bg: 'bg-purple-500/10 dark:bg-purple-950/30 border-purple-500/30 dark:border-purple-500/40',
      badgeBg: 'bg-purple-500 text-white shadow-purple-500/20',
      icon: <Pin size={13} />,
      defaultTitle: 'Notice / สิ่งสำคัญ',
      titleColor: 'text-purple-800 dark:text-purple-300'
    },
    goal: {
      bg: 'bg-blue-500/10 dark:bg-blue-950/30 border-blue-500/30 dark:border-blue-500/40',
      badgeBg: 'bg-blue-500 text-white shadow-blue-500/20',
      icon: <Target size={13} />,
      defaultTitle: 'Goal / เป้าหมาย',
      titleColor: 'text-blue-800 dark:text-blue-300'
    }
  };

  const cfg = configs[variant] || configs.tip;

  return (
    <div className={`p-3 rounded-2xl border ${cfg.bg} my-2 shadow-xs transition-all`}>
      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 rounded-xl ${cfg.badgeBg} shadow-sm shrink-0 mt-0.5`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-bold ${cfg.titleColor} mb-0.5 flex items-center gap-1`}>
            {title || cfg.defaultTitle}
          </div>
          <div className="text-neutral-800 dark:text-neutral-200 leading-relaxed text-xs">
            <RenderInline text={content} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/*                             INLINE FORMATTING                             */
/* ========================================================================= */

export const RenderInline: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Regex tokens: URLs | inline code | bold | italic | strikethrough
  const tokenRegex = /(https?:\/\/[^\s<>"{}|\^`\\[\]]+)|(`[^`\n]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(~~[^~]+~~)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith('http://') || token.startsWith('https://')) {
      const cleanUrl = token.replace(/[.,;:!?)]+$/, '');
      const trailing = token.slice(cleanUrl.length);
      parts.push(
        <React.Fragment key={match.index}>
          <RichLinkBadge url={cleanUrl} />
          {trailing}
        </React.Fragment>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const codeText = token.slice(1, -1);
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 font-mono text-[11px] text-pink-600 dark:text-pink-400 font-semibold border border-neutral-300/50 dark:border-neutral-700/60"
        >
          {codeText}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      const boldText = token.slice(2, -2);
      parts.push(
        <strong key={match.index} className="font-bold text-neutral-900 dark:text-neutral-100">
          <RenderInline text={boldText} />
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      const italicText = token.slice(1, -1);
      parts.push(
        <em key={match.index} className="italic">
          <RenderInline text={italicText} />
        </em>
      );
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      const strikeText = token.slice(2, -2);
      parts.push(
        <del key={match.index} className="line-through text-neutral-400">
          <RenderInline text={strikeText} />
        </del>
      );
    } else {
      parts.push(token);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
};

/* ========================================================================= */
/*                               BLOCK PARSER                                */
/* ========================================================================= */

interface MarkdownBlock {
  type:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'code'
    | 'table'
    | 'callout'
    | 'quote'
    | 'checklist'
    | 'bullet-list'
    | 'number-list'
    | 'divider'
    | 'paragraph';
  content: string;
  language?: string;
  variant?: 'tip' | 'warning' | 'info' | 'success' | 'pin' | 'goal';
  title?: string;
  headers?: string[];
  alignments?: ('left' | 'center' | 'right')[];
  rows?: string[][];
  items?: { checked?: boolean; text: string }[];
}

function parseMarkdownBlocks(rawText: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = rawText.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Block (```lang ... ```)
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim() || 'code';
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++; // skip closing ```
      }
      blocks.push({
        type: 'code',
        language: lang,
        content: codeLines.join('\n')
      });
      continue;
    }

    // 2. Table Block (lines with '|')
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const rawHeaders = tableLines[0].slice(1, -1).split('|').map((s) => s.trim());
        const separatorLine = tableLines[1];
        const rawAlignments = separatorLine
          .slice(1, -1)
          .split('|')
          .map((s) => {
            const trimmed = s.trim();
            if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
            if (trimmed.endsWith(':')) return 'right';
            return 'left';
          });

        const rows: string[][] = [];
        for (let r = 2; r < tableLines.length; r++) {
          const cells = tableLines[r].slice(1, -1).split('|').map((s) => s.trim());
          rows.push(cells);
        }

        blocks.push({
          type: 'table',
          content: '',
          headers: rawHeaders,
          alignments: rawAlignments,
          rows
        });
        continue;
      }
    }

    // 3. Divider (--- or ***)
    if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
      blocks.push({ type: 'divider', content: '' });
      i++;
      continue;
    }

    // 4. Headings
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', content: line.slice(2).trim() });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', content: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', content: line.slice(4).trim() });
      i++;
      continue;
    }

    // 5. Checklist items (- [ ] or - [x])
    const checkMatch = line.match(/^(\s*[-*]\s*)\[([ xX])\]\s*(.*)$/);
    if (checkMatch) {
      const checklistItems: { checked: boolean; text: string }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*[-*]\s*)\[([ xX])\]\s*(.*)$/);
        if (m) {
          checklistItems.push({
            checked: m[2].toLowerCase() === 'x',
            text: m[3]
          });
          i++;
        } else {
          break;
        }
      }
      blocks.push({
        type: 'checklist',
        content: '',
        items: checklistItems
      });
      continue;
    }

    // 6. Bullet lists (- item or * item)
    if (line.match(/^(\s*[-*]\s+)/)) {
      const bulletItems: { text: string }[] = [];
      while (i < lines.length && lines[i].match(/^(\s*[-*]\s+)(?!\[[ xX]\])/)) {
        const itemText = lines[i].replace(/^(\s*[-*]\s+)/, '');
        bulletItems.push({ text: itemText });
        i++;
      }
      blocks.push({
        type: 'bullet-list',
        content: '',
        items: bulletItems
      });
      continue;
    }

    // 7. Numbered lists (1. item)
    if (line.match(/^\s*\d+\.\s+/)) {
      const numberItems: { text: string }[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, '');
        numberItems.push({ text: itemText });
        i++;
      }
      blocks.push({
        type: 'number-list',
        content: '',
        items: numberItems
      });
      continue;
    }

    // 8. Blockquote or Callout (> ...)
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const quoteText = quoteLines.join('\n').trim();

      // Check if this is a Callout Box
      const calloutPattern = /^(💡|⚠️|ℹ️|✅|📌|🎯|🚀|\*\*Tip:\*\*|\*\*Warning:\*\*|\*\*Note:\*\*|\*\*Success:\*\*|\*\*Goal:\*\*)\s*(.*)$/i;
      const match = quoteText.match(calloutPattern);

      if (match) {
        const indicator = match[1].toLowerCase();
        let remaining = match[2];
        let variant: 'tip' | 'warning' | 'info' | 'success' | 'pin' | 'goal' = 'tip';
        let customTitle = '';

        if (indicator.includes('⚠️') || indicator.includes('warning')) {
          variant = 'warning';
          customTitle = 'Warning / ข้อควรระวัง';
        } else if (indicator.includes('ℹ️') || indicator.includes('note')) {
          variant = 'info';
          customTitle = 'Note / รายละเอียดสำคัญ';
        } else if (indicator.includes('✅') || indicator.includes('success')) {
          variant = 'success';
          customTitle = 'Success / เงื่อนไขความสำเร็จ';
        } else if (indicator.includes('📌') || indicator.includes('pin')) {
          variant = 'pin';
          customTitle = 'Important / ปักหมุดสิ่งสำคัญ';
        } else if (indicator.includes('🎯') || indicator.includes('🚀') || indicator.includes('goal')) {
          variant = 'goal';
          customTitle = 'Goal / เป้าหมาย';
        } else {
          variant = 'tip';
          customTitle = 'Tip / คำแนะนำ';
        }

        // If remaining has bold title like **Warning:** details
        const titleMatch = remaining.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
        if (titleMatch) {
          customTitle = titleMatch[1];
          remaining = titleMatch[2];
        }

        blocks.push({
          type: 'callout',
          variant,
          title: customTitle,
          content: remaining
        });
      } else {
        blocks.push({
          type: 'quote',
          content: quoteText
        });
      }
      continue;
    }

    // 9. Regular Paragraph
    if (line.trim().length > 0) {
      const paraLines: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim().length > 0 &&
        !lines[i].startsWith('#') &&
        !lines[i].startsWith('>') &&
        !lines[i].startsWith('```') &&
        !lines[i].startsWith('|') &&
        !lines[i].startsWith('---') &&
        !lines[i].match(/^(\s*[-*]\s+)/) &&
        !lines[i].match(/^\s*\d+\.\s+/)
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'paragraph',
        content: paraLines.join('\n')
      });
      continue;
    }

    // Empty line
    i++;
  }

  return blocks;
}
