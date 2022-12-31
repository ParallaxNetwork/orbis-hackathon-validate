import {
  useContext,
  createContext,
  useState,
  useEffect,
  ReactNode,
  ReactElement
} from 'react'
import { usePrevious } from 'react-use'
import { useAccount } from 'wagmi'
import { sleep } from '../utils/misc'

interface IOrbisContext {
  appContext: string
  orbis: IOrbis
  profile: IOrbisProfile | null
  hasLit: boolean
  setProfile: (profile: IOrbisProfile | null) => void
  connectOrbis: (provider: any, lit?: boolean) => Promise<void>
  connectLit: (provider: any) => Promise<{
    status?: number
    error?: any
    result?: string
  }>
  checkOrbisConnection: (options: {
    provider?: any
    autoConnect?: boolean
    lit?: boolean
  }) => Promise<void>
  disconnectOrbis: () => void
  getDid: (
    address: string | undefined,
    generateIfEmpty?: boolean
  ) => Promise<string>
}

const APP_CONTEXT = 'parallaxValidate'

const OrbisContext = createContext({} as IOrbisContext)

const OrbisProvider = ({
  children,
  orbis,
  appContext = APP_CONTEXT
}: {
  children?: ReactNode
  orbis: IOrbis
  appContext?: string
}): ReactElement => {
  const [profile, setProfile] = useState<IOrbisProfile | null>(null)
  const [hasLit, setHasLit] = useState(false)

  const { address, isDisconnected } = useAccount()
  const prevAddress = usePrevious(address)

  const connectOrbis: IOrbisContext['connectOrbis'] = async (
    provider,
    lit = false
  ) => {
    const res = await orbis.connect_v2({
      provider,
      chain: 'ethereum',
      lit
    })

    if (res.status !== 200) {
      await sleep(2000)
      await connectOrbis(provider)
    } else {
      const { data } = await orbis.getProfile(res.did)
      setProfile(data)
    }
  }

  const connectLit: IOrbisContext['connectLit'] = async (provider) => {
    const res = await orbis.connectLit(provider)
    setHasLit(res.status === 200)
    return res
  }

  const checkOrbisConnection: IOrbisContext['checkOrbisConnection'] = async ({
    provider = null,
    autoConnect = false,
    lit = false
  }) => {
    const res = await orbis.isConnected()

    if (res.status === 200) {
      const { data } = await orbis.getProfile(res.did)
      setHasLit(res?.details?.hasLit)
      setProfile(data)
    } else if (autoConnect && provider) {
      await connectOrbis(provider, lit)
    }
  }

  const disconnectOrbis: IOrbisContext['disconnectOrbis'] = () => {
    const res = orbis.logout()

    if (res.status === 200) {
      setProfile(null)
      setHasLit(false)
    }
  }

  const getDid = async (
    address: string | undefined,
    generateIfEmpty = false
  ) => {
    if (!address) return null

    const { data, error } = await orbis.getDids(address)

    if (!error && data.length) {
      return data[0].did
    } else if (generateIfEmpty) {
      return `did:pkh:eip155:1:${address.toLowerCase()}`
    }

    return null
  }

  useEffect(() => {
    if (isDisconnected || (address && prevAddress && address !== prevAddress)) {
      disconnectOrbis()
    }
  }, [isDisconnected, address, prevAddress])

  return (
    <OrbisContext.Provider
      value={{
        appContext,
        orbis,
        profile,
        hasLit,
        setProfile,
        connectOrbis,
        connectLit,
        checkOrbisConnection,
        disconnectOrbis,
        getDid
      }}
    >
      {children}
    </OrbisContext.Provider>
  )
}

const useOrbis = () => useContext(OrbisContext)

export { OrbisProvider, useOrbis }
