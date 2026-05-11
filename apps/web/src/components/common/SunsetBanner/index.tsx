import { type ReactElement } from 'react'
import { Typography } from '@mui/material'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useChainId from '@/hooks/useChainId'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { SUNSET_BANNERS } from '@/config/constants.extra'

const SunsetBanner = (): ReactElement | null => {
  const chainId = useChainId()
  const isSunsetBannerEnabled = useHasFeature(FEATURES.SUNSET_BANNER)
  const banner = SUNSET_BANNERS[chainId]

  if (!isSunsetBannerEnabled || !banner) return null

  return (
    <ErrorMessage level="warning" title={banner.title}>
      <Typography variant="body2">{banner.description}</Typography>
    </ErrorMessage>
  )
}

export default SunsetBanner
