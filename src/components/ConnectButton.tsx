import { useState } from 'react'
import { useConnect, Connector } from 'wagmi'
import { useOrbis } from '../contexts/orbis'

import { CgSpinner } from 'react-icons/cg'

import Dialog from './shared/Dialog'
import Loading from './Loading'

const ConnectButton = () => {
  const { connectAsync, connectors, isLoading, pendingConnector } = useConnect()
  const { checkOrbisConnection } = useOrbis()

  const [open, setOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnection = async (connector: Connector) => {
    try {
      const res = await connectAsync({ connector })

      if (!res || !res.account) return
      
      setIsConnecting(true)

      await checkOrbisConnection({
        provider: res?.provider,
        autoConnect: true
      })

      setIsConnecting(false)
    } catch (error) {
      console.log('error', error)
    }
  }

  return (
    <>
      <h1 className="leading-none text-large font-title mb-2">
        Want to discuss your idea?
      </h1>
      <p className="text-secondary text-small mb-4">
        Connect your wallet to join the community in Validate
      </p>
      <button
        className="btn btn-primary btn-large"
        onClick={() => setOpen(true)}
      >
        Connect Wallet
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="w-[320px] p-6">
          <h1 className="text-large font-title text-center mb-2">
            Connect your wallet
          </h1>
          <p className="text-secondary text-small text-center mb-6">
            Select a wallet provider to connect to Validate
          </p>
          {isConnecting ? (
            <Loading text="Waiting for sign..." />
          ) : (
            <div className="flex flex-col gap-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  className="btn btn-primary"
                  disabled={!connector.ready}
                  onClick={() => handleConnection(connector)}
                >
                  {isLoading && connector.id === pendingConnector?.id ? (
                    <CgSpinner className="animate-spin" size="1.5rem" />
                  ) : (
                    <span>{connector.name}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </>
  )
}

export default ConnectButton
