import { useState } from 'react';

interface Props {
  url: string;
}

export default function CopyLinkButton({ url }: Props) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-live="polite"
      className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-sm border border-[var(--color-rule)] text-[var(--color-fg)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] cursor-pointer bg-transparent"
    >
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}
