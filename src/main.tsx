import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/styles/globals.scss'

// Import Orbis
import { Orbis } from '@orbisclub/orbis-sdk'
import { OrbisProvider } from './contexts/orbis'
const OrbisClient = new Orbis()

// Import Wagmi
import { mainnet, configureChains, createClient, WagmiConfig } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const { chains, provider } = configureChains(
  [mainnet],
  [
    alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_KEY }),
    infuraProvider({ apiKey: import.meta.env.VITE_INFURA_KEY }),
    publicProvider()
  ]
)

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: import.meta.env.VITE_APP_NAME
      }
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true
      }
    })
  ],
  provider
})

import { VocdoniProvider } from './contexts/vocdoni'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WagmiConfig client={wagmiClient}>
      <OrbisProvider orbis={OrbisClient} appContext="parallaxValidateTest">
        <VocdoniProvider>
          <App />
        </VocdoniProvider>
      </OrbisProvider>
    </WagmiConfig>
  </React.StrictMode>
)
