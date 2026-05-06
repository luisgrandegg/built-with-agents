import { useEffect, useRef, useState } from 'react';

interface Props {
  url: string;
  title?: string;
}

function toEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('loom.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.loom.com/embed/${id}` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace('/', '');
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export default function VideoEmbed({ url, title = 'Project video' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const embed = toEmbed(url);

  useEffect(() => {
    if (!ref.current || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);

  if (!embed) {
    return (
      <p className="font-mono text-xs text-[var(--color-muted)]">
        Video unavailable: <a href={url}>{url}</a>
      </p>
    );
  }

  return (
    <div
      ref={ref}
      style={{ aspectRatio: '16 / 9' }}
      className="w-full overflow-hidden rounded-md border border-[var(--color-rule)] bg-[var(--color-surface)]"
    >
      {visible ? (
        <iframe
          src={embed}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
        />
      ) : null}
    </div>
  );
}
