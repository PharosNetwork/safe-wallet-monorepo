import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  Paper,
  Grid,
} from '@mui/material'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { multicall } from '@safe-global/utils/utils/multicall'
import { getERC20TokenInfoOnChain } from '@/utils/tokens'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { Interface } from 'ethers'
import { useHasFeature, useCurrentChain } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import { formatVisualAmount, shortenAddress } from '@safe-global/utils/utils/formatters'
import { isWalletRejection } from '@/utils/wallets'
import { didRevert, didReprice, type EthersError } from '@/utils/ethers-utils'
import type { Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { isAddress, getAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'

// TODO: move to external source to prevent code edits
const TEMPO_FEE_TOKENS_TESTNET = [
  {
    name: 'PathUSD',
    address: '0x20c0000000000000000000000000000000000000' as `0x${string}`,
    decimals: 6,
    symbol: 'pathUSD',
  },
  {
    name: 'AlphaUSD',
    address: '0x20c0000000000000000000000000000000000001' as `0x${string}`,
    decimals: 6,
    symbol: 'alphaUSD',
  },
  {
    name: 'BetaUSD',
    address: '0x20c0000000000000000000000000000000000002' as `0x${string}`,
    decimals: 6,
    symbol: 'betaUSD',
  },
  {
    name: 'ThetaUSD',
    address: '0x20c0000000000000000000000000000000000003' as `0x${string}`,
    decimals: 6,
    symbol: 'thetaUSD',
  },
] as const

const TEMPO_FEE_TOKENS_MAINNET = [
  {
    name: 'PathUSD',
    address: '0x20c0000000000000000000000000000000000000' as `0x${string}`,
    decimals: 6,
    symbol: 'pathUSD',
  },
  {
    name: 'Bridged USDC (Stargate)',
    address: '0x20c000000000000000000000b9537d11c60e8b50' as `0x${string}`,
    decimals: 6,
    symbol: 'USDC.e',
  },
  {
    name: 'Bridged EURC (Stargate)',
    address: '0x20c0000000000000000000001621e21f71cf12fb' as `0x${string}`,
    decimals: 6,
    symbol: 'EURC.e',
  },
  {
    name: 'USDT0',
    address: '0x20c00000000000000000000014f22ca97301eb73' as `0x${string}`,
    decimals: 6,
    symbol: 'USDT0',
  },
  {
    name: 'Frax USD',
    address: '0x20c0000000000000000000003554d28269e0f3c2' as `0x${string}`,
    decimals: 6,
    symbol: 'frxUSD',
  },
  {
    name: 'Cap USD',
    address: '0x20c0000000000000000000000520792dcccccccc' as `0x${string}`,
    decimals: 6,
    symbol: 'cUSD',
  },
  {
    name: 'Staked Cap USD',
    address: '0x20c0000000000000000000008ee4fcff88888888' as `0x${string}`,
    decimals: 6,
    symbol: 'stcUSD',
  },
  {
    name: 'Generic USD',
    address: '0x20c0000000000000000000005c0bac7cef389a11' as `0x${string}`,
    decimals: 6,
    symbol: 'GUSD',
  },
] as const

type TokenWithBalance = Erc20Token & {
  balance: bigint
}

type TokenWithBalanceRow = TokenWithBalance & {
  balanceRetrieved: boolean
}

// Read more: https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#fee-payer-signature
const FEE_PRECOMPILE_ADDRESS = '0xfeec000000000000000000000000000000000000' as `0x${string}`

const FEE_PRECOMPILE_ABI = [
  'function setUserToken(address token)',
  'function userTokens(address user) view returns (address)',
] as const

const feePrecompile_interface = new Interface(FEE_PRECOMPILE_ABI)

const FEE_TOKEN_ERRORS = {
  FAILED_TO_FETCH_PREFERENCE: 'Failed to fetch current preference',
  PLEASE_SELECT_TOKEN: 'Please select a token',
  TRANSACTION_FAILED: 'Transaction failed',
  TRANSACTION_REJECTED: 'Transaction rejected',
  FAILED_TO_UPDATE: 'Failed to update preference. Please try again.',
  INVALID_TOKEN_ADDRESS: 'Invalid token address',
  FAILED_TO_FETCH_TOKEN_INFO: 'Failed to fetch token information. Please verify the address is a valid token.',
} as const

const CUSTOM_TOKEN_OPTION = 'CUSTOM_TOKEN' as const

const ZERO_BALANCE_SAVE_HINT = 'Cannot update preference to a token with zero balance. Add funds or pick another token.'

const useTempoFeeTokenBalances = (
  tempoFeeTokens: typeof TEMPO_FEE_TOKENS_TESTNET | typeof TEMPO_FEE_TOKENS_MAINNET,
) => {
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()
  const walletAddress = wallet?.address

  return useAsync<TokenWithBalanceRow[]>(async () => {
    if (!web3ReadOnly || !walletAddress) {
      return []
    }

    const tokenAddresses = tempoFeeTokens.map((token) => getAddress(token.address))

    const erc20Interface = ERC20__factory.createInterface()
    const balanceCalls = tokenAddresses.map((address) => ({
      to: address,
      data: erc20Interface.encodeFunctionData('balanceOf', [walletAddress]),
    }))

    const balanceResults = await multicall(web3ReadOnly, balanceCalls)

    return tempoFeeTokens.map((token, i) => {
      const normalizedTokenAddress = getAddress(token.address)
      const balanceResult = balanceResults[i]
      const balanceRetrieved = balanceResult?.success === true
      const balance = balanceRetrieved ? BigInt(balanceResult.returnData) : 0n

      return {
        address: normalizedTokenAddress,
        decimals: token.decimals,
        logoUri: '',
        name: token.name,
        symbol: token.symbol,
        type: 'ERC20' as const,
        balance,
        balanceRetrieved,
      }
    })
  }, [web3ReadOnly, walletAddress, tempoFeeTokens])
}

const useTempoUserPreference = () => {
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()
  const walletAddress = wallet?.address

  return useAsync<`0x${string}` | null>(
    async () => {
      if (!web3ReadOnly || !walletAddress) {
        return null
      }

      try {
        const data = feePrecompile_interface.encodeFunctionData('userTokens', [walletAddress])

        const result = await web3ReadOnly.call({
          to: FEE_PRECOMPILE_ADDRESS,
          data,
        })

        if (result === '0x' || result === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          return null
        }

        const address = feePrecompile_interface.decodeFunctionResult('userTokens', result)[0] as string

        if (address && address !== '0x0000000000000000000000000000000000000000') {
          const normalizedAddress = address.toLowerCase() as `0x${string}`
          return isAddress(normalizedAddress) ? normalizedAddress : null
        }

        return null
      } catch (e: any) {
        const isRevert = e?.code === 'CALL_EXCEPTION' || e?.reason?.includes('reverted')
        if (!isRevert) {
          throw e
        }
        return null
      }
    },
    [web3ReadOnly, walletAddress],
    false,
  )
}

const useCustomTokenInfo = (customTokenAddress: string | null) => {
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()
  const walletAddress = wallet?.address

  return useAsync<(TokenWithBalance & { balanceRetrieved: boolean }) | null>(
    async () => {
      if (!customTokenAddress || !web3ReadOnly || !walletAddress || !isAddress(customTokenAddress)) {
        return null
      }

      try {
        const normalizedAddress = getAddress(customTokenAddress)
        const tokenInfos = await getERC20TokenInfoOnChain(normalizedAddress)
        if (!tokenInfos || tokenInfos.length === 0) {
          return null
        }

        const tokenInfo = tokenInfos[0]
        const erc20Interface = ERC20__factory.createInterface()
        const balanceCall = {
          to: normalizedAddress,
          data: erc20Interface.encodeFunctionData('balanceOf', [walletAddress]),
        }

        const balanceResult = await multicall(web3ReadOnly, [balanceCall])
        const balanceRetrieved = balanceResult[0]?.success === true

        return {
          ...tokenInfo,
          name: tokenInfo.symbol,
          logoUri: '',
          type: 'ERC20',
          balance: balanceRetrieved ? BigInt(balanceResult[0].returnData) : 0n,
          balanceRetrieved,
        }
      } catch (e) {
        return null
      }
    },
    [customTokenAddress, web3ReadOnly, walletAddress],
    false,
  )
}

export const FeeTokenPreference = () => {
  const theme = useTheme()
  const showTokenAddressInMenu = useMediaQuery(theme.breakpoints.up('sm'))
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()
  const chain = useCurrentChain()
  const isEnabled = useHasFeature(FEATURES.TEMPO_GAS_TOKEN)
  const isWrongChain = useIsWrongChain()

  const isTestnet = chain?.shortName === 'tempo-moderato'
  const tempoFeeTokens = isTestnet ? TEMPO_FEE_TOKENS_TESTNET : TEMPO_FEE_TOKENS_MAINNET
  const [balances, balancesLoadError, loadingBalances] = useTempoFeeTokenBalances(tempoFeeTokens)
  const [currentPreference, preferenceError, loadingPreference] = useTempoUserPreference()
  const [selectedToken, setSelectedToken] = useState<`0x${string}` | '' | typeof CUSTOM_TOKEN_OPTION>('')
  const [customTokenAddress, setCustomTokenAddress] = useState<string>('')
  const [customTokenInfo, , loadingCustomToken] = useCustomTokenInfo(
    selectedToken === CUSTOM_TOKEN_OPTION ? customTokenAddress : null,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (wallet?.address) {
      setSelectedToken('')
      setCustomTokenAddress('')
      setError(undefined)
      setSuccess(false)
    }
  }, [wallet?.address])

  useEffect(() => {
    if (currentPreference && !selectedToken) {
      const isTempoToken = tempoFeeTokens.some(
        (token) => token.address.toLowerCase() === currentPreference.toLowerCase(),
      )
      if (isTempoToken) {
        setSelectedToken(currentPreference)
      } else {
        setSelectedToken(CUSTOM_TOKEN_OPTION)
        setCustomTokenAddress(currentPreference)
      }
    }
  }, [currentPreference, selectedToken, tempoFeeTokens])

  useEffect(() => {
    if (preferenceError) {
      setError(FEE_TOKEN_ERRORS.FAILED_TO_FETCH_PREFERENCE)
    }
  }, [preferenceError])

  if (!isEnabled) {
    return null
  }

  const tokenOptions = tempoFeeTokens.map((token) => {
    const tokenBalance = balances?.find((b) => sameAddress(b.address, token.address))
    const balanceRetrieved = Boolean(tokenBalance?.balanceRetrieved && !balancesLoadError)
    return {
      ...token,
      balance: tokenBalance?.balance ?? 0n,
      balanceRetrieved,
    }
  })

  const handleSave = async () => {
    if (isWrongChain) {
      setError('Please switch to the correct network before saving your preference.')
      return
    }

    let tokenAddress: `0x${string}` | null = null

    if (selectedToken === CUSTOM_TOKEN_OPTION) {
      if (!customTokenAddress || !isAddress(customTokenAddress)) {
        setError(FEE_TOKEN_ERRORS.INVALID_TOKEN_ADDRESS)
        return
      }
      if (!customTokenInfo) {
        setError(FEE_TOKEN_ERRORS.FAILED_TO_FETCH_TOKEN_INFO)
        return
      }
      tokenAddress = getAddress(customTokenAddress) as `0x${string}`
    } else if (selectedToken) {
      tokenAddress = selectedToken as `0x${string}`
    }

    if (!tokenAddress || !wallet?.address || !wallet?.provider || !web3ReadOnly) {
      setError(FEE_TOKEN_ERRORS.PLEASE_SELECT_TOKEN)
      return
    }

    setSaving(true)
    setError(undefined)
    setSuccess(false)

    try {
      const data = feePrecompile_interface.encodeFunctionData('setUserToken', [tokenAddress])

      const txHash = await wallet.provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: wallet.address,
            to: FEE_PRECOMPILE_ADDRESS,
            data,
            value: '0x0',
            // @ts-ignore - feeToken override for this transaction
            feeToken: tokenAddress,
          },
        ],
      })

      try {
        const receipt = await web3ReadOnly.waitForTransaction(txHash as string)

        if (!receipt) {
          setError(FEE_TOKEN_ERRORS.TRANSACTION_FAILED)
        } else if (didRevert(receipt)) {
          setError(FEE_TOKEN_ERRORS.TRANSACTION_FAILED)
        } else {
          setSuccess(true)
        }
      } catch (waitError: any) {
        const error = waitError as EthersError
        if (didReprice(error)) {
          setSuccess(true)
        } else {
          setError(waitError?.message || FEE_TOKEN_ERRORS.TRANSACTION_FAILED)
        }
      }
    } catch (err: any) {
      if (isWalletRejection(err) || err?.code === 4001) {
        setError(FEE_TOKEN_ERRORS.TRANSACTION_REJECTED)
      } else {
        setError(err?.message || FEE_TOKEN_ERRORS.FAILED_TO_UPDATE)
      }
    } finally {
      setSaving(false)
    }
  }

  const loading = loadingBalances || loadingPreference
  const isCustomTokenSelected = selectedToken === CUSTOM_TOKEN_OPTION
  const isValidCustomAddress = customTokenAddress && isAddress(customTokenAddress)

  const selectedPresetOption =
    selectedToken && selectedToken !== CUSTOM_TOKEN_OPTION
      ? tokenOptions.find((t) => sameAddress(t.address, selectedToken))
      : undefined

  const isPresetBlockedByZeroBalance =
    !balancesLoadError && Boolean(selectedPresetOption?.balanceRetrieved && selectedPresetOption.balance === 0n)

  const isCustomBlockedByZeroBalance = Boolean(
    customTokenInfo?.balanceRetrieved && !loadingCustomToken && customTokenInfo.balance === 0n,
  )

  const isSaveBlockedByZeroBalance = isPresetBlockedByZeroBalance || isCustomBlockedByZeroBalance

  return (
    <Paper data-testid="fee-token-preference-section" sx={{ padding: 4, mt: 2 }}>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
        }}
      >
        <Grid item lg={4} xs={12}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Fee Token Preference
          </Typography>
        </Grid>

        <Grid item xs>
          {wallet ? (
            <Box>
              <Typography mb={3}>
                Select your preferred token for paying transaction fees on Tempo. This preference will be used for all
                future transactions for the connected wallet.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(undefined)}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
                  Fee token preference updated successfully!
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="fee-token-label">Fee Token</InputLabel>
                <Select
                  labelId="fee-token-label"
                  label="Fee Token"
                  value={loading ? '' : selectedToken || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedToken(value as `0x${string}` | typeof CUSTOM_TOKEN_OPTION)
                    if (value !== CUSTOM_TOKEN_OPTION) {
                      setCustomTokenAddress('')
                    }
                    setSuccess(false)
                    setError(undefined)
                  }}
                  disabled={loading || saving}
                  startAdornment={
                    loading ? (
                      <InputAdornment position="start">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    ) : undefined
                  }
                >
                  {loading && (
                    <MenuItem disabled>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={16} />
                        <Typography>Loading...</Typography>
                      </Box>
                    </MenuItem>
                  )}
                  {!loading &&
                    tokenOptions.map((token) => {
                      const balanceLabel =
                        token.balanceRetrieved && !balancesLoadError
                          ? formatVisualAmount(token.balance.toString(), token.decimals)
                          : '—'

                      return (
                        <MenuItem key={token.address} value={token.address}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} width="100%">
                            <Box display="flex" alignItems="baseline" gap={1} minWidth={0}>
                              <Typography component="span">{token.name}</Typography>
                              {showTokenAddressInMenu && (
                                <Typography component="span" color="text.secondary">
                                  {shortenAddress(token.address)}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                              Balance: {balanceLabel}
                            </Typography>
                          </Box>
                        </MenuItem>
                      )
                    })}
                  {!loading && (
                    <MenuItem value={CUSTOM_TOKEN_OPTION}>
                      <Typography fontWeight={700}>Custom Token</Typography>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              {isCustomTokenSelected && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    label="Custom Token Address"
                    value={customTokenAddress}
                    onChange={(e) => {
                      setCustomTokenAddress(e.target.value)
                      setSuccess(false)
                      setError(undefined)
                    }}
                    disabled={saving || loadingCustomToken}
                    error={!!customTokenAddress && !isValidCustomAddress}
                    helperText={
                      customTokenAddress && !isValidCustomAddress
                        ? FEE_TOKEN_ERRORS.INVALID_TOKEN_ADDRESS
                        : loadingCustomToken
                          ? 'Loading token information...'
                          : customTokenInfo
                            ? customTokenInfo.balanceRetrieved
                              ? `${customTokenInfo.symbol} (${formatVisualAmount(
                                  customTokenInfo.balance.toString(),
                                  customTokenInfo.decimals,
                                )})`
                              : `${customTokenInfo.symbol} (balance unavailable)`
                            : customTokenAddress && isValidCustomAddress
                              ? FEE_TOKEN_ERRORS.FAILED_TO_FETCH_TOKEN_INFO
                              : 'Enter a valid token address'
                    }
                    InputProps={{
                      startAdornment: loadingCustomToken ? (
                        <InputAdornment position="start">
                          <CircularProgress size={20} />
                        </InputAdornment>
                      ) : undefined,
                    }}
                  />
                </FormControl>
              )}

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  alignItems: 'flex-start',
                }}
              >
                {isSaveBlockedByZeroBalance && (
                  <Typography variant="caption" color="text.secondary">
                    {ZERO_BALANCE_SAVE_HINT}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  {isWrongChain && <ChainSwitcher />}
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={
                      !selectedToken ||
                      saving ||
                      loading ||
                      isWrongChain ||
                      isSaveBlockedByZeroBalance ||
                      (isCustomTokenSelected && (!isValidCustomAddress || !customTokenInfo))
                    }
                    sx={{ minWidth: 120 }}
                  >
                    {saving ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Saving...
                      </>
                    ) : (
                      'Save Preference'
                    )}
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography>Please connect your wallet to configure fee token preference.</Typography>
          )}
        </Grid>
      </Grid>
    </Paper>
  )
}
