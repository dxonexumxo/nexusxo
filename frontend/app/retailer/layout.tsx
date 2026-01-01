import ComparisonBadge from '@/components/ComparisonBadge'

export default function RetailerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <ComparisonBadge />
    </>
  )
}
