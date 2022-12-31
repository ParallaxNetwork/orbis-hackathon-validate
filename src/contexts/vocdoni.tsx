import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { VocdoniSDKClient, EnvOptions, AccountData } from '@vocdoni/sdk'
import { useSigner } from 'wagmi'
import { Signer } from '@wagmi/core'

interface IVocdoniContext {
  client: VocdoniSDKClient | undefined
  account: AccountData | undefined
  requestTokens: () => Promise<AccountData | undefined>
}

const VocdoniContext = createContext({} as IVocdoniContext)

const VocdoniProvider = ({ children }: { children: ReactNode }) => {
  const { data: signer } = useSigner()
  const [client, setClient] = useState<VocdoniSDKClient>()
  const [account, setAccount] = useState<AccountData>()

  const initVocdoniSDK = async () => {
    const _client = new VocdoniSDKClient({
      env: EnvOptions.DEV,
      wallet: signer as Signer
    })

    setClient(_client)
  }

  const createAccount = async () => {
    if (!client) return
    const info = await client.createAccount()
    setAccount(info)
  }

  const requestTokens = async () => {
    if (!client) return
    const info = await client.fetchAccountInfo()
    if (info.balance === 0) {
      const res = await client.collectFaucetTokens()
      return res
    }
    return info
  }

  useEffect(() => {
    if (signer) initVocdoniSDK()
  }, [signer])

  useEffect(() => {
    if (client) createAccount()
  }, [client])

  return (
    <VocdoniContext.Provider value={{ client, account, requestTokens }}>
      {children}
    </VocdoniContext.Provider>
  )
}

const useVocdoni = () => useContext(VocdoniContext)

export { VocdoniProvider, useVocdoni }
