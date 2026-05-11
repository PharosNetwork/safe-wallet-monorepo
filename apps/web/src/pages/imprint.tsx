import { IMPRINT_LINK } from '@/config/constants.extra'
import { Typography } from '@mui/material'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

const SafeImprint = () => {
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(IMPRINT_LINK)
        const text = await response.text()
        setContent(text)
      } catch (error) {
        console.error('Error fetching Imprint & Disclaimer:', error)
      }
    }

    fetchContent()
  }, [])

  return (
    <main>
      {content ? <ReactMarkdown>{content}</ReactMarkdown> : <Typography>Loading Imprint & Disclaimer...</Typography>}
    </main>
  )
}

const Imprint: NextPage = () => {
  return (
    <>
      <Head>
        <title>Imprint & Disclaimer</title>
      </Head>

      <main>
        <SafeImprint />
      </main>
    </>
  )
}

export default Imprint