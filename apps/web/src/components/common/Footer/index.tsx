import type { ReactElement, ReactNode } from 'react'
import { SvgIcon, Typography } from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'
import Link from 'next/link'
import { useRouter } from 'next/router'
import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'
import packageJson from '../../../../package.json'
import ExternalLink from '../ExternalLink'
import MUILink from '@mui/material/Link'
import ProtofireLogo from '@/public/images/protofire-logo.svg'
import { PROTOFIRE_SUPPORT_LINK } from '@/config/constants.extra'

const footerPages = [AppRoutes.welcome.index, AppRoutes.settings.index, AppRoutes.cookie, AppRoutes.terms]

const FooterLink = ({ children, href }: { children: ReactNode; href: string }): ReactElement => {
  return href ? (
    <Link href={href} passHref legacyBehavior>
      <MUILink>{children}</MUILink>
    </Link>
  ) : (
    <MUILink>{children}</MUILink>
  )
}

const Footer = (): ReactElement | null => {
  const router = useRouter()

  if (!footerPages.some((path) => router.pathname.startsWith(path))) {
    return null
  }

  const getHref = (path: string): string => {
    return router.pathname === path ? '' : path
  }

  return (
    <footer className={css.container}>
      <ul>
        <>
          <li>
            <Typography variant="caption">© {new Date().getFullYear()} Pharos Safe</Typography>
          </li>
          <li>
            <FooterLink href={getHref(AppRoutes.terms)}>Terms</FooterLink>
          </li>
          <li>
            <FooterLink href={getHref(AppRoutes.cookie)}>Cookie policy</FooterLink>
          </li>
          <li>
            <FooterLink href={getHref(AppRoutes.settings.index)}>Preferences</FooterLink>
          </li>
          <li>
            <ExternalLink href={PROTOFIRE_SUPPORT_LINK} noIcon sx={{ span: { textDecoration: 'underline' } }}>
              Help
            </ExternalLink>
          </li>
        </>
        <li>
          <ExternalLink href={`${packageJson.homepage}/releases/tag/v${packageJson.version}`} noIcon>
            <SvgIcon component={GitHubIcon} inheritViewBox fontSize="inherit" sx={{ mr: 0.5 }} /> v{packageJson.version}
          </ExternalLink>
        </li>
        <li>
          <Typography variant="caption">
            Supported by{' '}
            <SvgIcon
              component={ProtofireLogo}
              inheritViewBox
              fontSize="small"
              sx={{ verticalAlign: 'middle', mx: 0.5 }}
            />
            <ExternalLink href="https://protofire.io" sx={{ textDecoration: 'none' }}>
              Protofire
            </ExternalLink>
          </Typography>
        </li>
      </ul>
    </footer>
  )
}

export default Footer
