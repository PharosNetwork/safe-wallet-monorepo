import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@mui/material'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { OZ_SAFE_UTILS_URL, PROTOFIRE_SAFE_UTILS_URL } from '@/config/constants.extra'

const TX_DECODER_URL = 'https://transaction-decoder.pages.dev'

const DecoderLinks = () => {
  const isProtofireSafeUtils = useHasFeature(FEATURES.PROTOFIRE_FORK_OZ_SAFE_UTILS)
  const isOzSafeUtils = useHasFeature(FEATURES.OZ_SAFE_UTILS)

  const safeUtilsUrl = isProtofireSafeUtils ? PROTOFIRE_SAFE_UTILS_URL : isOzSafeUtils ? OZ_SAFE_UTILS_URL : null

  return (
    <Typography variant="body2" color="primary.light" mb={3}>
      Cross-verify your transaction data with external tools like{' '}
      {safeUtilsUrl && (
        <>
          <ExternalLink href={safeUtilsUrl}>Safe Utils</ExternalLink> and{' '}
        </>
      )}
      <ExternalLink href={TX_DECODER_URL}>Transaction Decoder</ExternalLink>.
    </Typography>
  )
}

export default DecoderLinks
