import { useCallback } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

const LIFI_SWAPS_CONSENT_STORAGE_KEY = 'lifiDisclaimerAcceptedV1'

const useLifiSwapConsent = (): {
  isConsentAccepted: boolean
  onAccept: () => void
} => {
  const [isConsentAccepted = false, setIsConsentAccepted] = useLocalStorage<boolean>(LIFI_SWAPS_CONSENT_STORAGE_KEY)

  const onAccept = useCallback(() => {
    setIsConsentAccepted(true)
  }, [setIsConsentAccepted])

  return {
    isConsentAccepted,
    onAccept,
  }
}

export default useLifiSwapConsent
