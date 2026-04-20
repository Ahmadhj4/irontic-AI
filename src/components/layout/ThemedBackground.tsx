'use client';
import { useTheme } from '@/components/providers/ThemeProvider';

const DARK_BG = `
  radial-gradient(1100px 750px at 50% 14%, rgba(109,91,255,.45), transparent 58%),
  radial-gradient(1000px 700px at 45% 32%, rgba(79,140,255,.35), transparent 62%),
  radial-gradient(900px 650px at 55% 48%, rgba(34,211,238,.28), transparent 65%),
  #050b14
`;

const LIGHT_BG = `
  radial-gradient(1100px 750px at 50% 14%, rgba(139,92,246,.10), transparent 58%),
  radial-gradient(1000px 700px at 45% 32%, rgba(56,189,248,.08), transparent 62%),
  radial-gradient(900px 650px at 55% 48%, rgba(34,211,238,.06), transparent 65%),
  #eef2f7
`;

export function ThemedBackground({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ background: theme === 'light' ? LIGHT_BG : DARK_BG }}
    >
      {children}
    </div>
  );
}
