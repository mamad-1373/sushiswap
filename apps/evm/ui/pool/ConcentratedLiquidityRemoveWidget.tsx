'use client'

import { TransactionRequest } from '@ethersproject/providers'
import { CogIcon } from '@heroicons/react/24/outline'
import { Amount, Type } from '@sushiswap/currency'
import { JSBI, Percent, ZERO } from '@sushiswap/math'
import {
  CardContent,
  CardCurrencyAmountItem,
  CardFooter,
  CardGroup,
  CardLabel,
  IconButton,
  SettingsModule,
  SettingsOverlay,
} from '@sushiswap/ui'
import { Button } from '@sushiswap/ui/components/button'
import { createToast } from '@sushiswap/ui/components/toast'
import { isSushiSwapV3ChainId, NonfungiblePositionManager, Position, SushiSwapV3ChainId } from '@sushiswap/v3-sdk'
import { _useSendTransaction as useSendTransaction, useNetwork } from '@sushiswap/wagmi'
import { SendTransactionResult } from '@sushiswap/wagmi/actions'
import { ConcentratedLiquidityPosition, useTransactionDeadline } from '@sushiswap/wagmi/future/hooks'
import { getV3NonFungiblePositionManagerConractConfig } from '@sushiswap/wagmi/future/hooks/contracts/useV3NonFungiblePositionManager'
import { Checker } from '@sushiswap/wagmi/future/systems'
import { unwrapToken } from 'lib/functions'
import { useSlippageTolerance } from 'lib/hooks/useSlippageTolerance'
import React, { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react'

interface ConcentratedLiquidityRemoveWidget {
  token0: Type | undefined
  token1: Type | undefined
  account: string | undefined
  chainId: SushiSwapV3ChainId
  positionDetails: ConcentratedLiquidityPosition | undefined
  position: Position | undefined
  onChange?(val: string): void
}

export const ConcentratedLiquidityRemoveWidget: FC<ConcentratedLiquidityRemoveWidget> = ({
  token0,
  token1,
  account,
  onChange,
  chainId,
  position,
  positionDetails,
}) => {
  const { chain } = useNetwork()
  const [value, setValue] = useState<string>('0')
  const [slippageTolerance] = useSlippageTolerance('removeLiquidity')
  const { data: deadline } = useTransactionDeadline({ chainId })

  const slippagePercent = useMemo(() => {
    return new Percent(Math.floor(+(slippageTolerance === 'AUTO' ? '0.5' : slippageTolerance) * 100), 10_000)
  }, [slippageTolerance])

  const _onChange = useCallback(
    (val: string) => {
      setValue(val)
      if (onChange) {
        onChange(val)
      }
    },
    [onChange]
  )

  const onSettled = useCallback(
    (data: SendTransactionResult | undefined) => {
      if (!data || !position) return

      const ts = new Date().getTime()
      void createToast({
        account,
        type: 'burn',
        chainId,
        txHash: data.hash,
        promise: data.wait(),
        summary: {
          pending: `Removing liquidity from the ${position.amount0.currency.symbol}/${position.amount1.currency.symbol} pair`,
          completed: `Successfully removed liquidity from the ${position.amount0.currency.symbol}/${position.amount1.currency.symbol} pair`,
          failed: 'Something went wrong when removing liquidity',
        },
        timestamp: ts,
        groupTimestamp: ts,
      })
    },
    [position, account, chainId]
  )

  const [feeValue0, feeValue1] = useMemo(() => {
    if (positionDetails && token0 && token1) {
      const feeValue0 = positionDetails.fees
        ? Amount.fromRawAmount(token0, JSBI.BigInt(positionDetails.fees[0]))
        : undefined
      const feeValue1 = positionDetails.fees
        ? Amount.fromRawAmount(token1, JSBI.BigInt(positionDetails.fees[1]))
        : undefined

      return [feeValue0, feeValue1]
    }

    return [undefined, undefined]
  }, [positionDetails, token0, token1])

  const prepare = useCallback(
    async (setRequest: Dispatch<SetStateAction<(TransactionRequest & { to: string }) | undefined>>) => {
      const liquidityPercentage = new Percent(value, 100)
      const discountedAmount0 = position ? liquidityPercentage.multiply(position.amount0.quotient).quotient : undefined
      const discountedAmount1 = position ? liquidityPercentage.multiply(position.amount1.quotient).quotient : undefined

      const liquidityValue0 =
        token0 && discountedAmount0 ? Amount.fromRawAmount(unwrapToken(token0), discountedAmount0) : undefined
      const liquidityValue1 =
        token1 && discountedAmount1 ? Amount.fromRawAmount(unwrapToken(token1), discountedAmount1) : undefined

      if (
        token0 &&
        token1 &&
        position &&
        account &&
        positionDetails &&
        deadline &&
        liquidityValue0 &&
        liquidityValue1 &&
        liquidityPercentage.greaterThan(ZERO) &&
        isSushiSwapV3ChainId(chainId)
      ) {
        const { calldata, value: _value } = NonfungiblePositionManager.removeCallParameters(position, {
          tokenId: positionDetails.tokenId.toString(),
          liquidityPercentage,
          slippageTolerance: slippagePercent,
          deadline: deadline.toString(),
          collectOptions: {
            expectedCurrencyOwed0: feeValue0 ?? Amount.fromRawAmount(liquidityValue0.currency, 0),
            expectedCurrencyOwed1: feeValue1 ?? Amount.fromRawAmount(liquidityValue1.currency, 0),
            recipient: account,
          },
        })

        console.debug({
          tokenId: positionDetails.tokenId.toString(),
          liquidityPercentage,
          slippageTolerance: slippagePercent,
          deadline: deadline.toString(),
          collectOptions: {
            expectedCurrencyOwed0: feeValue0 ?? Amount.fromRawAmount(liquidityValue0.currency, 0),
            expectedCurrencyOwed1: feeValue1 ?? Amount.fromRawAmount(liquidityValue1.currency, 0),
            recipient: account,
          },
        })

        setRequest({
          to: getV3NonFungiblePositionManagerConractConfig(chainId).address,
          data: calldata,
          value: _value,
        })
      }
    },
    [
      account,
      chainId,
      deadline,
      feeValue0,
      feeValue1,
      position,
      positionDetails,
      slippagePercent,
      token0,
      token1,
      value,
    ]
  )

  const { sendTransaction, isLoading: isWritePending } = useSendTransaction({
    chainId,
    prepare,
    onSettled,
    onSuccess: () => {
      setValue('0')
    },
    enabled: +value > 0 && chainId === chain?.id,
  })

  return (
    <>
      <CardContent>
        <CardGroup>
          <CardLabel>Amount</CardLabel>
          <div className="p-3 pb-2 space-y-2 overflow-hidden bg-white rounded-xl dark:bg-secondary border border-accent">
            <div className="flex justify-between gap-4">
              <div>
                <h1 className="py-1 text-3xl text-gray-900 dark:text-slate-50">{value}%</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={value === '25' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => _onChange('25')}
                  testId="liquidity-25"
                >
                  25%
                </Button>
                <Button
                  variant={value === '50' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => _onChange('50')}
                  testId="liquidity-50"
                >
                  50%
                </Button>
                <Button
                  variant={value === '75' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => _onChange('75')}
                  testId="liquidity-75"
                >
                  75%
                </Button>
                <Button
                  variant={value === '100' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => _onChange('100')}
                  testId="liquidity-max"
                >
                  Max
                </Button>
                <SettingsOverlay
                  options={{
                    slippageTolerance: {
                      storageKey: 'removeLiquidity',
                      defaultValue: '0.5',
                      title: 'Remove Liquidity Slippage',
                    },
                  }}
                  modules={[SettingsModule.SlippageTolerance]}
                >
                  <IconButton size="sm" name="Settings" icon={CogIcon} variant="secondary" className="!rounded-xl" />
                </SettingsOverlay>
              </div>
            </div>
            <div className="px-1 pt-2 pb-3">
              <input
                value={value}
                onChange={(e) => _onChange(e.target.value)}
                type="range"
                min="1"
                max="100"
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg dark:bg-gray-700"
              />
            </div>
          </div>
        </CardGroup>
        <CardGroup>
          <CardLabel>{"You'll"} receive</CardLabel>
          <CardCurrencyAmountItem amount={position?.amount0.multiply(value).divide(100)} />
          <CardCurrencyAmountItem amount={position?.amount1.multiply(value).divide(100)} />
        </CardGroup>
        <CardGroup>
          <CardLabel>{"You'll"} receive collected fees</CardLabel>
          <CardCurrencyAmountItem amount={feeValue0?.multiply(value).divide(100)} />
          <CardCurrencyAmountItem amount={feeValue1?.multiply(value).divide(100)} />
        </CardGroup>
      </CardContent>
      <CardFooter>
        <Checker.Connect fullWidth variant="outline" size="xl">
          <Checker.Network fullWidth variant="outline" size="xl" chainId={chainId}>
            <Button
              size="xl"
              loading={isWritePending}
              disabled={+value === 0}
              fullWidth
              onClick={() => sendTransaction?.()}
              testId="remove-or-add-liquidity"
            >
              {+value === 0 ? 'Enter Amount' : 'Remove'}
            </Button>
          </Checker.Network>
        </Checker.Connect>
      </CardFooter>
    </>
  )
}
