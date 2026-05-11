import { Box, useTheme } from '@mui/material'
import css from './styles.module.css'
import useSwapConsent from './useSwapConsent'
import Disclaimer from '@/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'
import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import type { MutableRefObject } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import type { SplitSubvariant, WidgetConfig } from './types/widget'
import { LIFI_WIDGET_URL } from '@/config/constants.extra'

type Params = {
  sell?: {
    // The token address
    asset: string
    amount: string
    split?: SplitSubvariant
  }
}

const LifiSwapWidget = ({ sell }: Params) => {
  const { palette } = useTheme()
  const darkMode = useDarkMode()
  const chainId = useChainId()
  const { safeLoading } = useSafeInfo()
  const { isConsentAccepted, onAccept } = useSwapConsent()

  const checkDarkMode = () => {
    const theme = document.documentElement.getAttribute('data-theme')
    return theme === 'dark'
  }

  const INITIAL_PARAMS: WidgetConfig = {
    integrator: 'protofire-safe',
    fee: 0.005,
    variant: 'compact',
    subvariant: 'split',
    subvariantOptions: {
      split: sell?.split ?? 'swap',
    },
    tokens: {
      deny: [
        {
          address: '0x8f552a71EFE5eeFc207Bf75485b356A0b3f01eC9',
          chainId: 1284,
        },
        {
          address: '0x4792C1EcB969B036eb51330c63bD27899A13D84e',
          chainId: 1284,
        },
        {
          address: '0x30D2a9F5FDf90ACe8c17952cbb4eE48a55D916A7',
          chainId: 1284,
        },
        {
          address: '0x1DC78Acda13a8BC4408B207c9E48CDBc096D95e0',
          chainId: 1284,
        },
        {
          address: '0xc9BAA8cfdDe8E328787E29b4B078abf2DaDc2055',
          chainId: 1284,
        },
        {
          address: '0xC19281F22A075E0F10351cd5D6Ea9f0AC63d4327',
          chainId: 1284,
        },
        {
          address: '0xFFFFFfFf5AC1f9A51A93F5C527385edF7Fe98A52',
          chainId: 1284,
        },
        {
          address: '0xA649325Aa7C5093d12D6F98EB4378deAe68CE23F',
          chainId: 1284,
        },
        {
          address: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
          chainId: 1284,
        },
        {
          address: '0xfA9343C3897324496A05fC75abeD6bAC29f8A40f',
          chainId: 1284,
        },
        {
          address: '0x922D641a426DcFFaeF11680e5358F34d97d112E1',
          chainId: 1284,
        },
        {
          address: '0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D',
          chainId: 1285,
        },
        {
          address: '0xB44a9B6905aF7c801311e8F4E76932ee959c663C',
          chainId: 1285,
        },
        {
          address: '0x639A647fbe20b6c8ac19E48E2de44ea792c62c5C',
          chainId: 1285,
        },
        {
          address: '0x5D9ab5522c64E1F6ef5e3627ECCc093f56167818',
          chainId: 1285,
        },
        {
          address: '0x99C409E5f62E4bd2AC142f17caFb6810B8F0BAAE',
          chainId: 1285,
        },
        {
          address: '0x0caE51e1032e8461f4806e26332c030E34De3aDb',
          chainId: 1285,
        },
        {
          address: '0x98878B06940aE243284CA214f92Bb71a2b032B8A',
          chainId: 1285,
        },
      ],
    },
    chains: { from: { allow: [+chainId] } },
    appearance: darkMode || checkDarkMode() ? 'dark' : 'light',
    theme: {
      shape: {
        borderRadius: 15,
      },
      container: {
        boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.08)',
        borderRadius: '16px',
        maxHeight: '96vh',
      },
    },
    hiddenUI: ['walletMenu'],
    fromChain: +chainId,
    toChain: +chainId,
    fromToken: sell?.asset,
  }

  const [params, setParams] = useState<WidgetConfig>(INITIAL_PARAMS)

  const iframeRef: MutableRefObject<HTMLIFrameElement | null> = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    setParams((params) => ({
      ...params,
      appearance: darkMode ? 'dark' : 'light',
      fromChain: +chainId,
    }))
  }, [palette, darkMode, chainId])

  useEffect(() => {
    const iframeElement = document.querySelector('#lifiWidget iframe')
    if (iframeElement) {
      iframeRef.current = iframeElement as HTMLIFrameElement
    }
  }, [isConsentAccepted, safeLoading])

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      const { type } = event.data
      if (type === 'iframeReady') {
        console.log('Parent: Iframe is ready')
        const window = iframeRef.current?.contentWindow
        if (window) {
          window.postMessage(params, '*')
        }
      }
    }

    window.addEventListener('message', handleIframeMessage)

    return () => {
      window.removeEventListener('message', handleIframeMessage)
    }
  }, [params])

  useEffect(() => {
    const window = iframeRef.current?.contentWindow
    if (window) {
      window.postMessage(params, '*')
    }
  }, [params])

  if (!isConsentAccepted) {
    return (
      <Disclaimer
        title="Note"
        content={<WidgetDisclaimer widgetName="Lifi Widget" />}
        onAccept={onAccept}
        buttonText="Continue"
      />
    )
  }

  const safeAppData = getEmptySafeApp(LIFI_WIDGET_URL)

  return (
    <Box className={css.swapWidget} id="lifiWidget">
      <AppFrame
        appUrl={safeAppData.url}
        allowedFeaturesList="clipboard-read; clipboard-write"
        safeAppFromManifest={safeAppData}
        isNativeEmbed
      />
    </Box>
  )
}

export default LifiSwapWidget
