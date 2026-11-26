'use client'

import { use } from 'react'
import { browser } from 'react-dom'
import { useParams } from 'next/navigation'

export default function ClientSideRenderedDetail() {
  use(browser())
  const params = useParams<{ id: string }>()

  return <p id="detail-id">{params.id}</p>
}
