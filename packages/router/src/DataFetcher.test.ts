// /**
//  * @jest-environment node
//  */
// // Needed for viem, otherwise throwing "TextEncoder is not defined"
// import { ChainId } from '@sushiswap/chain'
// import { Native, USDC } from '@sushiswap/currency'
// import { createClient } from '@sushiswap/database'
// import { createPublicClient, http } from 'viem'
// import { mainnet } from 'viem/chains'

// import { DataFetcher } from './DataFetcher'
// import { LiquidityProviders } from './liquidity-providers/LiquidityProvider'
// import { NativeWrapProvider } from './liquidity-providers/NativeWrapProvider'
// import { SushiProvider } from './liquidity-providers/Sushi'
// jest.setTimeout(10000)

// const databaseClient = await createClient()
// const DATA_FETCHER = new DataFetcher(
//   ChainId.ETHEREUM,
//   createPublicClient({
//     chain: mainnet,
//     transport: http(`${mainnet.rpcUrls.alchemy.http}/${process.env.ALCHEMY_ID}`),
//   }),
//   databaseClient
// )
// const DEFAULT_PROVIDERS = [LiquidityProviders.SushiSwap]
// beforeAll(async () => {
//   expect(DATA_FETCHER).toBeInstanceOf(DataFetcher)
//   DATA_FETCHER.startDataFetching(DEFAULT_PROVIDERS)
//   await new Promise((r) => setTimeout(r, 6000))
// })

// afterAll(() => {
//   DATA_FETCHER.stopDataFetching()
// })

// describe('DataFetcher', () => {
//   const token0 = Native.onChain(ChainId.ETHEREUM)
//   const token1 = USDC[ChainId.ETHEREUM]

//   it('should have providers', async () => {
//     const providers = DATA_FETCHER.providers
//     expect(providers.length).toBe(2)
//     expect(providers[0]).toBeInstanceOf(NativeWrapProvider)
//     expect(providers[1]).toBeInstanceOf(SushiProvider)
//   })

//   it.skip(`should fetch pools for ${token0.symbol} and ${token1.symbol}`, async () => {
//     const initialPoolCount = DATA_FETCHER.getCurrentPoolCodeMap(token0, token1).size
//     expect(initialPoolCount).toBeGreaterThan(5)

//     DATA_FETCHER.fetchPoolsForToken(token0, token1)
//     await new Promise((r) => setTimeout(r, 6000)) // wait for on-demand pools to be fetched
//     const totalPoolCount = DATA_FETCHER.getCurrentPoolCodeMap(token0, token1).size
//     expect(totalPoolCount).toBeGreaterThan(5)
//     expect(totalPoolCount).toBeGreaterThan(initialPoolCount)
//   })

//   it.skip(`should clear pools on demand pools`, async () => {
//     const poolCount = DATA_FETCHER.getCurrentPoolCodeMap(token0, token1).size
//     global.Date.now = jest.fn(() => new Date().getTime() + 1000 * 75)
//     await new Promise((r) => setTimeout(r, 6000)) // wait for unused on-demand pools to be cleared

//     const currentPoolCount = DATA_FETCHER.getCurrentPoolCodeMap(token0, token1).size
//     expect(currentPoolCount).toBeLessThan(poolCount)
//   })

//   it.skip('should have a block', async () => {
//     const blockNumber = DATA_FETCHER.getLastUpdateBlock()
//     await new Promise((r) => setTimeout(r, 3000))
//     expect(blockNumber).toBeGreaterThan(0)
//     expect(blockNumber).not.toBeUndefined
//   })
// })

export {}