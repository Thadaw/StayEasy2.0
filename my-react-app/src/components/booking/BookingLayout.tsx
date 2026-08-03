import { ReactNode } from 'react'

interface BookingLayoutProps {
  leftColumn: ReactNode
  rightColumn: ReactNode
}

export function BookingLayout({ leftColumn, rightColumn }: BookingLayoutProps) {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      {/* Mobile: everything stacks vertically */}
      <div className="lg:hidden space-y-5">
        {leftColumn}
        {rightColumn}
      </div>

      {/* Desktop: two-column grid */}
      <div className="hidden lg:grid lg:grid-cols-[380px_1fr] gap-8 items-start">
        <div className="space-y-5">
          {leftColumn}
        </div>
        <div className="lg:sticky lg:top-24 self-start">
          {rightColumn}
        </div>
      </div>
    </div>
  )
}
