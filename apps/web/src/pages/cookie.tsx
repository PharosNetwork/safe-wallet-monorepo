import type { ComponentProps } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'
import ReactMarkdown from 'react-markdown'
import { Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { COOKIE_LINK } from '@/config/constants.extra'
import SafeCookiePolicy from '@/markdown/cookie/cookie.md'
import type { MDXComponents } from 'mdx/types'
import CustomLink from '@/components/common/CustomLink'
import { Table as MuiTable, TableHead, TableBody, TableRow, TableCell } from '@mui/material'

const Table = (props: ComponentProps<typeof MuiTable>) => <MuiTable {...props} sx={{ border: '1px solid black' }} />
const Th = (props: ComponentProps<typeof TableCell>) => (
  <TableCell {...props} component="th" sx={{ fontWeight: 'bold', bgcolor: '#fff', color: 'black' }} />
)
const Td = (props: ComponentProps<typeof TableCell>) => <TableCell {...props} />
const Tr = (props: ComponentProps<typeof TableRow>) => <TableRow {...props} />

const overrideComponents: MDXComponents = {
  a: CustomLink,
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  tr: Tr,
  th: Th,
  td: Td,
}

const CookiePolicy: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()
  const [content, setContent] = useState<string>('')
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(COOKIE_LINK)
        let text = await response.text()
        text = text.replace(/\${origin}/g, window.location.origin)
        setContent(text)
      } catch (error) {
        console.error('Error fetching cookie policy:', error)
      }
    }

    fetchContent()
  }, [])
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Cookie policy`}</title>
      </Head>

      <main style={{ lineHeight: '1.5' }}>
        {isOfficialHost ? (
          <SafeCookiePolicy components={overrideComponents} />
        ) : (
          <>{content ? <ReactMarkdown>{content}</ReactMarkdown> : <Typography>Loading cookie policy...</Typography>}</>
        )}
      </main>
    </>
  )
}

export default CookiePolicy
