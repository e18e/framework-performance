import { Suspense } from 'react'
import ClientSideRenderedTable from './ClientSideRenderedTable'

export default function ClientSideRenderedPage() {
  return (
    <Suspense>
      <ClientSideRenderedTable />
    </Suspense>
  )
}
