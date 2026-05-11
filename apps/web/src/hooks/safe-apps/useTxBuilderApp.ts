import { useRouter } from 'next/router'
import type { UrlObject } from 'url'

import { IS_PRODUCTION } from '@/config/constants'
import { AppRoutes } from '@/config/routes'

const TX_BUILDER_URL = IS_PRODUCTION
  ? 'https://apps.safe.protofire.io/tx-builder'
  : 'https://dev-apps.safe.protofire.io/tx-builder'

export const useTxBuilderApp = (): { link: UrlObject } => {
  const router = useRouter()

  return {
    link: {
      pathname: AppRoutes.apps.open,
      query: { safe: router.query.safe, appUrl: TX_BUILDER_URL },
    },
  }
}
