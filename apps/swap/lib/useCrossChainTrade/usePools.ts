import { useQuery } from '@tanstack/react-query'
import { ChainId } from '@sushiswap/chain'
import { useCallback } from 'react'
import { getPairs } from './getPairs'
import { getConstantProductPools } from './getConstantProductPools'
import { getStablePools } from './getStablePools'
import { Type } from '@sushiswap/currency'
import { getCurrencyCombinations } from '@sushiswap/router'
import { ConstantProductPool, Pair, StablePool, TradeType } from '@sushiswap/amm'
import { ConstantProductPoolState, PairState, StablePoolState } from '@sushiswap/wagmi'

interface UsePoolsParams {
  chainId: ChainId
  currencyA: Type | undefined
  currencyB: Type | undefined
  tradeType?: TradeType
}

export type UsePoolsReturn = (Pair | ConstantProductPool | StablePool)[] | undefined
type UsePoolsQuerySelect = (data: Awaited<ReturnType<typeof queryFn>>) => UsePoolsReturn

const queryFn = async ({ currencyA, currencyB, chainId, tradeType = TradeType.EXACT_INPUT }: UsePoolsParams) => {
  const [currencyIn, currencyOut] =
    tradeType === TradeType.EXACT_INPUT ? [currencyA, currencyB] : [currencyB, currencyA]

  const currencyCombinations =
    currencyIn && currencyOut && chainId ? getCurrencyCombinations(chainId, currencyIn, currencyOut) : []

  const [pairs, constantProductPools, stablePools] = await Promise.all([
    getPairs(chainId, currencyCombinations),
    getConstantProductPools(chainId, currencyCombinations),
    getStablePools(chainId, currencyCombinations),
  ])

  return [...pairs, ...constantProductPools, ...stablePools]
}

export const usePoolsQuery = (variables: UsePoolsParams, select: UsePoolsQuerySelect) => {
  return useQuery({
    queryKey: ['usePools', { chainId: variables.chainId }],
    queryFn: async () => queryFn(variables),
    select,
  })
}

export const usePools = (variables: UsePoolsParams) => {
  const select: UsePoolsQuerySelect = useCallback((data) => {
    return Object.values(
      data
        .filter(
          (
            result
          ): result is
            | [PairState.EXISTS, Pair]
            | [ConstantProductPoolState.EXISTS, ConstantProductPool]
            | [StablePoolState.EXISTS, StablePool] =>
            Boolean(result[0] === PairState.EXISTS && result[1]) ||
            Boolean(result[0] === ConstantProductPoolState.EXISTS && result[1]) ||
            Boolean(result[0] === StablePoolState.EXISTS && result[1])
        )
        .map(([, pair]) => pair)
    )
  }, [])

  return usePoolsQuery(variables, select)
}
