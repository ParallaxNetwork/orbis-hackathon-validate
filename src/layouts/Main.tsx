import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAccount, useSigner } from 'wagmi'
import { AppDataProvider } from '../contexts/appData'
import { useOrbis } from '../contexts/orbis'
import AppNav from '../components/AppNav'
import Sidebar from '../components/Sidebar'

const Main = () => {
  const { isConnected } = useAccount()
  const { data: signer } = useSigner()
  const { checkOrbisConnection } = useOrbis()

  useEffect(() => {
    if (isConnected && signer) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      checkOrbisConnection({ provider: signer?.provider?.provider })
    }
  }, [isConnected, signer])

  return (
    <AppDataProvider>
      <div className="container flex min-h-screen divide-x divide-muted">
        <header className="shrink-0">
          <AppNav />
        </header>
        <main className="grow">
          <Outlet />
        </main>
        <aside className="shrink-0 hidden xl:block xl:min-w-[375px]">
          <Sidebar />
        </aside>
      </div>
    </AppDataProvider>
  )
}

export default Main
