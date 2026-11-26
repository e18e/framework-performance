import { Suspense } from 'react'
import ClientSideRenderedDetail from './ClientSideRenderedDetail'

export default function ClientSideRenderedDetailPage() {
  return (
    <Suspense>
      <ClientSideRenderedDetail />
    </Suspense>
  )
}
