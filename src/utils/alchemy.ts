import { Network, Alchemy } from 'alchemy-sdk'

const settings = {
  apiKey: import.meta.env.VITE_ALCHEMY_KEY,
  network: Network.ETH_MAINNET
}

export const alchemy = new Alchemy(settings)
