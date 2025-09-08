import { type ReactElement, useEffect } from 'react'
import { BEAMER_SELECTOR, loadBeamer } from '@/services/beamer'
import { useAppSelector } from '@/store'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { ListItem, Stack, SvgIcon, Link } from '@mui/material'
import DebugToggle from '../DebugToggle'
import { IS_PRODUCTION } from '@/config/constants'
import { useCurrentChain } from '@/hooks/useChains'
import IndexingStatus from '@/components/sidebar/IndexingStatus'
import { Typography } from '@/components/common/Mui'
import ProtofireLogo from '@/public/images/protofire-logo.svg'
import Track from '@/components/common/Track'
import { SidebarList, SidebarListItemButton, SidebarListItemIcon, SidebarListItemText } from '../SidebarList'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
import { NEW_SUGGESTION_FORM } from '@/config/constants.extra'
import { OVERVIEW_EVENTS } from '@/services/analytics'

import HelpCenterIcon from '@/public/images/sidebar/help-center.svg'
import SuggestionIcon from '@/public/images/sidebar/lightbulb_icon.svg'
import darkPalette from '@/components/theme/darkPalette'

const SidebarFooter = (): ReactElement => {
  const chain = useCurrentChain()
  const hasBeamerConsent = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.UPDATES))

  useEffect(() => {
    // Initialise Beamer when consent was previously given
    if (hasBeamerConsent && chain?.shortName) {
      loadBeamer(chain.shortName)
    }
  }, [hasBeamerConsent, chain?.shortName])

  return (
    <SidebarList>
      {!IS_PRODUCTION && (
        <ListItem disablePadding>
          <DebugToggle />
        </ListItem>
      )}

      <Track {...OVERVIEW_EVENTS.HELP_CENTER}>
        <ListItem disablePadding>
          <a target="_blank" rel="noopener noreferrer" href={HELP_CENTER_URL} style={{ width: '100%' }}>
            <SidebarListItemButton>
              <SidebarListItemIcon color="primary">
                <HelpCenterIcon />
              </SidebarListItemIcon>
              <SidebarListItemText data-testid="list-item-need-help" bold>
                Need help?
              </SidebarListItemText>
            </SidebarListItemButton>
          </a>
        </ListItem>
      </Track>
      <Track {...OVERVIEW_EVENTS.SUGGESTIONS}>
        <ListItem style={{ marginTop: '8px' }} disablePadding>
          <a target="_blank" rel="noopener noreferrer" href={NEW_SUGGESTION_FORM} style={{ width: '100%' }}>
            <SidebarListItemButton id={BEAMER_SELECTOR} style={{ backgroundColor: '#12FF80', color: 'black' }}>
              <SidebarListItemIcon color="primary">
                <SuggestionIcon />
              </SidebarListItemIcon>
              <SidebarListItemText bold>New Features Suggestion?</SidebarListItemText>
            </SidebarListItemButton>
          </a>
        </ListItem>
      </Track>

      <ListItem>
        <SidebarListItemText>
          <Typography variant="caption">
            Supported by{' '}
            <SvgIcon
              component={ProtofireLogo}
              inheritViewBox
              fontSize="small"
              sx={{ verticalAlign: 'middle', mx: 0.5 }}
            />
            <Link
              href="https://protofire.io/services/solution/safe-deployment"
              sx={{ color: darkPalette.primary.main, textDecoration: 'none' }}
            >
              Protofire
            </Link>
          </Typography>
        </SidebarListItemText>
      </ListItem>

      {!IS_PRODUCTION && (
        <Stack style={{ display: 'block' }} direction="row" alignItems="center" spacing={1} mx={1}>
          <IndexingStatus />
        </Stack>
      )}
    </SidebarList>
  )
}

export default SidebarFooter
