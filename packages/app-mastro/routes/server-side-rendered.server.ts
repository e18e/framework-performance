import { htmlToResponse } from '@mastrojs/mastro'
import { testData } from '../../testdata/src/ssr.ts'
import { Layout } from '../components/Layout.ts'
import { Table } from '../components/Table.ts'

export async function GET() {
  const entries = await testData()
  return htmlToResponse(
    Layout({
      title: 'Mastro Server Side Rendered Benchmark',
      children: Table(entries, true),
    }),
  )
}
