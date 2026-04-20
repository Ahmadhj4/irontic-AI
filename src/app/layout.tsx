import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ConditionalShell } from '@/components/layout/ConditionalShell';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemedBackground } from '@/components/layout/ThemedBackground';

export const metadata: Metadata = {
  title: 'Irontic AI — Centralized Agentic Dashboard',
  description: 'Unified cybersecurity operations: GRC · SOC · EP · Pentest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ThemeProvider>
            <ThemedBackground>
              <ToastProvider>
                <ConditionalShell>{children}</ConditionalShell>
              </ToastProvider>
            </ThemedBackground>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
