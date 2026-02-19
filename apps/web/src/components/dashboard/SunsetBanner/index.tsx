import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { Typography } from '@mui/material'
import { FEATURES } from '@safe-global/utils/utils/chains'
import ExternalLink from '@/components/common/ExternalLink'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'

export const SunsetBanner = () => {
  const isSunsetBannerEnabled = useHasFeature(FEATURES.SUNSET_BANNER)
  const currentChain = useCurrentChain()

  if (!isSunsetBannerEnabled) return

  switch (currentChain?.chainId) {
    case '1672':
      return (
        <ErrorMessage level="warning" title={`${currentChain?.chainName} is now available on Safe Global`}>
          <Typography display="inline" mr={1}>
            {currentChain?.chainName} is now available on the official Safe interface at{' '}
            <ExternalLink href="https://app.safe.global/welcome" noIcon>
              app.safe.global
            </ExternalLink>
            ! <br /> Created safes are already available there; to transfer local data (address book, settings, and
            variables), use the Export/Import functionality found on the Settings {'>'}{' '}
            <Link style={{ fontWeight: 'bold' }} href={AppRoutes.settings.data}>
              Data page
            </Link>
            . Please finalize your transactions here until May 31st since they won&#39;t be migrated to Safe Canonical
            UI.
          </Typography>
        </ErrorMessage>
      )
    case '688689':
      return (
        <ErrorMessage level="warning" title={`${currentChain?.chainName} Support Sunsetting`}>
          <Typography display="inline" mr={1}>
            Dear users, Support for <b>{currentChain?.chainName}</b> will end soon. Please complete your pending
            transactions until <b>May 31st</b>.
          </Typography>
        </ErrorMessage>
      )
    default:
      return
  }
}
