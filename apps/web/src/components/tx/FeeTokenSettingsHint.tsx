import ErrorMessage from '@/components/tx/ErrorMessage'
import { AppRoutes } from '@/config/routes'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { Box, Link } from '@mui/material'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'

const hintBox = (body: ReactElement) => (
  <Box sx={{ mb: 'var(--space-2)' }}>
    <ErrorMessage level="info">{body}</ErrorMessage>
  </Box>
)

export const FeeTokenSettingsHint = (): ReactElement | null => {
  const router = useRouter()
  if (!useHasFeature(FEATURES.TEMPO_GAS_TOKEN)) {
    return null
  }
  return hintBox(
    <>
      You can change your preferred Tempo gas fee token in{' '}
      <Link
        component={NextLink}
        href={{ pathname: AppRoutes.settings.setup, query: router.query }}
        sx={{ fontWeight: 700 }}
      >
        Settings
      </Link>
      .
    </>,
  )
}

export const TempoGasTokenSafeCreationHint = (): ReactElement | null => {
  if (!useHasFeature(FEATURES.TEMPO_GAS_TOKEN)) {
    return null
  }
  return hintBox(
    <>
      To change Tempo gas token for safe deployment, select <strong>Pay Later</strong> and choose the preferred token in
      the <strong>Settings</strong>.
    </>,
  )
}
