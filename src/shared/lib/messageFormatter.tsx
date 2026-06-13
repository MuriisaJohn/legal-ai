import React from 'react';

const defaultClasses = {
  bold: 'font-semibold',
  italic: 'italic text-legal-accent',
  link: 'text-blue-600 hover:text-blue-800 underline',
  code: 'bg-gray-100 px-1 py-0.5 rounded text-sm font-mono',
  blockquote: 'border-l-4 border-gray-300 pl-4 italic text-gray-600',
};

export interface FormatOptions {
  removeHashtags?: boolean;
  removeFootnotes?: boolean;
  parseLinks?: boolean;
  parseLineBreaks?: boolean;
  customClasses?: Partial<typeof defaultClasses>;
}

export const formatMessageContent = (
  content: string,
  options: FormatOptions = {}
): JSX.Element => {
  const {
    removeHashtags = true,
    removeFootnotes = true,
    parseLinks = true,
    parseLineBreaks = true,
    customClasses = {}
  } = options;

  const classes = { ...defaultClasses, ...customClasses };

  let formattedContent = content;
  if (removeHashtags) formattedContent = formattedContent.replace(/#/g, '');
  if (removeFootnotes) formattedContent = formattedContent.replace(/\[\^\d+\]/g, '');

  const parts = formattedContent.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*(?!\*).*?\*(?!\*)|`.*?`|https?:\/\/[^\s]+|>\s*.+)/g).filter(Boolean);

  const renderPart = (part: string, index: number): React.ReactNode => {
    if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
      return <strong key={index} className={`${classes.bold} ${classes.italic}`}>{part.slice(3, -3)}</strong>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index} className={classes.bold}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) {
      return <span key={index} className={classes.italic}>{part.slice(1, -1)}</span>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={index} className={classes.code}>{part.slice(1, -1)}</code>;
    }
    if (parseLinks && /^https?:\/\/[^\s]+$/.test(part)) {
      return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className={classes.link}>{part}</a>;
    }
    if (part.startsWith('> ')) {
      return <blockquote key={index} className={classes.blockquote}>{part.slice(2)}</blockquote>;
    }
    if (parseLineBreaks) {
      const lines = part.split('\n');
      if (lines.length > 1) {
        return (
          <span key={index}>
            {lines.map((line, i) => (
              <span key={i}>
                {line}
                {i < lines.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      }
    }
    return part;
  };

  return (
    <div className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => renderPart(part, index))}
    </div>
  );
};

export const formatMessageContentOptimized = (
  content: string,
  options: FormatOptions = {}
): JSX.Element => {
  const {
    removeHashtags = true,
    removeFootnotes = true,
    parseLinks = true,
    customClasses = {}
  } = options;

  const classes = { ...defaultClasses, ...customClasses };

  let processedContent = content;
  if (removeHashtags) processedContent = processedContent.replace(/#/g, '');
  if (removeFootnotes) processedContent = processedContent.replace(/\[\^\d+\]/g, '');

  const patterns = [
    { type: 'bold-italic', regex: /\*\*\*(.+?)\*\*\*/g },
    { type: 'bold', regex: /\*\*(.+?)\*\*/g },
    { type: 'italic', regex: /\*(.+?)\*/g },
    { type: 'code', regex: /`(.+?)`/g },
    ...(parseLinks ? [{ type: 'link', regex: /(https?:\/\/[^\s]+)/g }] : []),
  ] as const;

  const tokens: Array<{ type: string; content: string; start: number; end: number }> = [];

  patterns.forEach(({ type, regex }) => {
    let match;
    while ((match = regex.exec(processedContent)) !== null) {
      tokens.push({ type, content: match[0], start: match.index, end: match.index + match[0].length });
    }
  });

  tokens.sort((a, b) => a.start - b.start);

  const validTokens = tokens.filter((token, index) => {
    for (let i = 0; i < index; i++) {
      if (token.start < tokens[i].end) return false;
    }
    return true;
  });

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  validTokens.forEach((token, index) => {
    if (token.start > lastIndex) {
      elements.push(processedContent.slice(lastIndex, token.start));
    }
    const key = `token-${index}`;
    switch (token.type) {
      case 'bold-italic':
        elements.push(<strong key={key} className={`${classes.bold} ${classes.italic}`}>{token.content.slice(3, -3)}</strong>);
        break;
      case 'bold':
        elements.push(<strong key={key} className={classes.bold}>{token.content.slice(2, -2)}</strong>);
        break;
      case 'italic':
        elements.push(<span key={key} className={classes.italic}>{token.content.slice(1, -1)}</span>);
        break;
      case 'code':
        elements.push(<code key={key} className={classes.code}>{token.content.slice(1, -1)}</code>);
        break;
      case 'link':
        elements.push(<a key={key} href={token.content} target="_blank" rel="noopener noreferrer" className={classes.link}>{token.content}</a>);
        break;
      default:
        elements.push(token.content);
    }
    lastIndex = token.end;
  });

  if (lastIndex < processedContent.length) {
    elements.push(processedContent.slice(lastIndex));
  }

  return (
    <div className="whitespace-pre-wrap break-words">
      {elements.map((element, index) =>
        React.isValidElement(element) ? element : <span key={`text-${index}`}>{element}</span>
      )}
    </div>
  );
};
