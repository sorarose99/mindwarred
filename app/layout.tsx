import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'

// Lazy load performance monitor only in development
const PerformanceMonitor = dynamic(
  () => import('../components/dev/PerformanceMonitor'),
  { ssr: false }
)

// Lazy load onboarding provider
const OnboardingProvider = dynamic(
  () => import('../components/providers/OnboardingProvider'),
  { ssr: false }
)

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kiro - Your Web Mind',
  description: 'AI-powered browser assistant that learns your behavior and helps you act faster',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="" />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={`${inter.className} bg-gray-950 text-gray-100`}>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
        {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
      </body>
    </html>
  )
}