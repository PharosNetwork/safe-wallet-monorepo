import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { useHasFeature } from '@/hooks/useChains'
import { useContext } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'

const useIsSwapFeatureEnabled = () => {
  const isBlockedCountry = useContext(GeoblockingContext)
  // Converted from NATIVE_SWAPS to NATIVE_SWAPS_LIFI for our lifi widget
  return useHasFeature(FEATURES.NATIVE_SWAPS_LIFI) && !isBlockedCountry
}

export default useIsSwapFeatureEnabled
